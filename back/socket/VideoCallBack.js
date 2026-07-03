const Pensioner = require("../models/Pensioner");

module.exports = (io) => {

  /* ==========================
     MEMORY
  ========================== */

  const users = new Map();

  const employees = new Map();

  const pensioners = new Map();

  const waitingQueue = [];

  const activeCalls = new Map();

  /* ==========================
     HELPER FUNCTIONS
  ========================== */

  const getFreeEmployees = () => {
    return [...employees.values()].filter(
      (employee) => employee.status === "free"
    );
  };

  const getEmployee = (employeeId) => {
    return employees.get(employeeId);
  };

  const getPensioner = (pensionerId) => {
    return pensioners.get(pensionerId);
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

  const sendQueueUpdate = () => {
    io.emit("queue-updated", {
      waiting: waitingQueue.length,
      freeEmployees: getFreeEmployees().length,
      onlineEmployees: employees.size,
      activeCalls: activeCalls.size,
    });
  };

  /* ==========================
     SOCKET CONNECTION
  ========================== */

  io.on("connection", (socket) => {

    console.log("Connected:", socket.id);

    socket.on("disconnect", () => {

      console.log("Disconnected:", socket.id);

    });

  });

};

/* ==========================
   REGISTER USER
========================== */

socket.on("register-user", async (data) => {

  try {

    const {
      userId,
      role,
      fullName
    } = data;

    users.set(socket.id, {
      socketId: socket.id,
      userId,
      role
    });

    /* --------------------------
       EMPLOYEE
    -------------------------- */

    if (role === "employee") {

      employees.set(userId, {
        socketId: socket.id,
        employeeId: userId,
        fullName: fullName || "Employee",
        status: "free",
        currentCall: null,
        connectedAt: new Date()
      });

      console.log(
        "Employee Online:",
        userId
      );

      sendQueueUpdate();

      return;
    }

    /* --------------------------
       PENSIONER
    -------------------------- */

    pensioners.set(userId, {
      socketId: socket.id,
      pensionerId: userId,
      status: "waiting",
      connectedAt: new Date()
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
     END CALL
  ====================================== */

  socket.on("end-call", ({ pensionerId }) => {
    const call = activeCalls.get(pensionerId);

    if (!call) return;

    const pensioner = users.get(call.pensionerId);
    const agent = users.get(call.agentId);

    if (pensioner) {
      io.to(pensioner.socketId).emit("call-ended");
    }

    if (agent) {
      io.to(agent.socketId).emit("call-ended");
    }

    busyAgents.delete(call.agentId);
    activeCalls.delete(call.pensionerId);

    console.log("Call ended:", pensionerId);
  });

  /* =====================================
     CANCEL CALL
  ====================================== */

  socket.on("cancel-call", ({ pensionerId }) => {
    io.emit("remove-call", {
      pensionerId,
    });
  });

  /* =====================================
     DISCONNECT
  ====================================== */

  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);

    let disconnectedUserId = null;

    for (const [id, user] of users.entries()) {
      if (user.socketId === socket.id) {
        disconnectedUserId = id;
        users.delete(id);
        busyAgents.delete(id);
        break;
      }
    }

    if (!disconnectedUserId) return;

    for (const [pid, call] of activeCalls.entries()) {
      if (
        call.pensionerId === disconnectedUserId ||
        call.agentId === disconnectedUserId
      ) {
        const pensioner = users.get(call.pensionerId);
        const agent = users.get(call.agentId);

        if (pensioner) {
          io.to(pensioner.socketId).emit("call-ended");
        }

        if (agent) {
          io.to(agent.socketId).emit("call-ended");
        }

        busyAgents.delete(call.agentId);
        activeCalls.delete(pid);

        console.log("Active call removed:", pid);
      }
    }
  });
});

/* =====================================
   EXPORT
===================================== */

module.exports = VideoCallBack;
