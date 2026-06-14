const express = require("express");
const router = express.Router();
const multer = require("multer");

const UserPensioner = require("./models/UserPensioner"); 

const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 } 
});

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

    console.log(`⚠️ የጡረተኛው መረጃ [ID: ${id}] በባለሙያ [${employeeName || "Unknown"}] ጠፍቷል።`);

    res.status(200).json({
      success: true,
      message: `🗑️ የጡረተኛው መረጃ በባለሙያ ${employeeName || ""} ሙሉ በሙሉ ጠፍቷል!`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "መረጃውን ማጥፋት አልተቻለም።" });
  }
});

// 4. 📥 አዲስ መመዝገቢያ (POST) -> /api/pensioners/register
router.post("/register", upload.single("photo"), async (req, res) => {
  try {
    const {
      pensionerId, name, tin, phone, age, gender,
      faydaNumber, poessaBranch, bankName, bankBranch, pensionAmount,
      address, issueDate, expiryDate, employeeName 
    } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: "እባክዎ የጡረተኛውን ፎቶ ይጫኑ!" });
    }

    const existingFayda = await UserPensioner.findOne({ faydaNumber });
    if (existingFayda) {
      return res.status(400).json({ success: false, message: "⚠️ ይህ የፋይዳ ቁጥር ቀድሞ ተመዝግቧል!" });
    }

    const existingId = await UserPensioner.findOne({ pensionerId });
    if (existingId) {
      return res.status(400).json({ success: false, message: "⚠️ ይህ የጡረታ መለያ ቁጥር ቀድሞ ተመዝግቧል!" });
    }

    const base64Image = req.file.buffer.toString("base64");
    const photoUrl = `data:${req.file.mimetype};base64,${base64Image}`;

    const newPensioner = new UserPensioner({
      pensionerId, name, tin, phone, age: Number(age) || 0, gender,
      faydaNumber, poessaBranch, bankName, bankBranch, pensionAmount: Number(pensionAmount) || 0,
      address: address || "", issueDate: issueDate || "", expiryDate: expiryDate || "", photoUrl,
      registeredBy: employeeName || "ያልታወቀ ባለሙያ"
    });

    await newPensioner.save();

    res.status(201).json({
      success: true,
      message: `የጡረተኛው መረጃ በባለሙያ ${newPensioner.registeredBy} ተመዝግቧል!`,
      data: newPensioner
    });
  } catch (error) {
    console.error("🔥 Error Detail:", error);
    res.status(500).json({ success: false, message: `በሰርቨር ላይ ስህተት አጋጥሟል! ዝርዝር፡ ${error.message}` });
  }
});

module.exports = router;
