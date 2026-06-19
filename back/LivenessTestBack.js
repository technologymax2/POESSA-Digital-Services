const express = require("express");
const router = express.Router();
// 🟢 ያንተን ኦሪጅናል የጡረተኛ ሞዴል በትክክል መጥራት
const UserPensioner = require("./models/UserPensioner"); 

/* ==========================================================================
   1️⃣ POST: /api/liveness/verify-success
   (በህያውነት ፈተና ያለፈውን ጡረተኛ ዳታቤዝ ላይ "Verified" ማድረጊያ)
========================================================================== */
router.post("/verify-success", async (req, res) => {
  try {
    const {
      faydaNumber,
      faceMatched,
      smilePassed,
      nodPassed,
      turnPassed,
      verificationStatus // ከሪአክት "Verified" ተብሎ የሚመጣው
    } = req.body;

    // 1. የፋይዳ ቁጥር መኖሩን ማረጋገጥ
    if (!faydaNumber) {
      return res.status(400).json({
        success: false,
        message: "⚠️ የጡረተኛው የፋይዳ ቁጥር አልተገኘም!"
      });
    }

    // 2. የደህንነት ማጣሪያ (Security Guard)
    if (!faceMatched || !smilePassed || !nodPassed) {
      return res.status(400).json({
        success: false,
        message: "❌ የደህንነት ጥሰት ተገኝቷል! ሁሉም የባዮሜትሪክስና የህያውነት ፈተናዎች መለፍ አለባቸው።"
      });
    }

    // 3. ያንተን UserPensioner ዳታቤዝ መፈለግ
    const pensioner = await UserPensioner.findOne({ faydaNumber: faydaNumber });
    if (!pensioner) {
      return res.status(404).json({
        success: false,
        message: "❌ ይህ የፋይዳ ቁጥር በሲስተሙ ላይ አልተመዘገበም!"
      });
    }

    // 4. በታሪክ መዝገብ (editHistory) ውስጥ አዲስ የማረጋገጫ ሎግ ማዘጋጀት
    const livenessLogEntry = {
      editedBy: "AI Biometric System",
      editedAt: new Date(),
      details: `🤖 የዲጂታል ህያውነት ማረጋገጫ ተከናውኗል (ፈገግታ፡ ${smilePassed}፣ እንቅስቃሴ፡ ${nodPassed})።`
    };

    // 5. ያንተን የዳታቤዝ ፊልዶች ማዘመን
    pensioner.status = "Verified"; // የህይወት ሁኔታውን "Verified" ማድረግ
    pensioner.statusChangedDate = new Date();
    pensioner.lastEditedBy = "AI Biometric System";
    pensioner.lastEditedAt = new Date();

    // በስኪማህ ላይ ያለው editHistory አሬይ (Array) ከሆነ አዲሱን ታሪክ መግፋት (push)
    if (Array.isArray(pensioner.editHistory)) {
      pensioner.editHistory.push(livenessLogEntry);
    } else {
      pensioner.editHistory = [livenessLogEntry];
    }

    // ለውጦቹን በዳታቤዝ ውስጥ ማዳን
    await pensioner.save();

    console.log(`🟢 ጡረተኛው [${pensioner.nameAmh || pensioner.nameEng}] በAI በተሳካ ሁኔታ ተረጋግጧል!`);

    // 6. ለሪአክት ስኬታማ ምላሽ መላክ (የጡረተኛውን ዳታ ጨምሮ)
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
