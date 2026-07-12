// src/back/VideoSocketHandler.js
module.exports = (io) => {
  const users = new Map(); // መታወቂያዎችን ከ socket.id ጋር የሚያገናኝ
  const activeCalls = new Map();

  io.on("connection", (socket) => {
    console.log("Socket Connected:", socket.id);

    // 1. መመዝገቢያ (ፋይዳ ቁጥር ወይም agent_01)
    socket.on("register-user", (data) => {
      const { userId, role } = data;
      // ግጭትን ለመከላከል የድሮውን መረጃ እናጸዳለን
      if (users.has(userId)) {
        users.delete(userId);
      }
      users.set(userId, { socketId: socket.id, userId, role });
      console.log(`${role} registered: ${userId}`);
    });

    // 2. ጥሪ መጠየቅ
    socket.on("request-agent-call", ({ pensionerId, signalData }) => {
      // ለሰራተኛው (agent_01) ጥሪውን እናስተላልፋለን
      const agent = users.get("agent_01");
      if (agent) {
        io.to(agent.socketId).emit("incoming-call", { 
            pensionerId, 
            signalData 
        });
      }
    });

    // 3. ጥሪ መቀበል
    socket.on("answer-call", ({ pensionerId, agentId, signal }) => {
      const pensioner = users.get(pensionerId);
      if (pensioner) {
        io.to(pensioner.socketId).emit("agent-accepted", { agentId, signal });
      }
    });

    // 4. ICE Candidate መለዋወጥ (ምስል እንዲታይ ወሳኝ)
    socket.on("ice-candidate", ({ candidate, to }) => {
      const targetUser = users.get(to);
      if (targetUser) {
        io.to(targetUser.socketId).emit("ice-candidate", { candidate });
      }
    });

    // 5. ጥሪ መዝጊያ
    socket.on("end-call", ({ pensionerId }) => {
      const agent = users.get("agent_01");
      if (agent) {
        io.to(agent.socketId).emit("call-ended");
      }
      const pensioner = users.get(pensionerId);
      if (pensioner) {
        io.to(pensioner.socketId).emit("call-ended");
      }
    });

    // 6. መቋረጥ
    socket.on("disconnect", () => {
      for (let [userId, data] of users.entries()) {
        if (data.socketId === socket.id) {
          users.delete(userId);
          break;
        }
      }
    });
  });
};
