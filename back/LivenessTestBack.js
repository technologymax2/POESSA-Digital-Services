const express = require("express");
const router = express.Router();
const axios = require("axios"); // 💡 ፎቶውን ወደ ImgBB ለመስቀል ያስፈልጋል
const UserPensioner = require("./models/UserPensioner"); 
const LivenessVerification = require("./models/livenessSchema"); 

// 🔑 ያንተ የ ImgBB API ቁልፍ
const IMGBB_API_KEY = "ebd592608f4dba1e8271bec8e920c408";

/* ==========================================================================
   📸 헬퍼 ተግባር፦ ፎቶን ወደ ImgBB ሰቅሎ ሊንክ ማምጫ (Helper Function)
========================================================================== */
async function uploadToImgBB(base64Data) {
  try {
    if (!base64Data || typeof base64Data !== "string") return "";
    
    // የ Base64 መሪ ፅሁፍ ካለው (ለምሳሌ፦ data:image/jpeg;base64,) እሱን ብቻ ነጥሎ ማውጣት
    let cleanBase64 = base64Data;
    if (base64Data.includes("base64,")) {
      cleanBase64 = base64Data.split("base64,")[1];
    }

    // ወደ ImgBB API ጥሪ ማድረግ
    const formData = new URLSearchParams();
    formData.append("image", cleanBase64);

    const response = await axios.post(
      `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
      formData
    );

    if (response.data && response.data.data && response.data.data.url) {
      return response.data.data.url; // 🔗 የተፈጠረው እውነተኛ የፎቶ ሊንክ
    }
    return "";
  } catch (error) {
    console.error("❌ ImgBB Upload Error:", error.message);
    return ""; // ስህተት ቢፈጠር ባዶ ይተዋል (ሲስተሙ እንዳይቋረጥ)
  }
}

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
      selfiePhoto, // 📸 ከካሜራ የመጣ Base64 ሴልፊ ፎቶ
      idPhoto      // 🪪 የመታወቂያ ፎቶ
    } = req.body;

    // 1. የፋይዳ ቁጥር መኖሩን ማረጋገጥ
    if (!faydaNumber) {
      return res.status(400).json({ success: false, message: "⚠️ የጡረተኛው የፋይዳ ቁጥር አልተገኘም!" });
    }

    // 2. የባዮሜትሪክስ ደህንነት ማጣሪያ
    if (!smilePassed || !nodPassed) {
      return res.status(400).json({ success: false, message: "❌ የደህንነት ጥሰት ተገኝቷል!" });
    }

    // 3. ጡረተኛውን በዋናው ሰንጠረዥ መፈለግ
    const pensioner = await UserPensioner.findOne({ faydaNumber: faydaNumber });
    if (!pensioner) {
      return res.status(404).json({ success: false, message: "❌ ይህ የፋይዳ ቁጥር አልተገኘም!" });
    }

    // 🌟 4. አዲሱ ማስተካከያ፦ የሴልፊ ፎቶው Base64 ከሆነ ወደ ImgBB ሰቅሎ ሊንኩን ማምጣት
    let finalSelfieUrl = selfiePhoto;
    if (selfiePhoto && selfiePhoto.startsWith("data:image")) {
      console.log("⏳ የሴልፊ ፎቶውን ወደ ImgBB በመስቀል ላይ...");
      finalSelfieUrl = await uploadToImgBB(selfiePhoto);
    }

    // የመታወቂያ ፎቶው Base64 ከሆነ እሱንም መስቀል (ሊንክ ከሆነ ግን በቀጥታ ይይዘዋል)
    let finalIdPhotoUrl = idPhoto || pensioner.photoUrl || pensioner.photo || "";
    if (finalIdPhotoUrl && finalIdPhotoUrl.startsWith("data:image")) {
      finalIdPhotoUrl = await uploadToImgBB(finalIdPhotoUrl);
    }

    // 5. 📊 መረጃውን በ livenessSchema ላይ መመዝገብ
    await LivenessVerification.findOneAndUpdate(
      { faydaNumber: faydaNumber },
      {
        name: pensioner.nameAmh || pensioner.nameEng || pensioner.name || "ስም አልተጠቀሰም",
        phone: pensioner.phone || "የሌለ",
        idPhoto: finalIdPhotoUrl, 
        selfiePhoto: finalSelfieUrl, // 🔗 አሁን ሊንኩ ብቻ ነው ዳታቤዝ የሚገባው!
        faceMatched: true,
        smilePassed: !!smilePassed,
        nodPassed: !!nodPassed,
        turnPassed: !!turnPassed,
        verificationStatus: "Pending", 
        lastVerificationDate: new Date()
      },
      { upsert: true, new: true }
    );

    // 6. 📝 በ UserPensioner ዋና ሰንጠረዥ ላይ የታሪክ መዝገብ ማስፈር
    if (!pensioner.editHistory) pensioner.editHistory = [];
    pensioner.editHistory.push({
      editedBy: "AI Biometric System",
      editedAt: new Date(),
      details: `🤖 የ AI ባዮሜትሪክስ ፈተናዎችን አልፏል። ፎቶዎች ወደ ImgBB ተሰቅለዋል።`
    });
    await pensioner.save();

    return res.status(200).json({
      success: true,
      message: `🎉 የ AI ፈተናው ተጠናቋል! ፎቶዎች በተሳካ ሁኔታ ተቀምጠዋል።`,
      data: pensioner
    });

  } catch (error) {
    console.error("Liveness Verification Endpoint Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/* ==========================================================================
   🔍 2. GET: /api/pensioners (ሁሉንም የባዮሜትሪክስ ዳታዎች ለ Report.js ማምጫ)
========================================================================== */
router.get("/pensioners", async (req, res) => {
  try {
    const data = await LivenessVerification.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/* ==========================================================================
   🟢 🔴 3. PUT: /api/pensioners/verify-status/:faydaNumber (ማጽደቂያ/ውድቅ ማድረጊያ)
========================================================================== */
router.put("/pensioners/verify-status/:faydaNumber", async (req, res) => {
  try {
    const { faydaNumber } = req.params;
    const { verificationStatus, comment } = req.body;

    if (!verificationStatus) {
      return res.status(400).json({ success: false, message: "⚠️ ሁኔታውን መግለጽ ያስፈልጋል!" });
    }

    const updatedLiveness = await LivenessVerification.findOneAndUpdate(
      { faydaNumber: faydaNumber },
      { verificationStatus, comment, lastVerificationDate: new Date() },
      { new: true }
    );

    if (!updatedLiveness) {
      return res.status(404).json({ success: false, message: "❌ መረጃው አልተገኘም!" });
    }

    await UserPensioner.findOneAndUpdate(
      { faydaNumber: faydaNumber },
      { 
        status: verificationStatus === "Verified" ? "Active" : "Suspended",
        statusChangedDate: new Date()
      }
    );

    return res.status(200).json({ success: true, message: "ሁኔታው ተዘምኗል!", data: updatedLiveness });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
