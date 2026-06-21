const express = require("express");
const router = express.Router();
const axios = require("axios"); 
const UserPensioner = require("./models/UserPensioner"); 
const LivenessVerification = require("./models/livenessSchema"); 

const IMGBB_API_KEY = "ebd592608f4dba1e8271bec8e920c408";

// 📸 ፎቶን ወደ ImgBB ሰቅሎ ሊንክ ማምጫ ሄልፐር
async function uploadToImgBB(base64Data) {
  try {
    if (!base64Data || typeof base64Data !== "string") return "";
    
    let cleanBase64 = base64Data;
    if (base64Data.includes("base64,")) {
      cleanBase64 = base64Data.split("base64,")[1];
    }

    const formData = new URLSearchParams();
    formData.append("image", cleanBase64);

    const response = await axios.post(
      `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
      formData
    );

    if (response.data && response.data.data && response.data.data.url) {
      return response.data.data.url; 
    }
    return "";
  } catch (error) {
    console.error("❌ ImgBB Upload Error:", error.message);
    return ""; 
  }
}

/* ==========================================================================
   📬 1. POST: /verify-success (የ AI ፈተና ሲያልፍ መደበኛውን ምስል ማስቀመጫ)
========================================================================== */
router.post("/verify-success", async (req, res) => {
  try {
    const {
      faydaNumber,
      smilePassed,
      nodPassed,
      turnPassed,
      selfiePhotoUrl,  // 🌟 ከፍሮንትኤንድ የመጣው መደበኛ ንጹህ ሴልፊ (ሊንክ ወይም Base64)
      idPhotoUrl,      // 🌟 የመታወቂያ ፎቶ ሊንክ
      matchPercentage  // 📊 የፊት መመሳሰል መጠን ቁጥር
    } = req.body;

    if (!faydaNumber) {
      return res.status(400).json({ success: false, message: "⚠️ የጡረተኛው የፋይዳ ቁጥር አልተገኘም!" });
    }

    const pensioner = await UserPensioner.findOne({ faydaNumber: faydaNumber });
    if (!pensioner) {
      return res.status(404).json({ success: false, message: "❌ ይህ የፋይዳ ቁጥር አልተገኘም!" });
    }

    // 🌟 መደበኛው ሴልፊ ፎቶ አሁንም Base64 ከሆነ ወደ ImgBB ይሰቀላል (ሊንክ ከሆነ ግን በቀጥታ ይይዘዋል)
    let finalSelfieUrl = selfiePhotoUrl;
    if (selfiePhotoUrl && selfiePhotoUrl.startsWith("data:image")) {
      console.log("⏳ መደበኛውን ሴልፊ ፎቶ ወደ ImgBB በመስቀል ላይ...");
      finalSelfieUrl = await uploadToImgBB(selfiePhotoUrl);
    }

    let finalIdPhotoUrl = idPhotoUrl || pensioner.photoUrl || pensioner.photo || "";
    if (finalIdPhotoUrl && finalIdPhotoUrl.startsWith("data:image")) {
      finalIdPhotoUrl = await uploadToImgBB(finalIdPhotoUrl);
    }

    // 5. 📊 መረጃውን በ livenessSchema (ሪፖርት ገፅ የሚነበበው ሰንጠረዥ) ላይ መመዝገብ
    await LivenessVerification.findOneAndUpdate(
      { faydaNumber: faydaNumber },
      {
        name: pensioner.nameAmh || pensioner.nameEng || pensioner.name || "ስም አልተጠቀሰም",
        phone: pensioner.phone || "የሌለ",
        idPhotoUrl: finalIdPhotoUrl,     // 🌟 ከ Schemaው ስም ጋር ተገጥሟል
        selfiePhotoUrl: finalSelfieUrl, // 🌟 መደበኛው ንጹህ ሴልፊ ሊንክ እዚህ ይቀመጣል!
        faceMatched: true,
        matchPercentage: Number(matchPercentage) || 0,
        smilePassed: !!smilePassed,
        nodPassed: !!nodPassed,
        turnPassed: !!turnPassed,
        verificationStatus: "Pending", 
        lastVerificationDate: new Date()
      },
      { upsert: true, new: true }
    );

    if (!pensioner.editHistory) pensioner.editHistory = [];
    pensioner.editHistory.push({
      editedBy: "AI Biometric System",
      editedAt: new Date(),
      details: `🤖 ባዮሜትሪክስ ተረጋግጧል። መደበኛ ሴልፊ እና ID ወደ ሪፖርት ተልኳል።`
    });
    await pensioner.save();

    return res.status(200).json({
      success: true,
      message: `🎉 የ AI ፈተናው ተጠናቋል! መደበኛው ሴልፊ እና መታወቂያ በትክክል ተቀምጠዋል።`,
      data: pensioner
    });

  } catch (error) {
    console.error("Liveness Verification Endpoint Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/* ==========================================================================
   🔍 2. GET: /pensioners (ሁሉንም የባዮሜትሪክስ ዳታዎች ለ Report.js ማምጫ)
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
   🟢 🔴 3. PUT: /pensioners/verify-status/:faydaNumber (ማጽደቂያ/ውድቅ ማድረጊያ)
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
