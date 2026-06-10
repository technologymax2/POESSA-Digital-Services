const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("./models/User"); // የእርስዎ MongoDB Schema

module.exports = (io, usersMap, busyAgentsMap, forceDisconnectUser) => {

    // 1. Fetch all users
    router.get('/users', async (req, res) => {
        try {
            const users = await User.find({}, 'username role isBlocked');
            res.json({ users });
        } catch (err) {
            res.status(500).json({ error: "Failed to fetch users" });
        }
    });

    // 2. Create a new user (Admin/Employee)
    router.post('/create-user', async (req, res) => {
        const { username, password, role } = req.body;
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = new User({ username, password: hashedPassword, role, isBlocked: false });
            await newUser.save();
            res.status(201).json({ message: "User created successfully" });
        } catch (err) {
            res.status(500).json({ error: "User creation failed" });
        }
    });

    // 3. Block/Unblock User and Force Disconnect
    router.put('/block/:id', async (req, res) => {
        try {
            const user = await User.findById(req.params.id);
            if (!user) return res.status(404).json({ error: "User not found" });

            user.isBlocked = !user.isBlocked;
            await user.save();

            // ተጠቃሚው ሲታገድ ከሶኬት ግንኙነት እንዲቋረጥ ማድረግ
            if (user.isBlocked) {
                forceDisconnectUser(req.params.id);
            }

            res.json({ message: `User status updated to ${user.isBlocked ? 'Blocked' : 'Active'}` });
        } catch (err) {
            res.status(500).json({ error: "Database update failed" });
        }
    });

    // 4. Reset Password
    router.put('/reset-password/:id', async (req, res) => {
        const { newPassword } = req.body;
        try {
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await User.findByIdAndUpdate(req.params.id, { password: hashedPassword });
            res.json({ message: "Password updated successfully" });
        } catch (err) {
            res.status(500).json({ error: "Password reset failed" });
        }
    });

    return router;
};