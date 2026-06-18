const express = require("express");
const router = express.Router();
const UserPensioner = require("./models/UserPensioner");
const DeletedLog = require("./models/DeletedLog"); // 🟢 ለጠፉ መረጃዎች ታሪክ መዝገብ

// ==========================================================================
// 1️⃣ 🔍 መረጃ መፈለጊያ (GET) -> ሳርም ሙሉውን ፊልድ እንዲያመጣ ተደርጓል
// ==========================================================================
router.get("/search", async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ success: false, message: "እባክዎ መፈለጊያ ቁጥር ያስገቡ!" });
    }
    
    // በፋይዳ ቁጥር፣ ስልክ ወይም በጡረታ መታወቂያ ይፈልጋል
    const pensioner = await UserPensioner.findOne({
      $or: [{ faydaNumber: query }, { phone: query }, { pensionerId: query }]
    });
    
    if (!pensioner) {
      return res.status(404).json({ success: false, message: "⚠️ በዚህ ቁጥር የተመዘገበ ጡረተኛ አልተገኘም!" });
    }
    
    res.status(200).json({ success: true, data: pensioner });
  } catch (error) {
    res.status(500).json({ success: false, message: "በሰርቨር ላይ የፍለጋ ስህተት አጋጥሟል!" });
  }
});

// ==========================================================================
// 2️⃣ 📝 መረጃ ማስተካከያ እና 4️⃣ 💀 የህይወት ሁኔታ መቆጣጠሪያ (PUT)
// ==========================================================================
router.put("/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { lastEditedBy, status, ...updateFields } = req.body;

    if (updateFields.age) updateFields.age = Number(updateFields.age) || 0;
    if (updateFields.pensionAmount) updateFields.pensionAmount = Number(updateFields.pensionAmount) || 0;

    // 🟢 2ኛ ጥያቄ፡ CRUD ያደረገውን ባለሙያ እና ሰዓት መመዝገብ
    updateFields.lastEditedBy = lastEditedBy || "ያልታወቀ ባለሙያ";
    updateFields.lastEditedAt = new Date();

    // 🟢 4ኛ ጥያቄ፡ ሰውየው ከሞተ passive ካልሞተ active ማድረግ እና የተደረገበትን ቀን መመዝገብ
    if (status) {
      updateFields.status = status;
      updateFields.statusChangedDate = new Date();
    }

    const updatedPensioner = await UserPensioner.findByIdAndUpdate(
      id, 
      updateFields, 
      { new: true }
    );

    if (!updatedPensioner) {
      return res.status(404).json({ success: false, message: "ጡረተኛው አልተገኘም!" });
    }

    res.status(200).json({
      success: true,
      message: `🎉 መረጃው በባለሙያ ${updateFields.lastEditedBy} በተሳካ ሁኔታ ተስተካክሏል!`,
      data: updatedPensioner
    });
  } catch (error) {
    res.status(500).json({ success: false, message: `መረጃውን ማስተካከል አልተቻለም፡ ${error.message}` });
  }
});

// ==========================================================================
// 3️⃣ 🗑️ መረጃ ማጥፊያ (DELETE) -> የፋይዳ ቁጥር፣ ያጠፋውን ባለሙያ እና ቀኑን ሎግ ያደርጋል
// ==========================================================================
router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { employeeName } = req.query; // ከሪአክት በዩአርኤል የሚመጣ የባለሙያ ስም

    // መጀመሪያ መረጃውን ከማጥፋታችን በፊት እንፈልገዋለን
    const pensioner = await UserPensioner.findById(id);

    if (!pensioner) {
      return res.status(404).json({ success: false, message: "ጡረተኛው አልተገኘም!" });
    }

    // 🟢 3ኛ ጥያቄ፡ ከጠፋ የፋይዳ ቁጥሩን፣ ያጠፋውን ባለሙያ እና ቀኑን መዝግቦ መያዝ
    const auditLog = new DeletedLog({
      faydaNumber: pensioner.faydaNumber,
      pensionerName: pensioner.name,
      deletedBy: employeeName || "ያልታወቀ ባለሙያ",
      deletedAt: new Date()
    });
    await auditLog.save(); // ወደ ታሪክ መዝገብ ሰሌዳ ተቀመጠ

    // አሁን ከዋናው የጡረተኞች ሰንጠረዥ እናጠፋዋለን
    await UserPensioner.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: `🗑️ የጡረተኛው (ፋይዳ፡ ${pensioner.faydaNumber}) መረጃ በባለሙያ ${auditLog.deletedBy} ሙሉ በሙሉ ጠፍቷል፤ የታሪክ መዝገብ ላይ ሰፍሯል!`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "መረጃውን ማጥፋት አልተቻለም።" });
  }
});

// ==========================================================================
// 5️⃣ 📥 አዲስ መመዝገቢያ (POST) -> መጀመሪያ የመዘገበውን ባለሙያ በቋሚነት ይይዛል
// ==========================================================================
router.post("/register", async (req, res) => {
  try {
    const { photoUrl, ...pensionerData } = req.body;

    if (!photoUrl) {
      return res.status(400).json({ success: false, message: "⚠️ የፎቶ ሊንክ አልተገኘም!" });
    }

    const existingFayda = await UserPensioner.findOne({ faydaNumber: pensionerData.faydaNumber });
    if (existingFayda) {
      return res.status(400).json({ success: false, message: "⚠️ ይህ የፋይዳ ቁጥር ቀድሞ ተመዝግቧል!" });
    }

    const newPensioner = new UserPensioner({
      ...pensionerData,
      photoUrl,
      status: "Active", // አዲስ ሲመዘገብ ሁሌም Active ነው
      statusChangedDate: new Date(),
      age: Number(pensionerData.age) || 0,
      pensionAmount: Number(pensionerData.pensionAmount) || 0,
      registeredBy: pensionerData.employeeName || "ያልታወቀ ባለሙያ" // የመጀመሪያ መዝጋቢ
    });

    await newPensioner.save();

    res.status(201).json({
      success: true,
      message: `የጡረተኛው መረጃ በባለሙያ ${newPensioner.registeredBy} ተመዝግቧል!`,
      data: newPensioner
    });
  } catch (error) {
    res.status(500).json({ success: false, message: `በሰርቨር ላይ ስህተት አጋጥሟል! ዝርዝር፡ ${error.message}` });
  }
});



// ==========================================================================
// 📱 6️⃣ የ QR ኮድ ማረጋገጫ (GET) -> ለ ScanVerify.js የተዘጋጀ
// ==========================================================================
router.get("/verify/:faydaNum", async (req, res) => {
  try {
    const { faydaNum } = req.params;
    
    // በፋይዳ ቁጥር ብቻ ይፈልጋል
    const pensioner = await UserPensioner.findOne({ faydaNumber: faydaNum });
    
    if (!pensioner) {
      return res.status(404).json({ success: false, message: "⚠️ ይህ መታወቂያ ትክክለኛ አይደለም ወይም አልተመዘገበም!" });
    }
    
    // 🚨 ሪአክት በቀጥታ ማንበብ እንዲችል ዳታውን ነጥለን እንልካለን
    res.status(200).json({ success: true, data: pensioner });
  } catch (error) {
    res.status(500).json({ success: false, message: "በማረጋገጥ ሂደት ላይ የሰርቨር ስህተት አጋጥሟል!" });
  }
});



module.exports = router;
