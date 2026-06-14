const express = require("express");
const router = express.Router();
const multer = require("multer");

// ✅ የሞዴል መገኛ አድራሻ
const UserPensioner = require("./models/UserPensioner"); 

const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 } // የፎቶ መጠን ከ 2MB እንዳይበልጥ ያደርጋል
});

router.post("/register", upload.single("photo"), async (req, res) => {
  try {
    const {
      name, tin, phone, age, gender,
      faydaNumber, poessaBranch, bankName, bankBranch, pensionAmount
    } = req.body;

    // 1. ፎቶው መኖሩን ማረጋገጥ
    if (!req.file) {
      return res.status(400).json({ success: false, message: "እባክዎ የጡረተኛውን ፎቶ ይጫኑ!" });
    }

    // 2. ቀድሞ መመዝገቡን ማረጋገጥ
    const existingPensioner = await UserPensioner.findOne({ faydaNumber });
    if (existingPensioner) {
      return res.status(400).json({ success: false, message: "⚠️ ይህ የፋይዳ ቁጥር ቀድሞ ተመዝግቧል!" });
    }

    // 3. ፎቶውን ወደ Base64 በመቀየር በቀጥታ በሊንክ መልክ ማዘጋጀት (ImgBB አያስፈልገውም 🚀)
    const base64Image = req.file.buffer.toString("base64");
    const photoUrl = `data:${req.file.mimetype};base64,${base64Image}`;

    // 4. ልዩ መለያ ቁጥር ማመንጨት
    const pensionerId = `PENS-${Math.floor(100000 + Math.random() * 900000)}`;

    // 5. ዳታቤዝ ላይ መመዝገብ
    const newPensioner = new UserPensioner({
      pensionerId,
      name,
      tin,
      phone,
      age: Number(age),
      gender,
      faydaNumber,
      poessaBranch,
      bankName,
      bankBranch,
      pensionAmount: Number(pensionAmount),
      photoUrl // ፎቶው ራሱ ዳታቤዝ ውስጥ ይቀመጣል
    });

    await newPensioner.save();

    res.status(201).json({
      success: true,
      message: "የጡረተኛው መረጃ በዳታቤዝ ውስጥ በቋሚነት ተቀምጧል!",
      data: newPensioner
    });

  } catch (error) {
    console.error("የምዝገባ ሰርቨር ስህተት:", error.message);
    res.status(500).json({ success: false, message: "በሰርቨር ላይ ስህተት አጋጥሟል!" });
  }
});

module.exports = router;
