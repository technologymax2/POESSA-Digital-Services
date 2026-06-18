const express = require("express");
const router = express.Router();
const UserPensioner = require("./models/UserPensioner");
const DeletedLog = require("./models/DeletedLog"); // 🟢 ለጠፉ መረጃዎች ታሪክ መዝገብ

// ==========================================================================
// 1️⃣ 🔍 መረጃ መፈለጊያ (GET)
// ==========================================================================
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

// ==========================================================================
// 2️⃣ 📝 መረጃ ማስተካከያ እና 4️⃣ 💀 የህይወት ሁኔታ መቆጣጠሪያ (PUT)
//     🔥 ማሻሻያ፦ የተቀየሩትን ፊልዶች በዝርዝር ለይቶ መመዝገቢያ ተጨምሯል!
// ==========================================================================
router.put("/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { lastEditedBy, status, ...updateFields } = req.body;

    // መጀመሪያ የቆየውን መረጃ ከዳታቤዝ እንፈልጋለን (ለማወዳደር)
    const oldPensioner = await UserPensioner.findById(id);
    if (!oldPensioner) {
      return res.status(404).json({ success: false, message: "ጡረተኛው አልተገኘም!" });
    }

    if (updateFields.age) updateFields.age = Number(updateFields.age) || 0;
    if (updateFields.pensionAmount) updateFields.pensionAmount = Number(updateFields.pensionAmount) || 0;

    // 🟢 የተቀየሩ ፊልዶችን መለያ ዘዴ (Audit Trail)
    let changedFields = [];
    
    // የእንግሊዝኛውን የፊልድ ስም ወደ አማርኛ ፍቺ ለመቀየር ማፒንግ
    const fieldMapping = {
      pensionerId: "Pension ID",
      name: "ሙሉ ስም",
      faydaNumber: "የፋይዳ ቁጥር",
      tin: "ቲን ቁጥር",
      phone: "ስልክ ቁጥር",
      age: "ዕድሜ",
      gender: "ጾታ",
      address: "አድራሻ",
      pensionAmount: "የጡረታ አበል",
      bankName: "የባንክ ስም",
      bankBranch: "የባንክ ቅርንጫፍ",
      poessaBranch: "የፖኤሳ ቅርንጫፍ",
      issueDate: "የተሰጠበት ቀን"
    };

    // በሰውየው የተላኩትን ፊልዶች ከአሮጌው ዳታ ጋር ማወዳደር
    for (const key in updateFields) {
      if (updateFields[key] !== undefined && String(oldPensioner[key]) !== String(updateFields[key])) {
        const amharicName = fieldMapping[key] || key;
        changedFields.push(amharicName);
      }
    }

    // የህይወት ሁኔታ (Status) ተቀይሮ ከሆነ መመዝገብ
    if (status && oldPensioner.status !== status) {
      changedFields.push(`የህይወት ሁኔታ (${status})`);
      updateFields.status = status;
      updateFields.statusChangedDate = new Date();
    }

    // የተቀየሩ ነገሮች ካሉ በታሪክ ማህደሩ (editHistory) ላይ እንመዘግባለን
    if (changedFields.length > 0) {
      updateFields.editHistory = `የተሻሻሉ መረጃዎች፦ [${changedFields.join(", ")}]`;
    } else {
      updateFields.editHistory = "ምንም የተቀየረ መረጃ የለም (የድጋሚ ማረጋገጫ)";
    }

    // ማሻሻያ ያደረገውን ባለሙያ እና ሰዓት መመዝገብ
    updateFields.lastEditedBy = lastEditedBy || "ያልታወቀ ባለሙያ";
    updateFields.lastEditedAt = new Date();

    const updatedPensioner = await UserPensioner.findByIdAndUpdate(
      id, 
      updateFields, 
      { new: true }
    );

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
// 3️⃣ 🗑️ መረጃ ማጥፊያ (DELETE)
// ==========================================================================
router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { employeeName } = req.query;

    const pensioner = await UserPensioner.findById(id);
    if (!pensioner) {
      return res.status(404).json({ success: false, message: "ጡረተኛው አልተገኘም!" });
    }

    const auditLog = new DeletedLog({
      faydaNumber: pensioner.faydaNumber,
      pensionerName: pensioner.name,
      deletedBy: employeeName || "ያልታወቀ ባለሙያ",
      deletedAt: new Date()
    });
    await auditLog.save();

    await UserPensioner.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: `🗑️ የጡረተኛው (ፋይዳ፡ ${pensioner.faydaNumber}) መረጃ በባለሙያ ${auditLog.deletedBy} ሙሉ በሙሉ ጠፍቷል፤ የታሪክ መዝገብ ላይ ሰፍሯል!`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "መረጃውን ማጥፋት አልተቻለም。" });
  }
});

// ==========================================================================
// 5️⃣ 📥 አዲስ መመዝገቢያ (POST)
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
      status: "Active",
      statusChangedDate: new Date(),
      age: Number(pensionerData.age) || 0,
      pensionAmount: Number(pensionerData.pensionAmount) || 0,
      registeredBy: pensionerData.employeeName || "ያልታወቀ ባለሙያ",
      editHistory: "አዲስ የተመዘገበ መረጃ" // መጀመሪያ ሲፈጠር
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
// 📱 6️⃣ የ QR ኮድ ማረጋገጫ (GET)
// ==========================================================================
router.get("/verify/:faydaNum", async (req, res) => {
  try {
    const { faydaNum } = req.params;
    const pensioner = await UserPensioner.findOne({ faydaNumber: faydaNum });
    
    if (!pensioner) {
      return res.status(404).json({ success: false, message: "⚠️ ይህ መታወቂያ ትክክለኛ አይደለም ወይም አልተመዘገበም!" });
    }
    
    res.status(200).json({ success: true, data: pensioner });
  } catch (error) {
    res.status(500).json({ success: false, message: "በማረጋገጥ ሂደት ላይ የሰርቨር ስህተት አጋጥሟል!" });
  }
});

module.exports = router;
