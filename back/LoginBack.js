const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const router = express.Router();

// models/User.js (Update this to match POESSA requirements)
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "employee", "pensioner"], required: true },
    tinNumber: { type: String, required: true, unique: true }, // Crucial for POESSA
    isBlocked: { type: Boolean, default: false } // Required for your Admin functionality
}, { timestamps: true });
// Register
router.post("/register", async (req, res) => {
    try {
        const { username, password, role, tinNumber } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, password: hashedPassword, role, tinNumber });
        await user.save();
        res.status(201).json({ success: true, message: "User registered" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

// Login
router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ $or: [{ username }, { tinNumber: username }] });
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ success: false, message: "Invalid Password" });

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });
        
        res.json({
            success: true,
            token,
            user: { id: user._id, username: user.username, role: user.role }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

module.exports = router;