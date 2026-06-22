const express = require("express");
const router = express.Router();
const axios = require("axios");

const UserPensioner = require("./models/UserPensioner");
const LivenessVerification = require("./models/LivenessVerification");

const IMGBB_API_KEY = "ebd592608f4dba1e8271bec8e920c408";

/* ==========================================
   IMAGE UPLOAD HELPER (IMGBB)
========================================== */
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

    return response.data?.data?.url || "";
  } catch (err) {
    console.error("ImgBB Upload Error:", err.message);
    return "";
  }
}

/* ==========================================
   MAIN VERIFY (ID + SELFIE + LIVENESS FINAL SAVE)
========================================== */
router.post("/verify-success", async (req, res) => {
  try {
    const {
      faydaNumber,
      dbPhotoUrl,
      selfiePhotoUrl,
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

    /* =========================
       FIND PENSIONER
    ========================= */
    const pensioner = await UserPensioner.findOne({
      faydaNumber
    });

    if (!pensioner) {
      return res.status(404).json({
        success: false,
        message: "Pensioner not found"
      });
    }

    /* =========================
       DB PHOTO CLEAN
    ========================= */
    let finalDbPhotoUrl =
      dbPhotoUrl || pensioner.photoUrl || "";

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
       FACE MATCH LOGIC (SERVER SIDE CONTROL)
    ========================= */
    const finalMatch = Number(matchPercentage) || 0;
    const faceMatched = finalMatch >= 50;

    /* =========================
       LIVENESS VALIDATION
    ========================= */
    const livenessPassed =
      !!smilePassed && !!nodPassed && !!turnPassed;

    /* =========================
       FINAL STATUS
    ========================= */
    let verificationStatus = "Failed";

    if (faceMatched && livenessPassed) {
      verificationStatus = "Verified";
    }

    /* =========================
       SAVE TO DB
    ========================= */
    const record = new LivenessVerification({
      faydaNumber,

      name:
        pensioner.nameAmh ||
        pensioner.nameEng ||
        pensioner.name ||
        "ስም አልተጠቀሰም",

      dbPhotoUrl: finalDbPhotoUrl,
      selfiePhotoUrl: finalSelfieUrl,

      matchPercentage: finalMatch,
      faceMatched,

      smilePassed: !!smilePassed,
      nodPassed: !!nodPassed,
      turnPassed: !!turnPassed,

      verificationStatus
    });

    await record.save();

    return res.status(200).json({
      success: true,
      message: "Liveness verification completed",
      data: record
    });

  } catch (error) {
    console.error("Liveness Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/* ==========================================
   GET ALL VERIFICATIONS (EMPLOYEE DASHBOARD)
========================================== */
router.get("/all", async (req, res) => {
  try {
    const data = await LivenessVerification
      .find()
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/* ==========================================
   GET BY FAYDA NUMBER
========================================== */
router.get("/:faydaNumber", async (req, res) => {
  try {
    const record = await LivenessVerification
      .findOne({ faydaNumber: req.params.faydaNumber })
      .sort({ createdAt: -1 });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Record not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: record
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/* ==========================================
   EMPLOYEE APPROVAL / REJECTION
========================================== */
router.put("/status/:id", async (req, res) => {
  try {
    const { verificationStatus, comment } = req.body;

    const updated = await LivenessVerification.findByIdAndUpdate(
      req.params.id,
      {
        verificationStatus,
        comment
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Record not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Status updated",
      data: updated
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
