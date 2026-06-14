const express = require("express");
const router = express.Router();
const multer = require("multer");

const UserPensioner = require("./models/UserPensioner"); 

const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 } 
});

// 1. 🔍 የጡረተኛ መረጃ መፈለጊያ መስመር (GET)
router.get("/search", async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ success: false, message: "እባክዎ መፈለጊያ ቁጥር ያስገቡ!" });
    }

    const pensioner = await UserPensioner.findOne({
      $or: [{ faydaNumber: query }, { phone: query }]
    });

    if (!pensioner) {
      return res.status(404).json({ success: false, message: "⚠️ በዚህ ቁጥር የተመዘገበ ጡረተኛ አልተገኘም!" });
    }
    res.status(200).json({ success: true, data: pensioner });
  } catch (error) {
    res.status(500).json({ success: false, message: "በሰርቨር ላይ የፍለጋ ስህተት አጋጥሟል!" });
  }
});

// 2. 📝 የተሳሳተ መረጃ ማስተካከያ መስመር (PUT) - የባለሙያ ስም ይጨምራል 👤
router.put("/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { employeeName, ...updateFields } = req.body; // ➕ የባለሙያውን ስም እንለያለን

    if (updateFields.age) updateFields.age = Number(updateFields.age);
    if (updateFields.pensionAmount) updateFields.pensionAmount = Number(updateFields.pensionAmount);

    // ➕ ያረመውን ባለሙያ ስም እና ሰዓት አብሮ መመዝገብ
    updateFields.updatedBy = employeeName || "ያልታወቀ ባለሙያ";
    updateFields.lastUpdatedAt = new Date();

    const updatedPensioner = await UserPensioner.findByIdAndUpdate(id, updateFields, { new: true });

    if (!updatedPensioner) {
      return res.status(404).json({ success: false, message: "ጡረተኛው አልተገኘም!" });
    }

    res.status(200).json({
      success: true,
      message: `🎉 መረጃው በባለሙያ ${updateFields.updatedBy} በተሳካ ሁኔታ ተስተካክሏል!`,
      data: updatedPensioner
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "መረጃውን ማስተካከል አልተቻለም።" });
  }
});

// 3. 🗑️ መረጃ ማጥፊያ መስመር (DELETE) - ያጠፋውን ባለሙያ በኮንሶል/ሎግ ይይዛል 👤
router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { employeeName } = req.query; // ➕ ያጠፋው ባለሙያ ስም ከኩዌሪ ይመጣል

    const deletedPensioner = await UserPensioner.findByIdAndDelete(id);

    if (!deletedPensioner) {
      return res.status(404).json({ success: false, message: "ጡረተኛው አልተገኘም!" });
    }

    // 🚨 ለደህንነት ሲባል ማን እንዳጠፋው በሰርቨሩ ሎግ ላይ በግልጽ ይመዘገባል
    console.log(`⚠️ 🚨 ትኩረት፡ የጡረተኛው መረጃ [ስም፡ ${deletedPensioner.name}፣ ID: ${deletedPensioner.pensionerId}] በባለሙያ [${employeeName || "Unknown"}] ከዳታቤዝ ተሰርዟል! ቀን፡ ${new Date()}`);

    res.status(200).json({
      success: true,
      message: `🗑️ የጡረተኛው መረጃ በባለሙያ ${employeeName || ""} ሙሉ በሙሉ ጠፍቷል!`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "መረጃውን ማጥፋት አልተቻለም።" });
  }
});

// 4. 📥 የጡረተኛ መመዝገቢያ መስመር (POST) - የመዘገበውን ባለሙያ ስም ይይዛል 👤
router.post("/register", upload.single("photo"), async (req, res) => {
  try {
    const {
      pensionId, name, tin, phone, age, gender,
      faydaNumber, poessaBranch, bankName, bankBranch, pensionAmount,
      address, issueDate, expiryDate, employeeName // ➕ የባለሙያው ስም
    } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: "እባክዎ የጡረተኛውን ፎቶ ይጫኑ!" });
    }

    const existingFayda = await UserPensioner.findOne({ faydaNumber });
    if (existingFayda) {
      return res.status(400).json({ success: false, message: "⚠️ ይህ የፋይዳ ቁጥር ቀድሞ ተመዝግቧል!" });
    }

    const base64Image = req.file.buffer.toString("base64");
    const photoUrl = `data:${req.file.mimetype};base64,${base64Image}`;

    const newPensioner = new UserPensioner({
      pensionerId: pensionId,
      name, tin, phone, age: Number(age), gender,
      faydaNumber, poessaBranch, bankName, bankBranch, pensionAmount: Number(pensionAmount),
      address, issueDate, expiryDate, photoUrl,
      registeredBy: employeeName || "ያልታወቀ ባለሙያ", // ➕ የመዘገበው ባለሙያ ስም
      registeredAt: new Date()
    });

    await newPensioner.save();

    res.status(201).json({
      success: true,
      message: `የጡረተኛው መረጃ በባለሙያ ${newPensioner.registeredBy} ተመዝግቧል!`,
      data: newPensioner
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "በሰርቨር ላይ ስህተት አጋጥሟል!" });
  }
});

module.exports = router;
