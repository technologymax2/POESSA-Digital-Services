const express = require("express");
const router = express.Router();
const UserPensioner = require("./models/UserPensioner");

// 1. 🔍 መረጃ መፈለጊያ (GET) -> /api/pensioners/search
router.get("/search", async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ success: false, message: "እባክዎ መፈለጊያ ቁጥር ያስገቡ!" });
    }
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

// 2. 📝 መረጃ ማስተካከያ (PUT) -> /api/pensioners/update/:id
router.put("/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { employeeName, ...updateFields } = req.body;

    if (updateFields.age) updateFields.age = Number(updateFields.age) || 0;
    if (updateFields.pensionAmount) updateFields.pensionAmount = Number(updateFields.pensionAmount) || 0;

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

// 3. 🗑️ መረጃ ማጥፊያ (DELETE) -> /api/pensioners/delete/:id
router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { employeeName } = req.query;

    const deletedPensioner = await UserPensioner.findByIdAndDelete(id);

    if (!deletedPensioner) {
      return res.status(404).json({ success: false, message: "ጡረተኛው አልተገኘም!" });
    }

    res.status(200).json({
      success: true,
      message: `🗑️ የጡረተኛው መረጃ በባለሙያ ${employeeName || ""} ሙሉ በሙሉ ጠፍቷል!`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "መረጃውን ማጥፋት አልተቻለም።" });
  }
});

// 4. 📥 አዲስ መመዝገቢያ (POST) -> /api/pensioners/register
router.post("/register", async (req, res) => {
  try {
    // ፎቶው ከFrontend በ ImgBB ሊንክ (photoUrl) ስለሚመጣ multer አያስፈልግም
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
      age: Number(pensionerData.age) || 0,
      pensionAmount: Number(pensionerData.pensionAmount) || 0,
      registeredBy: pensionerData.employeeName || "ያልታወቀ ባለሙያ"
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

module.exports = router;
