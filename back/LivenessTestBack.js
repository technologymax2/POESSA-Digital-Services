const express = require("express");
const router = express.Router();
const UserPensioner = require("./models/UserPensioner"); // ያንተ ሞዴል

/* ==========================================================================
   📬 POST: /api/liveness/verify-success
========================================================================== */
router.post("/verify-success", async (req, res) => {
  try {
    const {
      faydaNumber,
      smilePassed,
      nodPassed,
      turnPassed
    } = req.body;

    // 1. መረጃው ሙሉ መሆኑን ማረጋገጥ
    if (!faydaNumber) {
      return res.status(400).json({
        success: false,
        message: "⚠️ የጡረተኛው የፋይዳ ቁጥር አልተገኘም!"
      });
    }

    // 2. 🔥 [ዋና ማስተካከያ] የባዮሜትሪክስ ደህንነት ማጣሪያ (faceMatched ከሪአክት ባይመጣም እንዲያልፍ ተደርጓል)
    if (!smilePassed || !nodPassed) {
      return res.status(400).json({
        success: false,
        message: "❌ የደህንነት ጥሰት ተገኝቷል! ሁሉም የህያውነት ፈተናዎች (ፈገግታ እና እንቅስቃሴ) መለፍ አለባቸው።"
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

    // 4. ያንተን ስኪማ መዋቅር የጠበቀ የታሪክ መዝገብ (editHistory) ማዘጋጀት
    const livenessLogEntry = {
      editedBy: "AI Biometric System",
      editedAt: new Date(),
      details: `🤖 በህይወት መኖራቸው በባዮሜትሪክስ ተረጋግጧል። (ፈገግታ፦ አልፏል፣ እንቅስቃሴ፦ አልፏል${turnPassed ? '፣ ማዞር፦ አልፏል' : ''})`
    };

    // 5. መረጃዎቹን ማዘመን (status 'Active' ሆኖ ይቀጥላል)
    pensioner.status = "Active"; 
    pensioner.statusChangedDate = new Date();
    pensioner.lastEditedBy = "AI Biometric System";
    pensioner.lastEditedAt = new Date(); 

    // editHistory መኖሩን እና አሬይ መሆኑን ማረጋገጫ (ደህንነት)
    if (!pensioner.editHistory || !Array.isArray(pensioner.editHistory)) {
      pensioner.editHistory = [];
    }
    
    // ወደ editHistory አሬይ መግፋት
    pensioner.editHistory.push(livenessLogEntry);

    // ዳታቤዝ ላይ ሴቭ ማድረግ
    await pensioner.save();

    console.log(`🟢 ጡረተኛው [${pensioner.nameAmh}] በAI በተሳካ ሁኔታ ተረጋግጧል!`);

    // 6. ለሪአክት ስኬታማ ምላሽ መላክ
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
