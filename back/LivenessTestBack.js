const express = require("express");
const router = express.Router();
const axios = require("axios");
const path = require("path");

const faceapi = require("face-api.js");
const { canvas, Canvas, Image, ImageData } = require("canvas");
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

const UserPensioner = require("./models/UserPensioner");
const LivenessVerification = require("./models/livenessSchema");

const IMGBB_API_KEY = "ebd592608f4dba1e8271bec8e920c408";

// 🎯 ማስተካከያ 1፦ የሞዴል ፋይሎቹ ካሉበት ከዋናው ማውጫ (Root) ጋር በትክክል ማገናኘት
const MODEL_DIR = path.join(__dirname, "../models"); 
let modelsLoaded = false;

async function loadServerModels() {
  if (modelsLoaded) return;
  try {
    // 🎯 በዲስክህ ላይ ያሉትን የነባሮቹን TinyFaceDetector ፋይሎች እንጠቀማለን
    await faceapi.nets.tinyFaceDetector.loadFromDisk(MODEL_DIR);
    await faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_DIR);
    await faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_DIR);
    modelsLoaded = true;
    console.log("🔒 [SUCCESS] የፊት መለያ ሞዴሎች በባክኤንድ ሰርቨሩ ላይ በተሳካ ሁኔታ ተጭነዋል!");
  } catch (err) {
    console.error("❌ [ERROR] ሞዴሎችን ከዲስክ ላይ መጫን አልተቻለም፦", err.message);
    throw err;
  }
}

async function uploadToImgBB(base64Data) {
  try {
    if (!base64Data || typeof base64Data !== "string") return "";
    let cleanBase64 = base64Data.includes("base64,") ? base64Data.split("base64,")[1] : base64Data;
    const formData = new URLSearchParams();
    formData.append("image", cleanBase64);
    const response = await axios.post(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, formData);
    return response.data?.data?.url || "";
  } catch (err) {
    console.error("ImgBB Upload Error:", err.message);
    return "";
  }
}

/* ==========================================
   🎯 ዋናው እና ብቸኛው የፊስ ማነጻጸሪያና ሴቭ ማድረጊያ መስመር
========================================== */
router.post("/verify-success", async (req, res) => {
  try {
    const {
      faydaNumber,
      selfiePhotoUrl,
      smilePassed,
      nodPassed,
      turnPassed,
    } = req.body;

    if (!faydaNumber) {
      return res.status(400).json({
        success: false,
        message: "Fayda number is required",
      });
    }

    /*
     * =========================
     * FIND PENSIONER
     * =========================
     */
    const pensioner =
      await UserPensioner.findOne({
        faydaNumber: String(
          faydaNumber
        ).trim(),
      });

    if (!pensioner) {
      return res.status(404).json({
        success: false,
        message: "Pensioner not found",
      });
    }

    /*
     * =========================
     * SYSTEM PHOTO
     * =========================
     *
     * IMPORTANT:
     * This is the REAL registered
     * pensioner photo from DB.
     */
    let finalDbPhotoUrl =
      pensioner.photoUrl || "";

    if (!finalDbPhotoUrl) {
      return res.status(400).json({
        success: false,
        message:
          "System photo is missing in database",
      });
    }

    /*
     * =========================
     * SELFIE
     * =========================
     */
    let finalSelfieUrl =
      selfiePhotoUrl || "";

    if (!finalSelfieUrl) {
      return res.status(400).json({
        success: false,
        message: "Selfie photo is required",
      });
    }

    /*
     * =========================
     * UPLOAD BASE64 SELFIE
     * =========================
     */
    if (
      typeof finalSelfieUrl === "string" &&
      finalSelfieUrl.startsWith("data:image")
    ) {
      finalSelfieUrl =
        await uploadToImgBB(
          finalSelfieUrl
        );
    }

    if (!finalSelfieUrl) {
      return res.status(400).json({
        success: false,
        message:
          "Unable to store selfie image",
      });
    }

    /*
     * =========================
     * FACE MATCH
     * =========================
     */
    let finalMatch = 0;

    try {
      await loadServerModels();

      console.log(
        "========================================"
      );

      console.log(
        "🔍 FACE MATCH STARTED"
      );

      console.log(
        "System Photo:",
        finalDbPhotoUrl
      );

      console.log(
        "Selfie:",
        finalSelfieUrl
      );

      /*
       * Download both images
       */
      const [
        idResponse,
        selfieResponse,
      ] = await Promise.all([
        axios.get(
          finalDbPhotoUrl,
          {
            responseType:
              "arraybuffer",
            timeout: 20000,
          }
        ),

        axios.get(
          finalSelfieUrl,
          {
            responseType:
              "arraybuffer",
            timeout: 20000,
          }
        ),
      ]);

      /*
       * Load images
       */
      const imgId =
        await canvas.loadImage(
          Buffer.from(
            idResponse.data
          )
        );

      const imgSelfie =
        await canvas.loadImage(
          Buffer.from(
            selfieResponse.data
          )
        );

      /*
       * Face detector
       */
      const detectorOptions =
        new faceapi.TinyFaceDetectorOptions({
          inputSize: 224,
          scoreThreshold: 0.15,
        });

      /*
       * Detect DB face
       */
      const idResult =
        await faceapi
          .detectSingleFace(
            imgId,
            detectorOptions
          )
          .withFaceLandmarks()
          .withFaceDescriptor();

      /*
       * Detect selfie face
       */
      const selfieResult =
        await faceapi
          .detectSingleFace(
            imgSelfie,
            detectorOptions
          )
          .withFaceLandmarks()
          .withFaceDescriptor();

      if (!idResult) {
        console.warn(
          "⚠️ Face not detected in DB photo"
        );
      }

      if (!selfieResult) {
        console.warn(
          "⚠️ Face not detected in selfie"
        );
      }

      /*
       * =========================
       * COMPARE
       * =========================
       */
      if (
        idResult &&
        selfieResult
      ) {
        const distance =
          faceapi.euclideanDistance(
            idResult.descriptor,
            selfieResult.descriptor
          );

        /*
         * Convert distance to percentage.
         *
         * Lower distance = better match.
         */
        finalMatch = Math.round(
          Math.max(
            0,
            Math.min(
              100,
              (1 - distance) * 100
            )
          )
        );

        console.log(
          `📊 Face Match: ${finalMatch}%`
        );
        console.log(
          `📏 Distance: ${distance}`
        );
      } else {
        finalMatch = 0;
      }
    } catch (faceError) {
      console.error(
        "❌ Face Match Error:",
        faceError
      );

      finalMatch = 0;
    }

    /*
     * =========================
     * LIVENESS
     * =========================
     */
    const smile =
      !!smilePassed;

    const nod =
      !!nodPassed;

    const turn =
      !!turnPassed;

    const livenessPassed =
      smile &&
      nod &&
      turn;

    /*
     * =========================
     * FACE MATCH THRESHOLD
     * =========================
     */
    const faceMatched =
      finalMatch >= 70;

    /*
     * =========================
     * FINAL STATUS
     * =========================
     */
    let verificationStatus =
      "Failed";

    if (
      faceMatched &&
      livenessPassed
    ) {
      verificationStatus =
        "Verified";
    }

    /*
     * =========================
     * SAVE RESULT
     * =========================
     */
    const record =
      new LivenessVerification({
        faydaNumber:
          String(faydaNumber).trim(),

        name:
          pensioner.nameAmh ||
          pensioner.nameEng ||
          pensioner.name ||
          "ስም አልተጠቀሰም",

        /*
         * REAL DB SYSTEM PHOTO
         */
        dbPhotoUrl:
          finalDbPhotoUrl,

        /*
         * SELFIE URL
         */
        selfiePhotoUrl:
          finalSelfieUrl,

        matchPercentage:
          finalMatch,

        faceMatched,

        smilePassed:
          smile,

        nodPassed:
          nod,

        turnPassed:
          turn,

        verificationStatus,
      });

    await record.save();

    console.log(
      "========================================"
    );

    console.log(
      "✅ VERIFICATION COMPLETED"
    );

    console.log(
      "Status:",
      verificationStatus
    );

    console.log(
      "Face Match:",
      `${finalMatch}%`
    );

    console.log(
      "Liveness:",
      livenessPassed
    );

    console.log(
      "========================================"
    );

    return res.status(200).json({
      success: true,

      message:
        "Liveness and face verification completed",

      data: record,
    });
  } catch (error) {
    console.error(
      "Liveness Global Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Internal server error",
    });
  }
});

// የሪፖርት ማውጫ መስመሮች (Get/Put Methods) እንዳሉ ይቀጥላሉ...
router.get("/all", async (req, res) => {
  try {
    const data = await LivenessVerification.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/:faydaNumber", async (req, res) => {
  try {
    const record = await LivenessVerification.findOne({ faydaNumber: req.params.faydaNumber }).sort({ createdAt: -1 });
    if (!record) return res.status(404).json({ success: false, message: "Record not found" });
    return res.status(200).json({ success: true, data: record });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.put("/status/:id", async (req, res) => {
  try {
    const { verificationStatus, comment } = req.body;
    const updated = await LivenessVerification.findByIdAndUpdate(req.params.id, { verificationStatus, comment }, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: "Record not found" });
    return res.status(200).json({ success: true, message: "Status updated", data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
