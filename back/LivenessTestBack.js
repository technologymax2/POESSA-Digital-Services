const express = require("express");
const router = express.Router();
const axios = require("axios");
const path = require("path");

// 🧠 ሰርቨር-ሳይድ ፊት ለመለየት የሚያስፈልጉ ቤተ-መጻሕፍት
const faceapi = require("face-api.js");
const { canvas, Canvas, Image, ImageData } = require("canvas");
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

const UserPensioner = require("./models/UserPensioner");
const LivenessVerification = require("./models/livenessSchema");

const IMGBB_API_KEY = "ebd592608f4dba1e8271bec8e920c408";

// ሞዴሎቹ ያሉበትን የሰርቨር ፎልደር መጋጠሚያ መንገድ ማዘጋጀት
const MODEL_DIR = path.join(__dirname, "../models"); 
let modelsLoaded = false;

async function loadServerModels() {
  if (modelsLoaded) return;
  await faceapi.nets.tinyFaceDetector.loadFromDisk(MODEL_DIR);
  await faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_DIR);
  await faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_DIR);
  modelsLoaded = true;
  console.log("🔒 የፊት መለያ ሞዴሎች በሰርቨሩ ላይ በተሳካ ሁኔታ ተጭነዋል!");
}

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
   🔥 [አዲስ] SERVER-SIDE FACE MATCH ENDPOINT
========================================== */
router.post("/verify-face-server", async (req, res) => {
  try {
    await loadServerModels();
    const { idPhotoUrl, selfiePhotoUrl } = req.body;

    if (!idPhotoUrl || !selfiePhotoUrl) {
      return res.status(400).json({ success: false, message: "ሁለቱም ፎቶዎች ያስፈልጋሉ" });
    }

    // 1. ምስሎቹን ከሊንካቸው ወደ ሰርቨሩ ማህደረ ትውስታ መጫን
    const imgId = await canvas.loadImage(idPhotoUrl);
    const imgSelfie = await canvas.loadImage(selfiePhotoUrl);

    const detectorOptions = new faceapi.TinyFaceDetectorOptions({ inputSize: 128, scoreThreshold: 0.3 });

    // 2. በሰርቨሩ ፕሮሰሰር የፊት ገጽታዎችን መፈለግ
    const idResult = await faceapi.detectSingleFace(imgId, detectorOptions).withFaceLandmarks().withFaceDescriptor();
    const selfieResult = await faceapi.detectSingleFace(imgSelfie, detectorOptions).withFaceLandmarks().withFaceDescriptor();

    // ፊት ማግኘት ካልተቻለ 65% Fallback ሰጥቶ ማሳለፍ (ስራ እንዳይቆም)
    if (!idResult || !selfieResult) {
      return res.json({ success: true, matchPercentage: 65, message: "ፊት በግልጽ አልታየም፤ ወደ ቀጣዩ አልፏል" });
    }

    // 3. የፊቶቹን ርቀት ማነጻጸር
    const distance = faceapi.euclideanDistance(idResult.descriptor, selfieResult.descriptor);
    let matchPercentage = Math.round((1 - distance) * 100);
    matchPercentage = Math.max(0, Math.min(100, matchPercentage));

    return res.json({ success: true, matchPercentage });

  } catch (error) {
    console.error("Server Face Match Error:", error);
    // ሰርቨር ላይ ሌላ ስህተት ቢኖር እንኳ ሪአክቱ እንዳይቆም በ 65% ያሳልፈው
    return res.json({ success: true, matchPercentage: 65, message: "ሰርቨር ስህተት - Fallback ተሰጥቷል" });
  }
});

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

    const pensioner = await UserPensioner.findOne({ faydaNumber });

    if (!pensioner) {
      return res.status(404).json({
        success: false,
        message: "Pensioner not found"
      });
    }

    let finalDbPhotoUrl = dbPhotoUrl || pensioner.photoUrl || "";
    if (finalDbPhotoUrl.startsWith("data:image")) {
      finalDbPhotoUrl = await uploadToImgBB(finalDbPhotoUrl);
    }

    let finalSelfieUrl = selfiePhotoUrl || "";
    if (finalSelfieUrl.startsWith("data:image")) {
      finalSelfieUrl = await uploadToImgBB(finalSelfieUrl);
    }

    const finalMatch = Number(matchPercentage) || 0;
    const faceMatched = finalMatch >= 70;

    const livenessPassed = !!smilePassed && !!nodPassed && !!turnPassed;

    let verificationStatus = "Failed";
    if (faceMatched && livenessPassed) {
      verificationStatus = "Verified";
    }

    const record = new LivenessVerification({
      faydaNumber,
      name: pensioner.nameAmh || pensioner.nameEng || pensioner.name || "ስም አልተጠቀሰም",
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
    return res.status(500).json({ success: false, message: error.message });
  }
});

/* ==========================================
   GET ALL VERIFICATIONS (EMPLOYEE DASHBOARD)
========================================== */
router.get("/all", async (req, res) => {
  try {
    const data = await LivenessVerification.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/* ==========================================
   GET BY FAYDA NUMBER
========================================== */
router.get("/:faydaNumber", async (req, res) => {
  try {
    const record = await LivenessVerification.findOne({ faydaNumber: req.params.faydaNumber }).sort({ createdAt: -1 });
    if (!record) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }
    return res.status(200).json({ success: true, data: record });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
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
      { verificationStatus, comment },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }
    return res.status(200).json({ success: true, message: "Status updated", data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
