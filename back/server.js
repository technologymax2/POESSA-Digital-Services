require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");

// ✅ Renamed to clearly distinguish the WebSockets architecture from HTTP Routes
const VideoSocketHandler = require("./VideoSocketHandler");
const livenessRoute = require("./LivenessTestBack");

const app = express();

/* =========================
   CORS CONFIGURATION
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
   BODY PARSERS
========================= */
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

/* =========================
   SECURITY HEADERS
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
   STATIC ASSETS
========================= */
app.use("/uploads", express.static("uploads"));

/* =========================
   HOME ROUTE
========================= */
app.get("/", (req, res) => {
  res.send("POESSA Video Verification Server Running");
});

/* =========================
   DATABASE CONNECTION
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
   HTTP SERVER CREATION
========================= */
const server = http.createServer(app);

/* =========================
   SOCKET.IO SETUP
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
   VIDEO CALL SOCKET INITIALIZATION
========================= */
// ✅ Binds the real-time signaling logic using the explicit handler name
VideoSocketHandler(io);

/* =========================
   EXPRESS ROUTING REST API
========================= */
app.use("/api/auth", require("./LoginBack"));
app.use("/api/admin", require("./AdminBack")(io));
app.use("/api/pensioners", require("./PensionerRegistrationBack"));
app.use("/api/liveness", livenessRoute);
app.use("/api", require("./ReportBack"));

// ✅ Clean architectural separation pointing to the renamed HTTP routing file
app.use("/api/video", require("./VideoCallRoute")); // ✅ ተስተካከለ

/* =========================
   404 FALLBACK
========================= */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

/* =========================
   GLOBAL ERROR HANDLER
========================= */
app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

/* =========================
   GENERIC SOCKET LOGGER
========================= */
io.on("connection", (socket) => {
  console.log(`✅ Socket Connected Global : ${socket.id}`);

  socket.on("disconnect", (reason) => {
    console.log(`❌ Socket Disconnected Global : ${socket.id} (${reason})`);
  });

  socket.on("error", (err) => {
    console.error(`Socket Error Global (${socket.id})`, err);
  });
});

/* =========================
   START EXPRESS SERVER
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
   GRACEFUL SHUTDOWN HANDLERS
========================= */
const shutdown = async () => {
  console.log("Stopping Server...");
  try {
    await mongoose.connection.close();
    console.log("MongoDB Closed cleanly");
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise Rejection:", err);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});
