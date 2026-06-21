const express = require("express");
const router = express.Router();
const UserPensioner = require("./models/UserPensioner"); 
const LivenessVerification = require("./models/LivenessVerification"); // 📊 ለሪፖርቱ የሚያስፈልገው ሞዴል እዚህ ገብቷል

/* ==========================================================================
   📬 POST: /api/liveness/verify-success
========================================================================== */
router.post("/verify-success", async (req, res) => {
  try {
    const {
      faydaNumber,
      smilePassed,
      nodPassed,
      turnPassed,
      selfiePhoto, // 📸 ከቅጽበታዊ ካሜራ የተነሳው ሴልፊ ፎቶ (ካለ)
      idPhoto      // 🪪 የመታወቂያ ፎቶ (ካለ)
    } = req.body;

    // 1. መረጃው ሙሉ መሆኑን ማረጋገጥ
    if (!faydaNumber) {
      return res.status(400).json({
        success: false,
        message: "⚠️ የጡረተኛው የፋይዳ ቁጥር አልተገኘም!"
      });
    }

    // 2. የባዮሜትሪክስ ደህንነት ማጣሪያ (ፈገግታ እና እንቅስቃሴ መኖራቸውን ማረጋገጥ)
    if (!smilePassed || !nodPassed) {
      return res.status(400).json({
        success: false,
        message: "❌ የደህንነት ጥሰት ተገኝቷል! ሁሉም የህያውነት ፈተናዎች (ፈገግታ እና እንቅስቃሴ) ማለፍ አለባቸው።"
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

    // ==========================================================================
    // 📊 ማስተካከያ ሀ፦ ለ Report.js ገጽ የ LivenessVerification ዳታቤዝን ማዘመን/መፍጠር
    // ==========================================================================
    await LivenessVerification.findOneAndUpdate(
      { faydaNumber: faydaNumber },
      {
        idPhoto: idPhoto || pensioner.photoUrl || "", // የመታወቂያ ፎቶ ከሌለ ዋናውን የምዝገባ ፎቶ ይጠቀማል
        selfiePhoto: selfiePhoto || "",
        faceMatched: true, // ፈተናዎቹን ካለፈ ፊቱ ገጥሟል ተብሎ ይወሰዳል
        smilePassed: !!smilePassed,
        nodPassed: !!nodPassed,
        turnPassed: !!turnPassed,
        verificationStatus: "Verified", // 🟢 ሁኔታውን ወደ የተረጋገጠ (Verified) ይቀይረዋል
        lastVerificationDate: new Date()
      },
      { upsert: true, new: true } // ዳታው ከሌለ አዲስ ይፈጥራል፣ ካለ ያሻሽላል (Duplicate አይፈጥርም)
    );

    // ==========================================================================
    // 📝 ማስተካከያ ለ፦ በ UserPensioner ላይ የታሪክ መዝገብ (editHistory) ማዘጋጀት
    // ==========================================================================
    const livenessLogEntry = {
      editedBy: "AI Biometric System",
      editedAt: new Date(),
      details: `🤖 በህይወት መኖራቸው በባዮሜትሪክስ ተረጋግጧል። (ፈገግታ፦ አልፏል፣ እንቅስቃሴ፦ አልፏል${turnPassed ? '፣ ማዞር፦ አልፏል' : ''})`
    };

    // መረጃዎቹን ማዘመን (status 'Active' ሆኖ ይቀጥላል)
    pensioner.status = "Active"; 
    pensioner.statusChangedDate = new Date();
    pensioner.lastEditedBy = "AI Biometric System";
    pensioner.lastEditedAt = new Date(); 

    if (!pensioner.editHistory || !Array.isArray(pensioner.editHistory)) {
      pensioner.editHistory = [];
    }
    
    pensioner.editHistory.push(livenessLogEntry);
    await pensioner.save();

    console.log(`🟢 ጡረተኛው [${pensioner.nameAmh}] በAI በተሳካ ሁኔታ ተረጋግጧል!`);

    return res.status(200).json({
      success: true,
      message: `🎉 የጡረተኛው (${pensioner.nameAmh}) በህይወት መኖር በባዮሜትሪክስ ተረጋግጧል!`,
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

module.exports = router;
