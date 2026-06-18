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
//     🔥 ማሻሻያ፦ በምስል 1000004927.jpg ላይ የመጣውን የ Type String/Array ግጭት ሙሉ በሙሉ የፈታ!
// ==========================================================================
router.put("/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // 🔥 ፍሮንትኤንድ ላይ በስህተት editHistory ተያይዞ ቢመጣ እንኳ ከ updateFields ላይ ነጥለን እናስቀራለን
    const { lastEditedBy, status, editHistory, ...updateFields } = req.body;

    // መጀመሪያ የቆየውን መረጃ ከዳታቤዝ እንፈልጋለን (ለማወዳደር እና Type ለማስተካከል)
    const oldPensioner = await UserPensioner.findById(id);
    if (!oldPensioner) {
      return res.status(404).json({ success: false, message: "ጡረተኛው አልተገኘም!" });
    }

    if (updateFields.age) updateFields.age = Number(updateFields.age) || 0;
    if (updateFields.pensionAmount) updateFields.pensionAmount = Number(updateFields.pensionAmount) || 0;

    // 🟢 የተቀየሩ ፊልዶችን መለያ ዘዴ (Audit Trail)
    let changedFields = [];
    
    // በራውተርህ ውስጥ update ፎርሙ ላይ fieldMapping የሚለውን በዚህ ተካው፡
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


    // ማነጻጸር ያለብን እውነተኛ የተጠቃሚ ፊልዶችን ብቻ ነው
    for (const key in fieldMapping) {
      if (updateFields[key] !== undefined && String(oldPensioner[key]) !== String(updateFields[key])) {
        changedFields.push(fieldMapping[key]);
      }
    }

    // የህይወት ሁኔታ (Status) ተቀይሮ ከሆነ መመዝገብ እና ቀኑን ማደስ
    if (status && oldPensioner.status !== status) {
      changedFields.push(`የህይወት ሁኔታ (${status === 'Passive' ? 'Passive/የአረፉ' : 'Active/በህይወት ያሉ'})`);
      updateFields.status = status;
      updateFields.statusChangedDate = new Date();
    } else {
      updateFields.status = oldPensioner.status;
    }

    // 🛠️ Payload ማዘጋጀት
    const updatePayload = {
      $set: updateFields
    };

    // የተቀየሩ ነገሮች ካሉ አዲስ የታሪክ Object እናዘጋጃለን
    if (changedFields.length > 0) {
      updateFields.lastEditedBy = lastEditedBy || "ያልታወቀ ባለሙያ";
      updateFields.lastEditedAt = new Date();

      const historyEntry = {
        editedBy: updateFields.lastEditedBy,
        editedAt: updateFields.lastEditedAt,
        details: `የተሻሻሉ መረጃዎች፦ [${changedFields.join(", ")}]`
      };

      // 🔥 ቁልፍ ፊክስ፦ በዳታቤዙ ውስጥ የቆየው editHistory 'string' ከሆነ ወይም ከሌለ መጀመሪያ ወደ Array እንቀይረዋለን!
      if (!oldPensioner.editHistory || typeof oldPensioner.editHistory === 'string') {
        // ድሮ የነበረው string መረጃ ካለ መጥፋት ስለሌለበት እሱን የመጀመሪያ መዝገብ እናደርገዋለን
        const legacyDetails = typeof oldPensioner.editHistory === 'string' ? oldPensioner.editHistory : "የቆየ መረጃ ማሻሻያ";
        
        updatePayload.$set.editHistory = [
          {
            editedBy: oldPensioner.lastEditedBy || "የቆየ ባለሙያ",
            editedAt: oldPensioner.lastEditedAt || new Date(),
            details: legacyDetails
          },
          historyEntry // ይህ ደግሞ አዲሱ የታሪክ መዝገብ ነው
        ];
      } else {
        // ቀድሞውኑ Array ከሆነ በተለመደው $push እንጨምራለን (ምንም ግጭት አይፈጥርም)
        updatePayload.$push = { editHistory: historyEntry };
      }
    } else {
      // ምንም ካልተቀየረ የድሮው የታሪክ መረጃ እንዳለ ይቀጥላል
      updateFields.lastEditedBy = oldPensioner.lastEditedBy;
      updateFields.lastEditedAt = oldPensioner.lastEditedAt;
    }

    // ዳታቤዝ ላይ ያረማል
    const updatedPensioner = await UserPensioner.findByIdAndUpdate(
      id, 
      updatePayload, 
      { new: true }
    );

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
// 🗑️ 3.5️⃣ የጠፉ መረጃዎችን በሙሉ ማምጫ (GET ALL DELETED LOGS)
//     🔥 አዲስ ማሻሻያ፦ ፍለጋ ሳይደረግ ሁሌም ከታች እንዲታይ ለማድረግ!
// ==========================================================================
router.get("/deleted-logs", async (req, res) => {
  try {
    // የጠፉትን ታሪኮች በሙሉ የመጨረሻው መጀመሪያ እንዲሆን (descending) አድርጎ ያመጣል
    const logs = await DeletedLog.find().sort({ deletedAt: -1 });
    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: "የጠፉ መረጃዎችን ታሪክ ማምጣት አልተቻለም" });
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

    const creatorName = pensionerData.employeeName || "ያልታወቀ ባለሙያ";

    const newPensioner = new UserPensioner({
      ...pensionerData,
      photoUrl,
      status: "Active",
      statusChangedDate: new Date(),
      age: Number(pensionerData.age) || 0,
      pensionAmount: Number(pensionerData.pensionAmount) || 0,
      registeredBy: creatorName,
      // አዲስ ሲመዘገብ ሁልጊዜም በ Array አወቃቀር ይጀምራል
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
