const express = require("express");
const router = express.Router();
const UserPensioner = require("./models/UserPensioner");
const DeletedLog = require("./models/DeletedLog"); 

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

// ሁሉንም ጡረተኞች ለሪፖርት ማምጫ መስመር
router.get("/", async (req, res) => {
  try {
    const pensioners = await UserPensioner.find().sort({ createdAt: -1 });
    res.status(200).json(pensioners);
  } catch (error) {
    res.status(500).json({ success: false, message: "ማምጣት አልተቻለም" });
  }
});

// ==========================================================================
// 🔍 1.5️⃣ በሪል-ታይም መደጋገም ማረጋገጫ (GET)
// ==========================================================================
router.get("/check-duplicate", async (req, res) => {
  try {
    const { field, value } = req.query;

    const allowedFields = ['pensionerId', 'tin', 'faydaNumber'];
    if (!allowedFields.includes(field)) {
      return res.status(400).json({ success: false, error: "ልክ ያልሆነ የፊልድ ስም ነው!" });
    }

    if (!value) {
      return res.status(400).json({ success: false, error: "እባክዎ የሚመረመረውን ዋጋ ያስገቡ!" });
    }

    const exists = await UserPensioner.exists({ [field]: value });
    return res.status(200).json({ exists: !!exists });
  } catch (error) {
    return res.status(500).json({ success: false, message: "የመደጋገም ማረጋገጫ ላይ ስህተት አጋጥሟል" });
  }
});

// ==========================================================================
// 2️⃣ 📝 መረጃ ማስተካከያ እና 4️⃣ 💀 የህይወት ሁኔታ መቆጣጠሪያ (PUT)
// ==========================================================================
router.put("/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { lastEditedBy, status, editHistory, ...updateFields } = req.body;

    const numberFields = ['pensionerId', 'phone', 'tin'];
    for (const field of numberFields) {
      if (updateFields[field] !== undefined) {
        if (/\D/.test(updateFields[field])) {
          return res.status(400).json({ success: false, message: `❌ ${field} ቁጥር ብቻ መሆን አለበት!` });
        }
        if (updateFields[field].length !== 10) {
          return res.status(400).json({ success: false, message: `❌ ${field} ልክ 10 ዲጂት መሆን አለበት!` });
        }
      }
    }

    if (updateFields.phone && updateFields.phone[0] !== '0') {
      return res.status(400).json({ success: false, message: "❌ ስልክ ቁጥር በ '0' መጀመር አለበት!" });
    }

    const oldPensioner = await UserPensioner.findById(id);
    if (!oldPensioner) {
      return res.status(404).json({ success: false, message: "ጡረተኛው አልተገኘም!" });
    }

    if (updateFields.age) updateFields.age = Number(updateFields.age) || 0;
    if (updateFields.pensionAmount) updateFields.pensionAmount = Number(updateFields.pensionAmount) || 0;

    let changedFields = [];
    
    const fieldMapping = {
      pensionerId: "Pension ID",
      nameAmh: "ሙሉ ስም (አማርኛ)",
      nameEng: "Full Name (Eng)",
      faydaNumber: "የፋይዳ ቁጥር",
      tin: "ቲን ቁጥር",
      phone: "ስልክ ቁጥር",
      age: "ዕድሜ",
      gender: "ጾታ",
      addressAmh: "አድራሻ (አማርኛ)",
      addressEng: "Address (Eng)",
      pensionAmount: "የጡረታ አበል",
      bankNameAmh: "የባንክ ስም (አማርኛ)",
      bankNameEng: "Bank Name (Eng)",
      bankBranch: "የባንክ ቅርንጫፍ",
      poessaBranch: "የፖኤሳ ቅርንጫፍ",
      issueDate: "የተሰጠበት ቀን"
    };

    for (const key in fieldMapping) {
      if (updateFields[key] !== undefined && String(oldPensioner[key]) !== String(updateFields[key])) {
        changedFields.push(fieldMapping[key]);
      }
    }

    if (status && oldPensioner.status !== status) {
      changedFields.push(`የህይወት ሁኔታ (${status === 'Passive' ? 'Passive/የአረፉ' : 'Active/በህይወት ያሉ'})`);
      updateFields.status = status;
      updateFields.statusChangedDate = new Date();
    } else {
      updateFields.status = oldPensioner.status;
    }

    const updatePayload = { $set: updateFields };

    if (changedFields.length > 0) {
      updateFields.lastEditedBy = lastEditedBy || "ያልታወቀ ባለሙያ";
      updateFields.lastEditedAt = new Date();

      const historyEntry = {
        editedBy: updateFields.lastEditedBy,
        editedAt: updateFields.lastEditedAt,
        details: `የተሻሻሉ መረጃዎች፦ [${changedFields.join(", ")}]`
      };

      if (!oldPensioner.editHistory || typeof oldPensioner.editHistory === 'string') {
        const legacyDetails = typeof oldPensioner.editHistory === 'string' ? oldPensioner.editHistory : "የቆየ መረጃ ማሻሻያ";
        updatePayload.$set.editHistory = [
          {
            editedBy: oldPensioner.lastEditedBy || "የቆየ ባለሙያ",
            editedAt: oldPensioner.lastEditedAt || new Date(),
            details: legacyDetails
          },
          historyEntry
        ];
      } else {
        updatePayload.$push = { editHistory: historyEntry };
      }
    } else {
      updateFields.lastEditedBy = oldPensioner.lastEditedBy;
      updateFields.lastEditedAt = oldPensioner.lastEditedAt;
    }

    const updatedPensioner = await UserPensioner.findByIdAndUpdate(id, updatePayload, { new: true });

    res.status(200).json({
      success: true,
      message: `🎉 መረጃው በባለሙያ ${updatedPensioner.lastEditedBy} በተሳካ ሁኔታ ተስተካክሏል!`,
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
      pensionerName: pensioner.nameAmh || pensioner.nameEng,
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
    res.status(500).json({ success: false, message: "መረጃውን ማጥፋት አልተቻለም።" });
  }
});

// ==========================================================================
// 🗑️ 3.5️⃣ የጠፉ መረጃዎችን በሙሉ ማምጫ
// ==========================================================================
router.get("/deleted-logs", async (req, res) => {
  try {
    const logs = await DeletedLog.find().sort({ deletedAt: -1 });
    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: "የጠፉ መረጃዎችን ታሪክ ማምጣት አልተቻለም" });
  }
});

// ==========================================================================
// 5️⃣ 📥 አዲስ መመዝገቢያ (POST) - (🛠️ የተስተካከለ)
// ==========================================================================
router.post("/register", async (req, res) => {
  try {
    const { photoUrl, faceDescriptor, ...pensionerData } = req.body; 

    if (!photoUrl) {
      return res.status(400).json({ success: false, message: "⚠️ የፎቶ ሊንክ አልተገኘም!" });
    }

    // 💡 የ Pensioner ID መኖሩን አስቀድሞ የማረጋገጫ ሴፍቲ ኔት
    if (!pensionerData.pensionerId) {
      return res.status(400).json({ success: false, message: "❌ ስህተት፡ የጡረተኛው መለያ ቁጥር (Pensioner ID) አልተላከም!" });
    }

    const numberFields = ['pensionerId', 'phone', 'tin'];
    for (const field of numberFields) {
      if (pensionerData[field]) {
        if (/\D/.test(pensionerData[field]) || pensionerData[field].length !== 10) {
          return res.status(400).json({ success: false, message: `❌ ${field} ልክ 10 ዲጂት ቁጥር ብቻ መሆን አለበት!` });
        }
      }
    }
    if (pensionerData.phone && pensionerData.phone[0] !== '0') {
      return res.status(400).json({ success: false, message: "❌ ስልክ ቁጥር በ '0' መጀመር አለበት!" });
    }

    // የዱፕሊኬት ቼከር
    const existingFayda = await UserPensioner.findOne({ faydaNumber: pensionerData.faydaNumber });
    if (existingFayda) {
      return res.status(400).json({ success: false, message: "⚠️ ይህ የፋይዳ ቁጥር ቀድሞ ተመዝግቧል!" });
    }

    const existingId = await UserPensioner.findOne({ pensionerId: pensionerData.pensionerId });
    if (existingId) {
      return res.status(400).json({ success: false, message: "⚠️ ይህ የፔንሽን መለያ ቁጥር ቀድሞ ተመዝግቧል!" });
    }

    const creatorName = pensionerData.employeeName || "ያልታወቀ ባለሙያ";

    const newPensioner = new UserPensioner({
      ...pensionerData,
      photoUrl,
      faceDescriptor: faceDescriptor || [], 
      status: "Active",
      statusChangedDate: new Date(),
      age: Number(pensionerData.age) || 0,
      pensionAmount: Number(pensionerData.pensionAmount) || 0,
      registeredBy: creatorName,
      editHistory: [{
        editedBy: creatorName,
        editedAt: new Date(),
        details: "አዲስ የተመዘገበ መረጃ"
      }]
    });

    await newPensioner.save();

    res.status(201).json({
      success: true,
      message: `የጡረተኛው መረጃ በባለሙያ ${newPensioner.registeredBy} ተመዝግቧል!`,
      data: newPensioner
    });
  } catch (error) {
    // 💡 እዚህ ጋር ስህተቱ ምን እንደሆነ በግልጽ በፍሮንት-ኤንድ እንዲታይ አድርጌዋለሁ
    res.status(500).json({ success: false, message: `በዳታቤዝ ምዝገባ ላይ ስህተት አጋጥሟል፦ ${error.message}` });
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

// ==========================================================================
// 🤖 7️⃣ የፊት ለይቶ ማወቂያ API (POST)
// ==========================================================================
router.post("/verify-face", async (req, res) => {
  try {
    const { query, currentDescriptor } = req.body;

    if (!query || !currentDescriptor || !Array.isArray(currentDescriptor)) {
      return res.status(400).json({ success: false, message: "⚠️ ያልተሟላ መረጃ! መለያ ቁጥር እና የፊት አሻራ ያስፈልጋል።" });
    }

    const pensioner = await UserPensioner.findOne({
      $or: [{ faydaNumber: query }, { phone: query }, { pensionerId: query }]
    });

    if (!pensioner) {
      return res.status(404).json({ success: false, message: "❌ ጡረተኛው አልተገኘም!" });
    }

    if (!pensioner.faceDescriptor || pensioner.faceDescriptor.length === 0) {
      return res.status(400).json({ success: false, message: "⚠️ የዚህ ጡረተኛ የፊት አሻራ በሲስተሙ ላይ አልተመዘገበም!" });
    }

    const dbDescriptor = pensioner.faceDescriptor;
    let sumSquares = 0;
    for (let i = 0; i < dbDescriptor.length; i++) {
      sumSquares += Math.pow(dbDescriptor[i] - currentDescriptor[i], 2);
    }
    const distance = Math.sqrt(sumSquares);

    const isMatch = distance < 0.6;

    if (isMatch) {
      pensioner.status = "Active";
      pensioner.statusChangedDate = new Date();
      await pensioner.save();

      return res.status(200).json({
        success: true,
        match: true,
        distance,
        message: `🎉 የማንነት ማረጋገጫ ተሳክቷል! ጡረተኛው፡ ${pensioner.nameAmh}`,
        data: pensioner
      });
    } else {
      return res.status(200).json({
        success: false,
        match: false,
        distance,
        message: "❌ የፊት ገጽታው በዳታቤዝ ካለው ምስል ጋር አልተዛመደም!"
      });
    }

  } catch (error) {
    res.status(500).json({ success: false, message: `በፊት ማረጋገጥ ሂደት ላይ የሰርቨር ስህተት፦ ${error.message}` });
  }
});

module.exports = router;
