const express = require("express");
const router = express.Router();
const multer = require("multer");
const axios = require("axios");

// 🔄 እዚህ ጋር አዲሱን የፋይል ስም እና የሞዴል ስም በትክክል ተካነው
const UserPensioner = require("./models/UserPensioner"); 

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post("/register", upload.single("photo"), async (req, res) => {
  try {
    const {
      name, tin, phone, age, gender,
      faydaNumber, poessaBranch, bankName, bankBranch, pensionAmount
    } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: "እባክዎ የጡረተኛውን ፎቶ ይጫኑ!" });
    }

    // 🔄 እዚህም ጋ በUserPensioner እንፈልገዋለን
    const existingPensioner = await UserPensioner.findOne({ faydaNumber });
    if (existingPensioner) {
      return res.status(400).json({ success: false, message: "⚠️ ይህ የፋይዳ ቁጥር ቀድሞ ተመዝግቧል!" });
    }

    const base64Image = req.file.buffer.toString("base64");
    const formData = new URLSearchParams();
    formData.append("image", base64Image);

    const imgbbKey = "8c4293f0b06b2db8de34e2cda9a73bd8"; 
    const imgbbResponse = await axios.post(`https://api.imgbb.com/1/upload?key=${imgbbKey}`, formData);
    const photoUrl = imgbbResponse.data.data.url;

    const pensionerId = `PENS-${Math.floor(100000 + Math.random() * 900000)}`;

    // 🔄 እዚህም ጋ በአዲሱ ሞዴል ስም ሴቭ እናደርገዋለን
    const newPensioner = new UserPensioner({
      pensionerId, name, tin, phone, age, gender,
      faydaNumber, poessaBranch, bankName, bankBranch, pensionAmount,
      photoUrl
    });

    await newPensioner.save();

    res.status(201).json({
      success: true,
      message: "የጡረተኛው መረጃ በዳታቤዝ ውስጥ በቋሚነት ተቀምጧል!",
      data: newPensioner
    });

  } catch (error) {
    console.error("የምዝገባ ሰርቨር ስህተት:", error);
    res.status(500).json({ success: false, message: "በሰርቨር ላይ ስህተት አጋጥሟል!" });
  }
});

module.exports = router;
