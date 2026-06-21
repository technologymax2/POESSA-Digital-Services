const express = require("express");
const router = express.Router();
const UserPensioner = require("./models/UserPensioner"); 
const LivenessVerification = require("./models/livenessSchema"); // 💡 በ GitHubህ ላይ ካለው የፋይል ስም ጋር ተስተካክሏል

/* ==========================================================================
   📬 1. POST: /api/liveness/verify-success (የ AI ፈተና ሲያልፍ መረጃ ማስቀመጫ)
========================================================================== */
router.post("/verify-success", async (req, res) => {
  try {
    const {
      faydaNumber,
      smilePassed,
      nodPassed,
      turnPassed,
      selfiePhoto, // 📸 ከቅጽበታዊ ካሜራ የመጣ ሴልፊ ፎቶ (Base64 ወይም URL)
      idPhoto      // 🪪 የመታወቂያ ፎቶ
    } = req.body;

    // 1. የፋይዳ ቁጥር መኖሩን ማረጋገጥ
    if (!faydaNumber) {
      return res.status(400).json({
        success: false,
        message: "⚠️ የጡረተኛው የፋይዳ ቁጥር አልተገኘም!"
      });
    }

    // 2. የባዮሜትሪክስ ደህንነት ማጣሪያ
    if (!smilePassed || !nodPassed) {
      return res.status(400).json({
        success: false,
        message: "❌ የደህንነት ጥሰት ተገኝቷል! ሁሉም የህያውነት ፈተናዎች ማለፍ አለባቸው።"
      });
    }

    // 3. ጡረተኛውን በዋናው ሰንጠረዥ መፈለግ
    const pensioner = await UserPensioner.findOne({ faydaNumber: faydaNumber });
    if (!pensioner) {
      return res.status(404).json({
        success: false,
        message: "❌ ይህ የፋይዳ ቁጥር በሲስተሙ ላይ አልተገኘም!"
      });
    }

    // 4. 📊 የእድሳት ሁኔታውን፣ ፎቶዎችን እና ጊዜውን በ LivenessVerification ላይ መመዝገብ
    // 💡 ለሪፖርት ገጹ እንዲመች የጡረተኛውን ስም እና ስልክ አብረን እናስቀምጣለን
    await LivenessVerification.findOneAndUpdate(
      { faydaNumber: faydaNumber },
      {
        name: pensioner.nameAmh || pensioner.nameEng || pensioner.name || "ስም አልተጠቀሰም",
        phone: pensioner.phone || "የሌለ",
        idPhoto: idPhoto || pensioner.photoUrl || pensioner.photo || "", // የመታወቂያ ፎቶ ካለ፣ ከሌለ ከዋናው ይወስዳል
        selfiePhoto: selfiePhoto || "", // አዲሱ የሴልፊ ፎቶ
        faceMatched: true,
        smilePassed: !!smilePassed,
        nodPassed: !!nodPassed,
        turnPassed: !!turnPassed,
        verificationStatus: "Pending", // ⏳ ባለሙያው በሪፖርት ገጽ ላይ እስኪያጸድቀው 'Pending' ሆኖ ይቆያል
        lastVerificationDate: new Date() // ⏰ የተደረገበት ትክክለኛ ጊዜ
      },
      { upsert: true, new: true } // ዳታው ከሌለ አዲስ ይፈጥራል (ዳታቤዝህ ባዶ እንዳይሆን ያደርጋል)
    );

    // 5. 📝 በ UserPensioner ዋና ሰንጠረዥ ላይ የታሪክ መዝገብ (Log) ማስፈር
    const livenessLogEntry = {
      editedBy: "AI Biometric System",
      editedAt: new Date(),
      details: `🤖 የ AI ባዮሜትሪክስ ፈተናዎችን በተሳካ ሁኔታ አልፏል። ሁኔታው ወደ ባለሙያ መርማሪ ተልኳል።`
    };

    if (!pensioner.editHistory || !Array.isArray(pensioner.editHistory)) {
      pensioner.editHistory = [];
    }
    
    pensioner.editHistory.push(livenessLogEntry);
    await pensioner.save();

    console.log(`🟢 ጡረተኛው [${pensioner.nameAmh || pensioner.nameEng}] የ AI ፈተናውን አልፏል!`);

    return res.status(200).json({
      success: true,
      message: `🎉 የ AI ባዮሜትሪክስ ፈተናው ተጠናቋል! መረጃው ለባለሙያ ቀርቧል።`,
      data: pensioner
    });

  } catch (error) {
    console.error("Liveness Verification Endpoint Error:", error);
    return res.status(500).json({
      success: false,
      message: `❌ በሰርቨር ላይ መረጃውን ለማስቀመጥ ያልታሰበ ስህተት አጋጥሟል፦ ${error.message}`
    });
  }
});

/* ==========================================================================
   🔍 2. GET: /api/pensioners (ሁሉንም የባዮሜትሪክስ ዳታዎች ለ Report.js ማምጫ)
========================================================================== */
router.get("/pensioners", async (req, res) => {
  try {
    const data = await LivenessVerification.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error("Get Report Data Error:", error);
    return res.status(500).json({
      success: false,
      message: `❌ የሪፖርት መረጃዎችን ማምጣት አልተቻለም፦ ${error.message}`
    });
  }
});

/* ==========================================================================
   🟢 🔴 3. PUT: /api/pensioners/verify-status/:faydaNumber (ባለሙያው ሲያጸድቅ/ሲያባርር)
========================================================================== */
router.put("/pensioners/verify-status/:faydaNumber", async (req, res) => {
  try {
    const { faydaNumber } = req.params;
    const { verificationStatus, comment } = req.body;

    if (!verificationStatus) {
      return res.status(400).json({
        success: false,
        message: "⚠️ እባክዎ የማረጋገጫ ሁኔታውን (Verified ወይም Failed) ይግለጹ!"
      });
    }

    // 1. የባዮሜትሪክስ መረጃ ሰንጠረዥን ማዘመን
    const updatedLiveness = await LivenessVerification.findOneAndUpdate(
      { faydaNumber: faydaNumber },
      { verificationStatus, comment, lastVerificationDate: new Date() },
      { new: true }
    );

    if (!updatedLiveness) {
      return res.status(404).json({
        success: false,
        message: "❌ የባዮሜትሪክስ መረጃው በሲስተሙ ላይ አልተገኘም!"
      });
    }

    // 2. በዋናው የ UserPensioner ሰንጠረዥ ላይም የጡረተኛውን የእድሳት ሁኔታ (Status) ማመሳሰል
    const pensioner = await UserPensioner.findOne({ faydaNumber: faydaNumber });
    if (pensioner) {
      // ባለሙያው ካጸደቀው "Active" (የታደሰ) ይሆናል፣ ካልሆነ "Suspended" (የታገደ) ይሆናል
      pensioner.status = verificationStatus === "Verified" ? "Active" : "Suspended";
      pensioner.statusChangedDate = new Date();
      pensioner.lastEditedBy = "System Admin / Expert";
      pensioner.lastEditedAt = new Date();

      const adminLogEntry = {
        editedBy: "System Admin / Expert",
        editedAt: new Date(),
        details: `👤 በባለሙያ የተሰጠ ውሳኔ፦ ${verificationStatus}. ማሳሰቢያ፦ ${comment || "የለም"}`
      };

      if (!pensioner.editHistory) pensioner.editHistory = [];
      pensioner.editHistory.push(adminLogEntry);
      
      await pensioner.save();
    }

    return res.status(200).json({
      success: true,
      message: `🟢 የጡረተኛው ሁኔታ በተሳካ ሁኔታ ወደ ${verificationStatus} ተቀይሯል!`,
      data: updatedLiveness
    });

  } catch (error) {
    console.error("Update Status Endpoint Error:", error);
    return res.status(500).json({
      success: false,
      message: `❌ ሁኔታውን ለመለወጥ በሰርቨር ላይ ስህተት አጋጥሟል፦ ${error.message}`
    });
  }
});

module.exports = router;
