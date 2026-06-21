const express = require("express");
const router = express.Router();
const UserPensioner = require("./models/UserPensioner"); 
const LivenessVerification = require("./models/livenessSchema"); // 💡 በ GitHubህ ላይ ያለው ትክክለኛ ስም

// 🔍 1. GET: /api/pensioners (ሁሉንም የባዮሜትሪክስ ዳታዎች ለ Report.js ማምጫ)
router.get("/pensioners", async (req, res) => {
  try {
    const data = await LivenessVerification.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 🟢 🔴 2. PUT: /api/pensioners/verify-status/:faydaNumber (የባለሙያ ማጽደቂያ/ውድቅ ማድረጊያ)
router.put("/pensioners/verify-status/:faydaNumber", async (req, res) => {
  try {
    const { faydaNumber } = req.params;
    const { verificationStatus, comment } = req.body;

    if (!verificationStatus) {
      return res.status(400).json({ success: false, message: "⚠️ ሁኔታውን መግለጽ ያስፈልጋል!" });
    }

    // የ livenessverifications ስብስብን ማዘመን
    const updatedLiveness = await LivenessVerification.findOneAndUpdate(
      { faydaNumber: faydaNumber },
      { verificationStatus, comment, lastVerificationDate: new Date() },
      { new: true }
    );

    if (!updatedLiveness) {
      return res.status(404).json({ success: false, message: "❌ የጡረተኛው የባዮሜትሪክስ መረጃ አልተገኘም!" });
    }

    // በዋናው የጡረተኛ ሰንጠረዥ ላይ ሁኔታውን ማመሳሰል (Active ወይም Suspended)
    await UserPensioner.findOneAndUpdate(
      { faydaNumber: faydaNumber },
      { 
        status: verificationStatus === "Verified" ? "Active" : "Suspended",
        statusChangedDate: new Date()
      }
    );

    return res.status(200).json({ success: true, message: "ሁኔታው በተሳካ ሁኔታ ተዘምኗል!", data: updatedLiveness });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
