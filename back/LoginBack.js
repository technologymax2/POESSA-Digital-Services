const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("./models/User");

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const {
      username,
      password,
      role,
      tinNumber,
      email,
      phoneNumber,
    } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#_-])[A-Za-z\d@$!%*?&.#_-]{8,}$/;

    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must contain at least 8 characters, uppercase, lowercase, number and symbol",
      });
    }

    const existingUser = await User.findOne({
      $or: [
        { username },
        ...(email ? [{ email }] : []),
        ...(tinNumber ? [{ tinNumber }] : []),
      ],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    const user = new User({
      username,
      password: hashedPassword,
      role,
      tinNumber: tinNumber || null,
      email: email || null,
      phoneNumber: phoneNumber || null,
      isBlocked: false,
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: "Registration successful",
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Username and Password required",
      });
    }

    const user = await User.findOne({
      $or: [
        { username },
        { email: username },
        { tinNumber: username },
      ],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message:
          "Your account has been blocked by administrator",
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid Password",
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        tinNumber: user.tinNumber,
        email: user.email,
      },
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

router.get("/verify", async (req, res) => {
  try {
    const authHeader =
      req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Token required",
      });
    }

    const token =
      authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    res.json({
      success: true,
      user: decoded,
    });

  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid Token",
    });
  }
});

module.exports = router;