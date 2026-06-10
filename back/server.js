const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

// 1. CORS Configuration (ለደህንነት ሲባል የFrontend ዶሜይንህን ብቻ ፍቀድ)
app.use(cors({
    origin: "*", // ለሙከራ ጊዜ "*" ጥሩ ነው፣ ለምርት (Production) ሲደርስ የ Frontend URLዎን ብቻ ይጥቀሱ
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { 
    cors: { 
        origin: "*", // በምርት (Production) ወቅት የFrontend URLህን አስገባ
        methods: ["GET", "POST"] 
    } 
});

// 2. State Management (ለቪዲዮ ጥሪ መቆጣጠሪያ)
const users = new Map(); // userId -> { socketId, role }
const busyAgents = new Set(); // agentId

// 3. Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Connected Successfully"))
    .catch(err => console.error("DB Connection Error:", err));

// 4. Socket.io Logic
io.on("connection", (socket) => {
    console.log(`New connection: ${socket.id}`);

    socket.on("register-user", ({ userId, role }) => {
        users.set(userId, { socketId: socket.id, role });
        console.log(`User ${userId} registered with role ${role}`);
    });

    socket.on("disconnect", () => {
        for (const [id, user] of users) {
            if (user.socketId === socket.id) {
                users.delete(id);
                busyAgents.delete(id);
                break;
            }
        }
    });
});

// 5. Helper Function for Admin (ለተጠቃሚ ማገድ እና ለማቋረጥ)
const forceDisconnectUser = (userId) => {
    const user = users.get(userId);
    if (user) {
        const socket = io.sockets.sockets.get(user.socketId);
        if (socket) socket.disconnect();
        users.delete(userId);
        busyAgents.delete(userId);
        console.log(`User ${userId} was force disconnected.`);
    }
};

// 6. Routes
app.use("/api/auth", require("./LoginBack"));
app.use("/api/admin", require("./AdminBack")(io, users, busyAgents, forceDisconnectUser));

// 7. Server Initialization
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));