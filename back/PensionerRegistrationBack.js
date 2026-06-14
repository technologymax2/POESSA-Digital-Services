const express = require("express");
const router = express.Router();
const multer = require("multer");
const axios = require("axios");

// ✅ ትክክለኛው የሞዴል መገኛ አድራሻ (models/ ፎልደር ውስጥ)
const UserPensioner = require("./models/UserPensioner"); 

// 📷 ፎቶውን በሰርቨሩ ሚሞሪ ውስጥ ለጊዜው ለመያዝ ውቅረት
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // ከ 5MB በላይ የሆኑ ፎቶዎችን ውድቅ ያደርጋል
});

router.post("/register", upload.single("photo"), async (req, res) => {
  try {
    const {
      name, tin, phone, age, gender,
      faydaNumber, poessaBranch, bankName, bankBranch, pensionAmount
    } = req.body;

    // 1. ፎቶው በትክክል መጫኑን ማረጋገጥ
    if (!req.file) {
      return res.status(400).json({ success: false, message: "እባክዎ የጡረተኛውን ፎቶ ይጫኑ!" });
    }

    // 2. በUserPensioner ሞዴል መፈለግ (ቀድሞ መመዝገቡን ማረጋገጫ)
    const existingPensioner = await UserPensioner.findOne({ faydaNumber });
    if (existingPensioner) {
      return res.status(400).json({ success: false, message: "⚠️ ይህ የፋይዳ ቁጥር ቀድሞ ተመዝግቧል!" });
    }

    // 3. ፎቶውን ወደ Base64 ጽሑፍ መቀየር
    const base64Image = req.file.buffer.toString("base64");

    // 🔑 የImgBB ቁልፍ (በ .env ውስጥ ካለ እሱን ይጠቀማል፣ ከሌለ የሰጠኸኝን ቋሚ ቁልፍ ይወስዳል)
    const imgbbKey = process.env.IMGBB_API_KEY || "8c4293f0b06b2db8de34e2cda9a73bd8"; 

    // 🌐 ፎቶውን ወደ ImgBB በፖስት (POST) ኤፒአይ መላክ (በቀጥታ እንደ ፎርም ዴታ)
    const imgbbResponse = await axios.post(
      `https://api.imgbb.com/1/upload?key=${imgbbKey}`,
      { image: base64Image }, // 🔄 በURLSearchParams ፈንታ በቀጥታ በዕቃ (Object) ፎርማት መላክ ስህተቱን ይፈታል!
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    // ከImgBB የተመለሰው የፎቶ ድረ-ገጽ ሊንክ (URL)
    const photoUrl = imgbbResponse.data.data.url; 

    // 🆔 አዲስ ልዩ የጡረተኛ መለያ ቁጥር ማመንጨት (Unique Pensioner ID)
    const pensionerId = `PENS-${Math.floor(100000 + Math.random() * 900000)}`;

    // 4. አዲሱን የጡረተኛ መረጃ በዳታቤዝ መዋቅር ማዘጋጀት
    const newPensioner = new UserPensioner({
      pensionerId,
      name,
      tin,
      phone,
      age: Number(age), // ወደ ቁጥር (Number) መቀየሩን ማረጋገጥ
      gender,
      faydaNumber,
      poessaBranch,
      bankName,
      bankBranch,
      pensionAmount: Number(pensionAmount), // ወደ ቁጥር (Number) መቀየሩን ማረጋገጥ
      photoUrl
    });

    // 5. በ MongoDB Atlas ላይ በቋሚነት ማስቀመጥ
    await newPensioner.save();

    // ለሪአክት ስኬታማ መልስ መመለስ
    res.status(201).json({
      success: true,
      message: "የጡረተኛው መረጃ በዳታቤዝ ውስጥ በቋሚነት ተቀምጧል!",
      data: newPensioner
    });

  } catch (error) {
    console.error("የምዝገባ ሰርቨር ስህተት:", error.response ? error.response.data : error.message);
    res.status(500).json({ success: false, message: "በሰርቨር ላይ ስህተት አጋጥሟል!" });
  }
});

module.exports = router;
