const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();
const User = require("./models/User");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// 📁 'uploads' ፎልደር በሰርቨሩ ላይ መኖሩን ማረጋገጥ፣ ከሌለ በራሱ ይፈጥረዋል
const uploadDir = path.join(__dirname, "../uploads"); // እንደ ፕሮጀክትህ አወቃቀር መለወጥ ትችላለህ
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ⚙️ የፎቶው ስም እንዳይደራረብ በራሱ ልዩ ስም (Unique Name) የሚሰጥ የ Multer ቅንብር
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // ለምሳሌ፡ 1718451234567-profile.jpg ያደርገዋል
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// 🖼️ ምስል ብቻ እንዲቀበል መቆጣጠሪያ (Filter)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("ምስል (Image) ፋይል ብቻ ነው የሚፈቀደው!"), false);
  }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

module.exports = (io, usersMap, busyAgents, forceDisconnectUser) => {
  
  // ተጠቃሚዎችን ዝርዝር ማምጣት
  router.get("/users", async (req, res) => {
    try {
      const users = await User.find({}, "-password").sort({ createdAt: -1 });
      res.json({ success: true, users });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Failed to fetch users" });
    }
  });

  // 🔥 አዲስ ተጠቃሚ በፎቶ ፋይል ጭምር መፍጠሪያ ራውት
  // `upload.single("profilePicture")` የምትለዋን እዚህ ጋር እንጨምራለን
  router.post("/create-user", upload.single("profilePicture"), async (req, res) => {
    try {
      // 📝 ፎርም ዳታ ሲላክ ጽሑፎቹ በ req.body ውስጥ ይገባሉ
      const { username, fullName, password, role, tinNumber } = req.body;

      if (!username || !fullName || !password || !role) {
        return res.status(400).json({ success: false, message: "All fields are required" });
      }

      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ success: false, message: "User already exists" });
      }

      // 📷 ፎቶው በትክክል ከተጫነ የሰርቨሩን ሙሉ ሊንክ (URL) እንሰራለን
      let finalProfilePictureUrl = "";
      if (req.file) {
        // Render ላይ ያለህን የሰርቨር አድራሻ ተጠቅሞ የፎቶውን ሊንክ ይሰራዋል
        finalProfilePictureUrl = `https://poessa-digital-services-1.onrender.com/uploads/${req.file.filename}`;
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({
        username,
        fullName,
        password: hashedPassword,
        role,
        profilePicture: finalProfilePictureUrl, // 🔗 እውነተኛው የሊንክ አድራሻ ዳታቤዝ ውስጥ ይገባል
        tinNumber: tinNumber || null,
        isBlocked: false,
      });

      await newUser.save();
      res.status(201).json({ success: true, message: "User created successfully" });
    } catch (error) {
      console.error("CREATE USER ERROR:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // ተጠቃሚን መከልከል (Block)
  router.put("/block/:id", async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ success: false, message: "User not found" });
      
      user.isBlocked = true;
      await user.save();
      forceDisconnectUser(user._id.toString());
      res.json({ success: true, message: "User blocked successfully" });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to block user" });
    }
  });

  // ተጠቃሚን መፍቀድ (Unblock)
  router.put("/unblock/:id", async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ success: false, message: "User not found" });
      
      user.isBlocked = false;
      await user.save();
      res.json({ success: true, message: "User unblocked successfully" });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to unblock user" });
    }
  });

  // ተጠቃሚን መደምሰስ (Delete)
  router.delete("/delete/:id", async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ success: false, message: "User not found" });
      
      forceDisconnectUser(user._id.toString());
      await User.findByIdAndDelete(req.params.id);
      res.json({ success: true, message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to delete user" });
    }
  });

  // የይለፍ ቃል ዳግም ማስጀመሪያ
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

  // ስታቲስቲክስ
  router.get("/statistics", async (req, res) => {
    try {
      const totalUsers = await User.countDocuments();
      const totalAdmins = await User.countDocuments({ role: "admin" });
      const totalEmployees = await User.countDocuments({ role: "employee" });
      const blockedUsers = await User.countDocuments({ isBlocked: true });

      res.json({
        success: true,
        statistics: {
          totalUsers,
          totalAdmins,
          totalEmployees,
          blockedUsers,
          onlineUsers: usersMap.size,
          busyAgents: busyAgents.size,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch statistics" });
    }
  });

  return router;
};
