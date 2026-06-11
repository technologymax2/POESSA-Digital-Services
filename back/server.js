const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();


// ይህን ኮድ በ express() እና በ route መሃል ላይ ያድርጉት
app.use(cors({
    origin: "*", // ለሙከራ ጊዜ "*" ጥሩ ነው፣ ለምርት (Production) ሲደርስ የ Frontend URLዎን ብቻ ይጥቀሱ
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

app.use(express.json());

app.get("/", (req, res) => {
  res.send("POESSA Server Running");
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const users = new Map();
const busyAgents = new Set();
const activeCalls = new Map();

const forceDisconnectUser = (userId) => {
  const user = users.get(userId);

  if (!user) return;

  const socket = io.sockets.sockets.get(user.socketId);

  if (socket) {
    socket.disconnect(true);
  }

  users.delete(userId);
  busyAgents.delete(userId);
};

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  socket.on("register-user", ({ userId, role }) => {
    users.set(userId, {
      socketId: socket.id,
      role,
    });
  });

  socket.on("request-agent-call", (data) => {
    const availableAgents = Array.from(users.entries()).filter(
      ([agentId, user]) =>
        user.role === "agent" &&
        !busyAgents.has(agentId)
    );

    if (availableAgents.length === 0) {
      socket.emit("all-agents-busy", {
        message:
          "ሁሉም ሰራተኞች በስራ ላይ ናቸው። እባክዎ ቆይተው በኋላ ይሞክሩ።",
      });
      return;
    }

    availableAgents.forEach(([agentId, agent]) => {
      io.to(agent.socketId).emit("incoming-call", {
        pensionerId: data.pensionerId,
        signalData: data.signalData,
        agentId,
      });
    });
  });

  socket.on("answer-call", (data) => {
    if (busyAgents.has(data.agentId)) return;

    busyAgents.add(data.agentId);

    activeCalls.set(data.pensionerId, {
      pensionerId: data.pensionerId,
      agentId: data.agentId,
    });

    const pensioner = users.get(data.pensionerId);

    if (pensioner) {
      io.to(pensioner.socketId).emit("agent-accepted", {
        signal: data.signal,
        agentId: data.agentId,
      });
    }
  });

  socket.on("reject-call", (data) => {
    const pensioner = users.get(data.pensionerId);

    if (pensioner) {
      io.to(pensioner.socketId).emit("call-rejected");
    }
  });

  socket.on("end-call", (data) => {
    const call = activeCalls.get(data.pensionerId);

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
  });

  socket.on("disconnect", () => {
    let disconnectedUser = null;

    for (const [userId, user] of users.entries()) {
      if (user.socketId === socket.id) {
        disconnectedUser = userId;
        users.delete(userId);
        busyAgents.delete(userId);
        break;
      }
    }

    if (disconnectedUser) {
      for (const [pensionerId, call] of activeCalls.entries()) {
        if (
          call.pensionerId === disconnectedUser ||
          call.agentId === disconnectedUser
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
          activeCalls.delete(pensionerId);
        }
      }
    }

    console.log("Disconnected:", socket.id);
  });
});

app.use("/api/auth", require("./LoginBack"));

app.use(
  "/api/admin",
  require("./AdminBack")(
    io,
    users,
    busyAgents,
    forceDisconnectUser
  )
);

const PORT = process.env.PORT || 10000;

server.listen(PORT, () => {
  console.log(`Server Running On Port ${PORT}`);
});