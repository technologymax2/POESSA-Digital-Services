Const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const path = require("path"); 
require("dotenv").config();
const livenessRoute = require("./LivenessTestBack");

const app = express();

/* =========================
   CORS CONFIGURATION (የተስተካከለ 🔒)
========================= */
const allowedOrigins = [
  "https://poessa-digital-services.vercel.app",
  "https://poessa-digital-services-1.onrender.com", 
  "http://localhost:3000"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"] // ✅ የተጨመረ
  })
);

// ✅ ለቪዲዮ እና ምስል አፕሎድ ትልቅ ዳታ እንዲቀበል የሊሚት ማስተካከያ
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

/* =========================
   የደህንነት HEADERS (ካሜራው በ HTTPS ላይ እንዲሰራ ፈቃድ መስጫ)
========================= */
app.use((req, res, next) => {
  // ብሮውዘሩ ካሜራን ያለ ገደብ እንዲጠቀም መፍቀጃ (Permissions Policy)
  res.setHeader("Permissions-Policy", "camera=(self), microphone=()");
  res.setHeader("X-Content-Type-Options", "nosniff");
  next();
});

/* =========================
   HOME ROUTE
========================= */
app.get("/", (req, res) => {
  res.send("POESSA Server Running");
});

/* =========================
   DATABASE CONNECTION
========================= */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
  })
  .catch((err) => {
    console.error("MongoDB Error:", err);
  });

/* =========================
   HTTP SERVER
========================= */
const server = http.createServer(app);

/* =========================
   SOCKET.IO
========================= */
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

/* =========================
   MEMORY STORAGE
========================= */
const users = new Map();
const busyAgents = new Set();
const activeCalls = new Map();

/* =========================
   FORCE DISCONNECT
========================= */
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

/* =========================
   SOCKET EVENTS
========================= */
io.on("connection", (socket) => {
  console.log("Connected:", socket.id);
  
  socket.on("cancel-call", ({ pensionerId }) => {
    io.emit("remove-call", { pensionerId });
  });

  socket.on("register-user", ({ userId, role }) => {
    console.log("REGISTER:", userId, role);
    users.set(userId, { socketId: socket.id, role });
  });

  socket.on("request-agent-call", (data) => {
    const availableAgents = Array.from(users.entries()).filter(
      ([userId, user]) => user.role === "employee" && !busyAgents.has(userId)
    );

    if (availableAgents.length === 0) {
      socket.emit("all-agents-busy", { message: "ሁሉም ሰራተኞች በስራ ላይ ናቸው።" });
      return;
    }

    availableAgents.forEach(([agentId, agent]) => {
      io.to(agent.socketId).emit("incoming-call", {
        pensionerId: data.pensionerId,
        signalData: data.signalData,
        agentId
      });
    });
  });

  socket.on("answer-call", (data) => {
    if (busyAgents.has(data.agentId)) return;

    busyAgents.add(data.agentId);
    activeCalls.set(data.pensionerId, { pensionerId: data.pensionerId, agentId: data.agentId });

    const pensioner = users.get(data.pensionerId);
    if (pensioner) {
      io.to(pensioner.socketId).emit("agent-accepted", {
        signal: data.signal,
        agentId: data.agentId
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

    if (pensioner) io.to(pensioner.socketId).emit("call-ended");
    if (agent) io.to(agent.socketId).emit("call-ended");

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
        if (call.pensionerId === disconnectedUser || call.agentId === disconnectedUser) {
          const pensioner = users.get(call.pensionerId);
          const agent = users.get(call.agentId);

          if (pensioner) io.to(pensioner.socketId).emit("call-ended");
          if (agent) io.to(agent.socketId).emit("call-ended");

          busyAgents.delete(call.agentId);
          activeCalls.delete(pensionerId);
        }
      }
    }
    console.log("Disconnected:", socket.id);
  });
});

/* =========================
   ROUTES
========================= */
app.use("/api/auth", require("./LoginBack"));
app.use("/api/admin", require("./AdminBack")(io, users, busyAgents, forceDisconnectUser));
app.use("/api/pensioners", require("./PensionerRegistrationBack"));
app.use("/api/liveness", livenessRoute);
app.use("/api", require("./ReportBack"));

/* =========================
   PORT
========================= */
const PORT = process.env.PORT || 10000;

server.listen(PORT, () => {
  console.log(`Server Running On Port ${PORT}`);
});
