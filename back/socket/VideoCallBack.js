const Pensioner = require("../models/Pensioner");

module.exports = (io) => {

  /* ==========================================
     MEMORY
  ========================================== */

  const users = new Map();

  const employees = new Map();

  const pensioners = new Map();

  const waitingQueue = [];

  const activeCalls = new Map();

  /* ==========================================
     HELPERS
  ========================================== */

  const getFreeEmployees = () => {

    return [...employees.values()].filter(
      emp => emp.status === "free"
    );

  };

  const setEmployeeBusy = (
    employeeId,
    pensionerId
  ) => {

    const emp = employees.get(employeeId);

    if (!emp) return;

    emp.status = "busy";
    emp.currentCall = pensionerId;

    employees.set(employeeId, emp);

  };

  const setEmployeeFree = (employeeId) => {

    const emp = employees.get(employeeId);

    if (!emp) return;

    emp.status = "free";
    emp.currentCall = null;

    employees.set(employeeId, emp);

  };

  const removeWaitingCall = (pensionerId) => {

    const index =
      waitingQueue.findIndex(
        c => c.pensionerId === pensionerId
      );

    if (index >= 0) {

      waitingQueue.splice(index, 1);

    }

  };

  const sendQueueUpdate = () => {

    io.emit("queue-updated", {

      waitingCalls:
        waitingQueue.length,

      onlineEmployees:
        employees.size,

      freeEmployees:
        getFreeEmployees().length,

      activeCalls:
        activeCalls.size,

    });

  };

  /* ==========================================
     SOCKET CONNECTION
  ========================================== */

  io.on("connection", (socket) => {

    console.log(
      "Socket Connected:",
      socket.id
    );

    /* =====================================
       REGISTER USER
    ===================================== */

    socket.on(
      "register-user",
      async ({
        userId,
        role,
        fullName,
      }) => {

        try {

          users.set(userId, {

            socketId:
              socket.id,

            role,

          });

          /* -----------------------
             EMPLOYEE
          ----------------------- */

          if (
            role === "employee"
          ) {

            employees.set(userId, {

              employeeId:
                userId,

              socketId:
                socket.id,

              fullName:
                fullName ||
                "Employee",

              status:
                "free",

              currentCall:
                null,

            });

            console.log(
              "Employee Online:",
              userId
            );

            sendQueueUpdate();

            /* =====================
               GIVE WAITING CALL
            ===================== */

            if (
              waitingQueue.length > 0
            ) {

              const call =
                waitingQueue.shift();

              const pensioner =
                pensioners.get(
                  call.pensionerId
                );

              if (pensioner) {

                socket.emit(
                  "incoming-call",
                  call
                );

              }

            }

            return;

          }

          /* -----------------------
             PENSIONER
          ----------------------- */

          pensioners.set(userId, {

            pensionerId:
              userId,

            socketId:
              socket.id,

          });

          console.log(
            "Pensioner Online:",
            userId
          );

          sendQueueUpdate();

        }

        catch (err) {

          console.error(err);

        }

      });
        /* =====================================
       REQUEST AGENT CALL
    ===================================== */

    socket.on("request-agent-call", async ({ pensionerId, signalData }) => {

      try {

        let pensionerData = null;

        try {
          pensionerData = await Pensioner.findOne({
            $or: [
              { pensionerId },
              { faydaNumber: pensionerId }
            ]
          });
        } catch {}

        waitingQueue.push({
          pensionerId,
          signalData,
          pensionerName:
            pensionerData?.nameEng || pensionerId,
        });

        const freeEmployees = getFreeEmployees();

        if (freeEmployees.length === 0) {

          io.to(socket.id).emit(
            "all-agents-busy",
            {
              message:
                "All employees are busy."
            }
          );

          sendQueueUpdate();
          return;
        }

        freeEmployees.forEach((employee) => {

          io.to(employee.socketId).emit(
            "incoming-call",
            {
              pensionerId,
              pensionerName:
                pensionerData?.nameEng ||
                pensionerId,
              signalData,
            }
          );

        });

        sendQueueUpdate();

      } catch (err) {

        console.error(err);

      }

    });

    /* =====================================
       ANSWER CALL
    ===================================== */

    socket.on("answer-call", ({ signal, pensionerId, agentId }) => {

      const employee = employees.get(agentId);

      const pensioner = pensioners.get(pensionerId);

      if (!employee || !pensioner) return;

      removeWaitingCall(pensionerId);

      setEmployeeBusy(agentId, pensionerId);

      activeCalls.set(pensionerId, {
        pensionerId,
        agentId,
      });

      io.to(pensioner.socketId).emit(
        "agent-accepted",
        {
          signal,
          agentId,
        }
      );

      io.emit("remove-call", {
        pensionerId,
      });

      sendQueueUpdate();

    });

    /* =====================================
       REJECT CALL
    ===================================== */

    socket.on("reject-call", ({ pensionerId }) => {

      io.to(
        pensioners.get(pensionerId)?.socketId
      ).emit("call-rejected");

      removeWaitingCall(pensionerId);

      io.emit("remove-call", {
        pensionerId,
      });

      sendQueueUpdate();

    });    /* =====================================
       END CALL
    ===================================== */

    socket.on("end-call", ({ pensionerId }) => {

      const call = activeCalls.get(pensionerId);

      if (!call) return;

      const pensioner = pensioners.get(call.pensionerId);

      const employee = employees.get(call.agentId);

      if (pensioner) {
        io.to(pensioner.socketId).emit("call-ended");
      }

      if (employee) {
        io.to(employee.socketId).emit("call-ended");

        setEmployeeFree(call.agentId);
      }

      activeCalls.delete(pensionerId);

      sendQueueUpdate();

      /* ------------------------------
         Give next waiting call
      ------------------------------ */

      if (waitingQueue.length > 0) {

        const nextCall = waitingQueue.shift();

        const freeEmployee = getFreeEmployees()[0];

        if (freeEmployee) {

          io.to(freeEmployee.socketId).emit(
            "incoming-call",
            nextCall
          );

        } else {

          waitingQueue.unshift(nextCall);

        }

      }

    });

    /* =====================================
       CANCEL CALL
    ===================================== */

    socket.on("cancel-call", ({ pensionerId }) => {

      removeWaitingCall(pensionerId);

      io.emit("remove-call", {
        pensionerId,
      });

      sendQueueUpdate();

    });

    /* =====================================
       DISCONNECT
    ===================================== */

    socket.on("disconnect", () => {

      console.log(
        "Disconnected:",
        socket.id
      );

      let disconnectedEmployee = null;
      let disconnectedPensioner = null;

      /* -------------------------
         Employee Disconnect
      ------------------------- */

      for (const [id, emp] of employees.entries()) {

        if (emp.socketId === socket.id) {

          disconnectedEmployee = id;

          employees.delete(id);

          users.delete(id);

          break;

        }

      }

      /* -------------------------
         Pensioner Disconnect
      ------------------------- */

      for (const [id, pen] of pensioners.entries()) {

        if (pen.socketId === socket.id) {

          disconnectedPensioner = id;

          pensioners.delete(id);

          users.delete(id);

          removeWaitingCall(id);

          break;

        }

      }

      /* -------------------------
         Active Calls
      ------------------------- */

      for (const [pid, call] of activeCalls.entries()) {

        if (
          call.agentId === disconnectedEmployee ||
          call.pensionerId === disconnectedPensioner
        ) {

          const otherEmployee =
            employees.get(call.agentId);

          const otherPensioner =
            pensioners.get(call.pensionerId);

          if (otherEmployee) {

            io.to(otherEmployee.socketId)
              .emit("call-ended");

            setEmployeeFree(call.agentId);

          }

          if (otherPensioner) {

            io.to(otherPensioner.socketId)
              .emit("call-ended");

          }

          activeCalls.delete(pid);

        }

      }

      sendQueueUpdate();

    });

  });

};
