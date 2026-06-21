const express = require("express");
const router = express.Router();
const UserPensioner = require("./models/UserPensioner"); 
const LivenessVerification = require("./models/LivenessVerification"); // 📊 ለሪፖርቱ የሚያስፈልገው ሞዴል

/* ==========================================================================
   📬 1. POST: /api/liveness/verify-success (ከፍሮንትኤንድ የመጣ የ AI ፈተና ማስቀመጫ)
========================================================================== */
router.post("/verify-success", async (req, res) => {
  try {
    const {
      faydaNumber,
      smilePassed,
      nodPassed,
      turnPassed,
      selfiePhoto, // 📸 ከቅጽበታዊ ካሜራ የተነሳው ሴልፊ ፎቶ
      idPhoto      // 🪪 የመታወቂያ ፎቶ
    } = req.body;

    // 1. መረጃው ሙሉ መሆኑን ማረጋገጥ
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

    // 3. ጡረተኛውን በፋይዳ ቁጥር መፈለግ
    const pensioner = await UserPensioner.findOne({ faydaNumber: faydaNumber });
    if (!pensioner) {
      return res.status(404).json({
        success: false,
        message: "❌ ይህ የፋይዳ ቁጥር በሲስተሙ ላይ አልተገኘም!"
      });
    }

    // 4. ለ Report.js ገጽ የ LivenessVerification ዳታቤዝን ማዘመን/መፍጠር
    // 💡 ባለሙያው አይቶ የመጨረሻ ውሳኔ እስኪሰጥ ድረስ status ወደ 'Pending' ይደረጋል
    await LivenessVerification.findOneAndUpdate(
      { faydaNumber: faydaNumber },
      {
        idPhoto: idPhoto || pensioner.photoUrl || pensioner.photo || "",
        selfiePhoto: selfiePhoto || "",
        faceMatched: true,
        smilePassed: !!smilePassed,
        nodPassed: !!nodPassed,
        turnPassed: !!turnPassed,
        verificationStatus: "Pending", // ⏳ ባለሙያው በሪፖርት ገጽ ላይ እንዲያጸድቀው 'Pending' ይደረጋል
        lastVerificationDate: new Date()
      },
      { upsert: true, new: true }
    );

    // 5. በ UserPensioner ላይ የታሪክ መዝገብ ማዘጋጀት
    const livenessLogEntry = {
      editedBy: "AI Biometric System",
      editedAt: new Date(),
      details: `🤖 በህይወት መኖራቸው በባዮሜትሪክስ ተረጋግጧል። (ፈገግታ፦ አልፏል፣ እንቅስቃሴ፦ አልፏል)`
    };

    if (!pensioner.editHistory || !Array.isArray(pensioner.editHistory)) {
      pensioner.editHistory = [];
    }
    
    pensioner.editHistory.push(livenessLogEntry);
    await pensioner.save();

    console.log(`🟢 ጡረተኛው [${pensioner.nameAmh || pensioner.nameEng}] የ AI ፈተናውን አልፏል!`);

    return res.status(200).json({
      success: true,
      message: `🎉 የ AI ባዮሜትሪክስ ፈተናው ተጠናቋል! አሁን መረጃው ለባለሙያ ቀርቧል።`,
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

    // 1. መረጃው መሟላቱን ቼክ ማድረግ
    if (!verificationStatus) {
      return res.status(400).json({
        success: false,
        message: "⚠️ እባክዎ የማረጋገጫ ሁኔታውን (Verified ወይም Failed) ይግለጹ!"
      });
    }

    // 2. የ LivenessVerification ሰንጠረዥን ማዘመን (ፎቶዎቹ እንዲታዩ)
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

    // 3. የ UserPensioner ሰንጠረዥ ላይም ሁኔታውን (Status) ማመሳሰል
    const pensioner = await UserPensioner.findOne({ faydaNumber: faydaNumber });
    if (pensioner) {
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
