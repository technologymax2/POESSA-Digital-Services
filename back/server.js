require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");

const VideoCallBack = require("./socket/VideoCallBack");
const livenessRoute = require("./LivenessTestBack");

const app = express();

/* =========================
   CORS
========================= */

const allowedOrigins = [
  "https://poessa-digital-services.vercel.app",
  "https://poessa-digital-services-1.onrender.com",
  "http://localhost:3000",
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);

      if (
        allowedOrigins.includes(origin) ||
        origin.includes("poessa-digital-services")
      ) {
        return callback(null, true);
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
    ],
  })
);

/* =========================
   BODY
========================= */

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

/* =========================
   SECURITY
========================= */

app.use((req, res, next) => {
  res.setHeader(
    "Permissions-Policy",
    "camera=(self), microphone=(self)"
  );

  res.setHeader(
    "X-Content-Type-Options",
    "nosniff"
  );

  next();
});

/* =========================
   STATIC
========================= */

app.use("/uploads", express.static("uploads"));

/* =========================
   HOME
========================= */

app.get("/", (req, res) => {
  res.send("POESSA Video Verification Server Running");
});

/* =========================
   DATABASE
========================= */

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
  })
  .catch((err) => {
    console.error("MongoDB Error:", err.message);
    process.exit(1);
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
    credentials: true,
    methods: ["GET", "POST"],
  },

  transports: ["websocket", "polling"],

  pingTimeout: 60000,

  pingInterval: 25000,
});

/* =========================
   VIDEO CALL SOCKET
========================= */

VideoCallBack(io);

/* =========================
   ROUTES
========================= */

app.use("/api/auth", require("./LoginBack"));

app.use(
  "/api/admin",
  require("./AdminBack")(io)
);

app.use(
  "/api/pensioners",
  require("./PensionerRegistrationBack")
);

app.use(
  "/api/liveness",
  livenessRoute
);

app.use(
  "/api",
  require("./ReportBack")
);

app.use(
  "/api/video",
  require("./VideoCallBack")
);
/* =========================
   404
========================= */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

/* =========================
   ERROR HANDLER
========================= */

app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

/* =========================
   SOCKET STATUS
========================= */

io.on("connection", (socket) => {
  console.log(`✅ Socket Connected : ${socket.id}`);

  socket.on("disconnect", (reason) => {
    console.log(
      `❌ Socket Disconnected : ${socket.id} (${reason})`
    );
  });

  socket.on("error", (err) => {
    console.error(
      `Socket Error (${socket.id})`,
      err
    );
  });
});

/* =========================
   START SERVER
========================= */

const PORT = process.env.PORT || 10000;

server.listen(PORT, () => {
  console.log("========================================");
  console.log("🚀 POESSA DIGITAL SERVICE SERVER");
  console.log(`PORT : ${PORT}`);
  console.log(`TIME : ${new Date().toLocaleString()}`);
  console.log("========================================");
});

/* =========================
   SHUTDOWN
========================= */

process.on("SIGINT", async () => {
  console.log("Stopping Server...");

  try {
    await mongoose.connection.close();
    console.log("MongoDB Closed");
  } catch (err) {
    console.error(err);
  }

  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Stopping Server...");

  try {
    await mongoose.connection.close();
    console.log("MongoDB Closed");
  } catch (err) {
    console.error(err);
  }

  process.exit(0);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise Rejection:", err);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});
