const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();
const User = require("./models/User");

module.exports = (
  io,
  usersMap,
  busyAgents,
  forceDisconnectUser
) => {

  router.get("/users", async (req, res) => {
    try {
      const users = await User.find({}, "-password").sort({
        createdAt: -1,
      });

      res.json({
        success: true,
        users,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        message: "Failed to fetch users",
      });
    }
  });

  router.post("/create-user", async (req, res) => {
    try {
      const {
        username,
        password,
        role,
        tinNumber,
      } = req.body;

      if (!username || !password || !role) {
        return res.status(400).json({
          success: false,
          message: "All fields are required",
        });
      }

      const existingUser = await User.findOne({
        $or: [
          { username },
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

      const userData = {
        username,
        password: hashedPassword,
        role,
        isBlocked: false,
      };

      if (tinNumber && tinNumber.trim() !== "") {
        userData.tinNumber = tinNumber.trim();
      }

      const newUser = new User(userData);

      await newUser.save();

      res.status(201).json({
        success: true,
        message: "User created successfully",
      });

    } catch (error) {
      console.error(
        "CREATE USER ERROR:",
        error
      );

      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message:
            "Duplicate value detected. Username, TIN or Email already exists.",
        });
      }

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  router.put("/block/:id", async (req, res) => {
    try {
      const user = await User.findById(
        req.params.id
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      user.isBlocked = true;

      await user.save();

      forceDisconnectUser(
        user._id.toString()
      );

      res.json({
        success: true,
        message: "User blocked successfully",
      });

    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        message: "Failed to block user",
      });
    }
  });

  router.put("/unblock/:id", async (req, res) => {
    try {
      const user = await User.findById(
        req.params.id
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      user.isBlocked = false;

      await user.save();

      res.json({
        success: true,
        message: "User unblocked successfully",
      });

    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        message: "Failed to unblock user",
      });
    }
  });


  router.delete("/delete/:id", async (req, res) => {
    try {
      const user = await User.findById(
        req.params.id
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      forceDisconnectUser(
        user._id.toString()
      );

      await User.findByIdAndDelete(
        req.params.id
      );

      res.json({
        success: true,
        message: "User deleted successfully",
      });

    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        message: "Failed to delete user",
      });
    }
  });
  // Keep only one instance of this route
router.put("/reset-password/:id", async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword) return res.status(400).json({ success: false, message: "New password required" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(req.params.id, { password: hashedPassword });

    res.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update password" });
  }
});

  router.get("/statistics", async (req, res) => {
    try {
      const totalUsers =
        await User.countDocuments();

      const totalAdmins =
        await User.countDocuments({
          role: "admin",
        });

      const totalEmployees =
        await User.countDocuments({
          role: "employee",
        });

      const totalPensioners =
        await User.countDocuments({
          role: "pensioner",
        });

      const blockedUsers =
        await User.countDocuments({
          isBlocked: true,
        });

      res.json({
        success: true,
        statistics: {
          totalUsers,
          totalAdmins,
          totalEmployees,
          totalPensioners,
          blockedUsers,
          onlineUsers: usersMap.size,
          busyAgents: busyAgents.size,
        },
      });

    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        message: "Failed to fetch statistics",
      });
    }
  });

  return router;
};