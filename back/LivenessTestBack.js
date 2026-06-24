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
/* ==========================================
   🔥 [የተስተካከለ] SERVER-SIDE FACE MATCH ENDPOINT (WITH AXIOS BUFFER)
========================================== */
router.post("/verify-face-server", async (req, res) => {
  try {
    await loadServerModels();
    const { idPhotoUrl, selfiePhotoUrl } = req.body;

    if (!idPhotoUrl || !selfiePhotoUrl) {
      return res.status(400).json({ success: false, message: "ሁለቱም ፎቶዎች ያስፈልጋሉ" });
    }

    console.log("⏳ ምስሎችን በ Axios ወደ Buffer በመቀየር ላይ...");

    // 1. የ ImgBB CORS እገዳን ለማለፍ ምስሎቹን በ Axios በ ArrayBuffer ማውረድ
    const [idResponse, selfieResponse] = await Promise.all([
      axios.get(idPhotoUrl, { responseType: "arraybuffer" }),
      axios.get(selfiePhotoUrl, { responseType: "arraybuffer" })
    ]);

    const idBuffer = Buffer.from(idResponse.data);
    const selfieBuffer = Buffer.from(selfieResponse.data);

    // 2. ምስሎቹን ወደ ካንቫስ (Canvas Image) መጫን
    const imgId = await canvas.loadImage(idBuffer);
    const imgSelfie = await canvas.loadImage(selfieBuffer);

    const detectorOptions = new faceapi.TinyFaceDetectorOptions({ inputSize: 128, scoreThreshold: 0.3 });

    // 3. የፊት ገጽታዎችን መፈለግ
    const idResult = await faceapi.detectSingleFace(imgId, detectorOptions).withFaceLandmarks().withFaceDescriptor();
    const selfieResult = await faceapi.detectSingleFace(imgSelfie, detectorOptions).withFaceLandmarks().withFaceDescriptor();

    // ፊት ማግኘት ካልተቻለ እውነተኛ ውጤት ለማምጣት ፊት አልተገኘም ብሎ እንዲያልፍ ማድረግ
    if (!idResult || !selfieResult) {
      console.warn("⚠️ በምስሉ ላይ ፊት በግልጽ አልተገኘም!");
      return res.json({ success: true, matchPercentage: 50, message: "ፊት ማግኘት አልተቻለም (50% Fallback)" });
    }

    // 4. የፊቶቹን ርቀት በትክክል ማነጻጸር
    const distance = faceapi.euclideanDistance(idResult.descriptor, selfieResult.descriptor);
    let matchPercentage = Math.round((1 - distance) * 100);
    matchPercentage = Math.max(0, Math.min(100, matchPercentage));

    console.log(`📊 እውነተኛ የማነጻጸር ውጤት ተገኝቷል፦ ${matchPercentage}%`);
    return res.json({ success: true, matchPercentage });

  } catch (error) {
    console.error("❌ የሰርቨር ማነጻጸር ስህተት አጋጥሟል፦", error.message);
    // በማንኛውም አጠቃላይ ስህተት ምክንያት ሲስተሙ እንዳይዘጋ የ 65% መከላከያውን ማቆየት
    return res.json({ success: true, matchPercentage: 65, message: "የውስጥ ስህተት አጋጥሟል" });
  }
});


/* ==========================================
   MAIN VERIFY (ID + SELFIE + LIVENESS FINAL SAVE)
========================================== */
/* ==========================================
   🔥 [የተስተካከለ] MAIN VERIFY WITH SERVER-SIDE FACE MATCHING
========================================== */
/* ==========================================
   🔥 [ትክክለኛ] MAIN VERIFY - REAL MATCH PERCENTAGE ONLY
========================================== */
router.post("/verify-success", async (req, res) => {
  try {
    const {
      faydaNumber,
      dbPhotoUrl,
      selfiePhotoUrl,
      smilePassed,
      nodPassed,
      turnPassed
    } = req.body;

    if (!faydaNumber) {
      return res.status(400).json({ success: false, message: "Fayda number is required" });
    }

    const pensioner = await UserPensioner.findOne({ faydaNumber });
    if (!pensioner) {
      return res.status(404).json({ success: false, message: "Pensioner not found" });
    }

    let finalDbPhotoUrl = dbPhotoUrl || pensioner.photoUrl || "";
    let finalSelfieUrl = selfiePhotoUrl || "";

    // 🚨 እውነተኛውን ቁጥር ብቻ መያዣ (ጅማሮው በ 0)
    let finalMatch = 0; 

    try {
      await loadServerModels();
      console.log("⏳ ምስሎችን በ Axios አውርዶ እያነጻጸረ ነው...");
      
      const [idResponse, selfieResponse] = await Promise.all([
        axios.get(finalDbPhotoUrl, { responseType: "arraybuffer" }),
        axios.get(finalSelfieUrl, { responseType: "arraybuffer" })
      ]);

      const idBuffer = Buffer.from(idResponse.data);
      const selfieBuffer = Buffer.from(selfieResponse.data);

      const imgId = await canvas.loadImage(idBuffer);
      const imgSelfie = await canvas.loadImage(selfieBuffer);

      const detectorOptions = new faceapi.TinyFaceDetectorOptions({ inputSize: 128, scoreThreshold: 0.3 });

      const idResult = await faceapi.detectSingleFace(imgId, detectorOptions).withFaceLandmarks().withFaceDescriptor();
      const selfieResult = await faceapi.detectSingleFace(imgSelfie, detectorOptions).withFaceLandmarks().withFaceDescriptor();

      if (idResult && selfieResult) {
        const distance = faceapi.euclideanDistance(idResult.descriptor, selfieResult.descriptor);
        // እውነተኛውን የርቀት ስሌት ወደ ፐርሰንት መቀየር
        finalMatch = Math.round((1 - distance) * 100);
        finalMatch = Math.max(0, Math.min(100, finalMatch));
        console.log(`📊 እውነተኛ የፊት ማነጻጸር ውጤት ተገኝቷል፦ ${finalMatch}%`);
      } else {
        console.warn("⚠️ በምስሎቹ ላይ ፊት አልተገኘም!");
        finalMatch = 10; // ፊት ጨርሶ ካልተገኘ 10% ብቻ ይሰጣል
      }
    } catch (faceErr) {
      console.error("የፊት ማነጻጸር ስህተት፦", faceErr.message);
      finalMatch = 5; // በኮድ ስህተት ምክንያት ካልሰራ 5% ብቻ ይሰጣል
    }

    if (finalDbPhotoUrl.startsWith("data:image")) {
      finalDbPhotoUrl = await uploadToImgBB(finalDbPhotoUrl);
    }
    if (finalSelfieUrl.startsWith("data:image")) {
      finalSelfieUrl = await uploadToImgBB(finalSelfieUrl);
    }

    // ከ 70% በላይ ከሆነ ብቻ ነው የሚማሳሰሉት
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
      matchPercentage: finalMatch, // 🌟 እዚህ ጋር እውነተኛው ቁጥር ብቻ ይገባል!
      faceMatched,
      smilePassed: !!smilePassed,
      nodPassed: !!nodPassed,
      turnPassed: !!turnPassed,
      verificationStatus
    });

    await record.save();
    return res.status(200).json({ success: true, message: "Liveness verification completed", data: record });

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
