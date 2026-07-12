// src/back/VideoSocketHandler.js
const UserPensioner = require("./models/UserPensioner");

module.exports = (io) => {
  const users = new Map();
  const employees = new Map();
  const pensioners = new Map();
  const waitingQueue = [];
  const activeCalls = new Map();

  const getFreeEmployees = () => {
    return [...employees.values()].filter(emp => emp.status === "free");
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
    if (employee) {
      employee.status = "busy";
      employee.currentCall = pensionerId;
    }
  };

  const setEmployeeFree = (employeeId) => {
    const employee = employees.get(employeeId);
    if (employee) {
      employee.status = "free";
      employee.currentCall = null;
    }
  };

  const removeWaitingCall = (pensionerId) => {
    const index = waitingQueue.findIndex(item => item.pensionerId === pensionerId);
    if (index !== -1) waitingQueue.splice(index, 1);
  };

  io.on("connection", (socket) => {
    console.log("Video Socket Connected:", socket.id);

socket.on("ice-candidate", ({ candidate, to }) => {
  const targetUser = users.get(to);
  if (targetUser) {
    io.to(targetUser.socketId).emit("ice-candidate", { candidate });
  }
});
    
    socket.on("register-user", async (data) => {
      const { userId, role, fullName } = data;
      users.set(userId, { socketId: socket.id, userId, role });

      if (role === "employee") {
        employees.set(userId, {
          socketId: socket.id,
          employeeId: userId,
          fullName: fullName || "Employee",
          status: "free",
          currentCall: null,
          lastSeen: Date.now()
        });
      } else {
        pensioners.set(userId, {
          socketId: socket.id,
          pensionerId: userId,
          status: "waiting",
          lastSeen: Date.now()
        });
      }
      sendQueueUpdate();
    });

    socket.on("request-agent-call", async ({ pensionerId, signalData }) => {
      let pensionerName = pensionerId;
      try {
        const person = await UserPensioner.findOne({
          $or: [{ pensionerId }, { faydaNumber: pensionerId }]
        });
        if (person) pensionerName = person.nameEng || person.nameAmh || pensionerId;
      } catch (e) {
        console.error("DB query failed in socket:", e);
      }

      const freeEmployees = getFreeEmployees();
      if (freeEmployees.length === 0) {
        waitingQueue.push({ pensionerId, pensionerName, signalData, requestedAt: new Date() });
        socket.emit("all-agents-busy", { message: "ሁሉም ሰራተኞች በስራ ላይ ናቸው። እባክዎ ይጠብቁ..." });
        sendQueueUpdate();
        return;
      }

      const employee = freeEmployees[0];
      io.to(employee.socketId).emit("incoming-call", { pensionerId, pensionerName, signalData });
      waitingQueue.push({ pensionerId, pensionerName, signalData, requestedAt: new Date() });
      sendQueueUpdate();
    });

    socket.on("answer-call", ({ pensionerId, agentId, signal }) => {
      const employee = employees.get(agentId);
      const pensioner = pensioners.get(pensionerId);

      if (!employee || !pensioner) return;

      setEmployeeBusy(agentId, pensionerId);
      removeWaitingCall(pensionerId);

      activeCalls.set(pensionerId, { pensionerId, agentId, startedAt: new Date() });
      io.to(pensioner.socketId).emit("agent-accepted", { agentId, signal });
      sendQueueUpdate();
    });

    socket.on("reject-call", ({ pensionerId }) => {
      const pensioner = pensioners.get(pensionerId);
      if (pensioner) io.to(pensioner.socketId).emit("call-rejected");
      removeWaitingCall(pensionerId);
      io.emit("remove-call", { pensionerId });
      sendQueueUpdate();
    });

    socket.on("end-call", ({ pensionerId }) => {
      const call = activeCalls.get(pensionerId);
      if (!call) return;

      const employee = employees.get(call.agentId);
      const pensioner = pensioners.get(call.pensionerId);

      if (employee) {
        io.to(employee.socketId).emit("call-ended");
        setEmployeeFree(call.agentId);
      }
      if (pensioner) io.to(pensioner.socketId).emit("call-ended");

      activeCalls.delete(pensionerId);
      sendQueueUpdate();
    });

    socket.on("heartbeat", ({ userId }) => {
      if (employees.has(userId)) employees.get(userId).lastSeen = Date.now();
      if (pensioners.has(userId)) pensioners.get(userId).lastSeen = Date.now();
    });

    socket.on("disconnect", () => {
      let disconnectedId = null;
      for (let [uid, payload] of users.entries()) {
        if (payload.socketId === socket.id) {
          disconnectedId = uid;
          users.delete(uid);
          break;
        }
      }

      if (disconnectedId) {
        employees.delete(disconnectedId);
        pensioners.delete(disconnectedId);
        removeWaitingCall(disconnectedId);
        if (activeCalls.has(disconnectedId)) {
          const call = activeCalls.get(disconnectedId);
          const emp = employees.get(call.agentId);
          if (emp) {
            io.to(emp.socketId).emit("call-ended");
            setEmployeeFree(call.agentId);
          }
          activeCalls.delete(disconnectedId);
        }
      }
      sendQueueUpdate();
    });
  });
};
