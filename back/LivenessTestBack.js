const express = require("express");
const router = express.Router();
const axios = require("axios");

const UserPensioner = require("./models/UserPensioner");
const LivenessVerification = require("./models/LivenessVerification");

const IMGBB_API_KEY = "ebd592608f4dba1e8271bec8e920c408";

/* ==========================================
   ImgBB Upload Helper
========================================== */
async function uploadToImgBB(base64Data) {
  try {
    if (!base64Data || typeof base64Data !== "string") {
      return "";
    }

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

    return response.data?.data?.url || "";
  } catch (error) {
    console.error("ImgBB Upload Error:", error.message);
    return "";
  }
}

/* ==========================================
   POST /verify-success (MAIN FIXED API)
========================================== */
router.post("/verify-success", async (req, res) => {
  try {
    const {
      faydaNumber,
      dbPhotoUrl,
      selfiePhotoUrl,
      faceMatched,
      matchPercentage,
      smilePassed,
      nodPassed,
      turnPassed
    } = req.body;

    if (!faydaNumber) {
      return res.status(400).json({
        success: false,
        message: "Fayda number is required"
      });
    }

    const pensioner = await UserPensioner.findOne({ faydaNumber });

    if (!pensioner) {
      return res.status(404).json({
        success: false,
        message: "Pensioner not found"
      });
    }

    /* =========================
       DB PHOTO (safe fallback)
    ========================= */
    let finalDbPhotoUrl =
      pensioner.photoUrl || "";

    if (finalDbPhotoUrl.startsWith("data:image")) {
      finalDbPhotoUrl = await uploadToImgBB(finalDbPhotoUrl);
    }

    /* =========================
       SELFIE UPLOAD
    ========================= */
    let finalSelfieUrl = selfiePhotoUrl || "";

    if (finalSelfieUrl.startsWith("data:image")) {
      finalSelfieUrl = await uploadToImgBB(finalSelfieUrl);
    }

    /* =========================
       SAFE FACE MATCH LOGIC (FIXED)
    ========================= */
    const finalMatchPercentage = Number(matchPercentage) || 0;
    const isFaceMatched = finalMatchPercentage >= 50;

    /* =========================
       SAVE VERIFICATION
    ========================= */
    const verification = new LivenessVerification({
      faydaNumber,

      name:
        pensioner.nameAmh ||
        pensioner.nameEng ||
        pensioner.name ||
        "ስም አልተጠቀሰም",

      dbPhotoUrl: finalDbPhotoUrl,
      selfiePhotoUrl: finalSelfieUrl,

      faceMatched: isFaceMatched,
      matchPercentage: finalMatchPercentage,

      smilePassed: !!smilePassed,
      nodPassed: !!nodPassed,
      turnPassed: !!turnPassed,

      verificationStatus: isFaceMatched ? "Verified" : "Failed"
    });

    await verification.save();

    return res.status(200).json({
      success: true,
      message: "Verification saved successfully",
      data: verification
    });

  } catch (error) {
    console.error("Verify Success Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});
