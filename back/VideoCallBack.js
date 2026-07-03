const Pensioner = require("../models/Pensioner");

module.exports = (io) => {
  /* =====================================
      IN-MEMORY REPOSITORIES
  ===================================== */
  const users = new Map();
  const employees = new Map();
  const pensioners = new Map();
  const waitingQueue = [];
  const activeCalls = new Map();

  /* =====================================
      HELPER CORE UTILITIES
  ===================================== */
  const getFreeEmployees = () => {
    return [...employees.values()].filter(
      (employee) => employee.status === "free"
    );
  };

  const sendQueueUpdate = () => {
    io.emit("queue-updated", {
      waitingCalls: waitingQueue.length,
      onlineEmployees: employees.size,
      freeEmployees: getFreeEmployees().length,
      activeCalls: activeCalls.size,
    });
  };

  const setEmployeeBusy = (employeeId, pensionerId) => {
    const employee = employees.get(employeeId);
    if (!employee) return;

    employee.status = "busy";
    employee.currentCall = pensionerId;
    employees.set(employeeId, employee);
  };

  const setEmployeeFree = (employeeId) => {
    const employee = employees.get(employeeId);
    if (!employee) return;

    employee.status = "free";
    employee.currentCall = null;
    employees.set(employeeId, employee);
  };

  const removeWaitingCall = (pensionerId) => {
    const index = waitingQueue.findIndex(
      (item) => item.pensionerId === pensionerId
    );
    if (index !== -1) {
      waitingQueue.splice(index, 1);
    }
  };

  /* =====================================
      SOCKET HANDLERS ROOT ENTRY
  ===================================== */
  io.on("connection", (socket) => {
    console.log("Video Socket Active Connection:", socket.id);

    /* =====================================
        REGISTER USER
    ===================================== */
    socket.on("register-user", async (data) => {
      try {
        const { userId, role, fullName } = data;

        users.set(userId, {
          socketId: socket.id,
          userId,
          role,
        });

        if (role === "employee") {
          employees.set(userId, {
            socketId: socket.id,
            employeeId: userId,
            fullName: fullName || "Employee",
            status: "free",
            currentCall: null,
            connectedAt: new Date(),
            lastSeen: Date.now(),
          });

          console.log("Employee Registered Successfully:", userId);
          sendQueueUpdate();
          return;
        }

        pensioners.set(userId, {
          socketId: socket.id,
          pensionerId: userId,
          status: "waiting",
          connectedAt: new Date(),
          lastSeen: Date.now(),
        });

        console.log("Pensioner Registered Successfully:", userId);
        sendQueueUpdate();
      } catch (err) {
        console.error(err);
      }
    });

    /* =====================================
        REQUEST CALL
    ===================================== */
    socket.on("request-agent-call", async ({ pensionerId, signalData }) => {
      try {
        let pensionerName = pensionerId;

        try {
          const person = await Pensioner.findOne({
            $or: [
              { pensionerId },
              { faydaNumber: pensionerId },
            ],
          });

          if (person) {
            pensionerName =
              person.nameEng || person.nameAmh || pensionerId;
          }
        } catch (e) {}

        const freeEmployees = getFreeEmployees();

        if (freeEmployees.length === 0) {
          waitingQueue.push({
            pensionerId,
            pensionerName,
            signalData,
            requestedAt: new Date(),
          });

          socket.emit("all-agents-busy", {
            message: "All employees are busy. Please wait...",
          });

          sendQueueUpdate();
          return;
        }

        const employee = freeEmployees[0];
        io.to(employee.socketId).emit("incoming-call", {
          pensionerId,
          pensionerName,
          signalData,
        });

        waitingQueue.push({
          pensionerId,
          pensionerName,
          signalData,
          requestedAt: new Date(),
        });

        sendQueueUpdate();
      } catch (err) {
        console.error(err);
      }
    });

    /* =====================================
        ANSWER CALL
    ===================================== */
    socket.on("answer-call", ({ pensionerId, agentId, signal }) => {
      const employee = employees.get(agentId);
      const pensioner = pensioners.get(pensionerId);

      if (!employee || !pensioner) return;

      setEmployeeBusy(agentId, pensionerId);
      removeWaitingCall(pensionerId);

      activeCalls.set(pensionerId, {
        pensionerId,
        agentId,
        startedAt: new Date(),
      });

      io.to(pensioner.socketId).emit("agent-accepted", {
        agentId,
        signal,
      });

      sendQueueUpdate();
      console.log(`Call Connected via Signaling Channel: ${pensionerId} -> ${agentId}`);
    });

    /* =====================================
        REJECT CALL
    ===================================== */
    socket.on("reject-call", ({ pensionerId }) => {
      const pensioner = pensioners.get(pensionerId);

      if (pensioner) {
        io.to(pensioner.socketId).emit("call-rejected");
      }

      removeWaitingCall(pensionerId);
      io.emit("remove-call", { pensionerId });
      sendQueueUpdate();
    });

    /* =====================================
        END CALL
    ===================================== */
    socket.on("end-call", ({ pensionerId }) => {
      const call = activeCalls.get(pensionerId);
      if (!call) return;

      const employee = employees.get(call.agentId);
      const pensioner = pensioners.get(call.pensionerId);

      if (employee) {
        io.to(employee.socketId).emit("call-ended");
        setEmployeeFree(call.agentId);
      }

      if (pensioner) {
        io.to(pensioner.socketId).emit("call-ended");
      }

      activeCalls.delete(pensionerId);
      sendQueueUpdate();
      console.log("Session Call Destroyed & Closed:", pensionerId);
    });

    /* =====================================
        CANCEL CALL
    ===================================== */
    socket.on("cancel-call", ({ pensionerId }) => {
      removeWaitingCall(pensionerId);
      io.emit("remove-call", { pensionerId });
      sendQueueUpdate();
    });

    /* =====================================
        ASSIGN WAITING CALLS PIPELINE
    ===================================== */
    const assignWaitingCalls = () => {
      while (
        waitingQueue.length > 0 &&
        getFreeEmployees().length > 0
      ) {
        const call = waitingQueue.shift();
        const employee = getFreeEmployees()[0];

        if (!employee) break;

        io.to(employee.socketId).emit("incoming-call", {
          pensionerId: call.pensionerId,
          pensionerName: call.pensionerName,
          signalData: call.signalData,
        });
      }

      sendQueueUpdate();
    };

    /* =====================================
        EMPLOYEE READY OVERRIDE
    ===================================== */
    socket.on("employee-ready", ({ agentId }) => {
      setEmployeeFree(agentId);
      assignWaitingCalls();
    });

    /* =====================================
        HEARTBEAT LOGIC CHECKER
    ===================================== */
    socket.on("heartbeat", ({ userId }) => {
      const employee = employees.get(userId);
      if (employee) {
        employee.lastSeen = Date.now();
        employees.set(userId, employee);
      }

      const pensioner = pensioners.get(userId);
      if (pensioner) {
        pensioner.lastSeen = Date.now();
        pensioners.set(userId, pensioner);
      }
    });

    /* =====================================
        DISCONNECT AUTO CLEANUP PIPELINE
    ===================================== */
    socket.on("disconnect", () => {
      let linkedUserKey = null;

      for (let [uid, payload] of users.entries()) {
        if (payload.socketId === socket.id) {
          linkedUserKey = uid;
          users.delete(uid);
          break;
        }
      }

      if (linkedUserKey) {
        if (employees.has(linkedUserKey)) {
          employees.delete(linkedUserKey);
        }
        if (pensioners.has(linkedUserKey)) {
          pensioners.delete(linkedUserKey);
          removeWaitingCall(linkedUserKey);
        }
        if (activeCalls.has(linkedUserKey)) {
          const call = activeCalls.get(linkedUserKey);
          const empObj = employees.get(call.agentId);
          if (empObj) {
            io.to(empObj.socketId).emit("call-ended");
            setEmployeeFree(call.agentId);
          }
          activeCalls.delete(linkedUserKey);
        }
      }
      sendQueueUpdate();
    });
  });
};
