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
   BODY LIMIT
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
  res.setHeader("X-Content-Type-Options", "nosniff");
  next();
});

/* =========================
   STATIC FILES
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
  .then(() => console.log("✅ MongoDB Connected"))
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
    origin: true,
    credentials: true,
    methods: ["GET", "POST"],
  },
});

/* =========================
   VIDEO CALL SOCKET EVENTS
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
  console.error(err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

/* =========================
   START SERVER
========================= */

const PORT = process.env.PORT || 10000;

server.listen(PORT, () => {
  console.log("=================================");
  console.log("🚀 POESSA SERVER STARTED");
  console.log("PORT :", PORT);
  console.log("=================================");
});
