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
   POST /verify-success
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

    const pensioner = await UserPensioner.findOne({
      faydaNumber
    });

    if (!pensioner) {
      return res.status(404).json({
        success: false,
        message: "Pensioner not found"
      });
    }

    /* DB Photo */
    let finalDbPhotoUrl =
      dbPhotoUrl ||
      pensioner.photoUrl ||
      pensioner.photo ||
      "";

    if (
      finalDbPhotoUrl &&
      finalDbPhotoUrl.startsWith("data:image")
    ) {
      finalDbPhotoUrl = await uploadToImgBB(finalDbPhotoUrl);
    }

    /* Selfie */
    let finalSelfieUrl = selfiePhotoUrl || "";

    if (
      finalSelfieUrl &&
      finalSelfieUrl.startsWith("data:image")
    ) {
      finalSelfieUrl = await uploadToImgBB(finalSelfieUrl);
    }

    /* Save verification */
    const verification = new LivenessVerification({
      faydaNumber,

      name:
        pensioner.nameAmh ||
        pensioner.nameEng ||
        pensioner.name ||
        "ስም አልተጠቀሰም",

      dbPhotoUrl: finalDbPhotoUrl,
      selfiePhotoUrl: finalSelfieUrl,

      faceMatched: !!faceMatched,

      matchPercentage:
        Number(matchPercentage) || 0,

      smilePassed: !!smilePassed,
      nodPassed: !!nodPassed,
      turnPassed: !!turnPassed,

      verificationStatus: "Pending",

      verifiedAt: new Date()
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


/* ==========================================
   GET /pensioners
========================================== */
router.get("/pensioners", async (req, res) => {
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
   GET /pensioners/:faydaNumber
========================================== */
router.get("/pensioners/:faydaNumber", async (req, res) => {
  try {

    const record =
      await LivenessVerification.findOne({
        faydaNumber: req.params.faydaNumber
      }).sort({ createdAt: -1 });

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
   PUT /pensioners/verify-status/:id
========================================== */
router.put(
  "/pensioners/verify-status/:id",
  async (req, res) => {
    try {

      const {
        verificationStatus,
        comment
      } = req.body;

      const updated =
        await LivenessVerification.findByIdAndUpdate(
          req.params.id,
          {
            verificationStatus,
            comment
          },
          {
            new: true
          }
        );

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: "Record not found"
        });
      }

      await UserPensioner.findOneAndUpdate(
        {
          faydaNumber: updated.faydaNumber
        },
        {
          status:
            verificationStatus === "Verified"
              ? "Active"
              : "Suspended"
        }
      );

      return res.status(200).json({
        success: true,
        message: "Status updated successfully",
        data: updated
      });

    } catch (error) {

      return res.status(500).json({
        success: false,
        message: error.message
      });

    }
  }
);

module.exports = router;
