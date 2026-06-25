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
// LivenessTestBack.js ያለው 'routes' ፎልደር ውስጥ ከሆነ ሁለት ደረጃ (../) ወደ ኋላ ይወጣል
const MODEL_DIR = path.join(__dirname, "../../models"); 
let modelsLoaded = false;

async function loadServerModels() {
  if (modelsLoaded) return;
  try {
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

    let finalMatch = 0; 

    try {
      // 1. ሞዴሎቹ መጫናቸውን ማረጋገጥ
      await loadServerModels();
      console.log("⏳ ምስሎችን በ Axios አውርዶ እያነጻጸረ ነው...");
      
      // 2. ምስሎቹን ከአገናኝ ዩአርኤል (URL) በ Arraybuffer ማውረድ
      const [idResponse, selfieResponse] = await Promise.all([
        axios.get(finalDbPhotoUrl, { responseType: "arraybuffer", timeout: 10000 }),
        axios.get(finalSelfieUrl, { responseType: "arraybuffer", timeout: 10000 })
      ]);

      // 3. ምስሎቹን ወደ Canvas መጫን
      const imgId = await canvas.loadImage(Buffer.from(idResponse.data));
      const imgSelfie = await canvas.loadImage(Buffer.from(selfieResponse.data));

      // 4. የፊት መፈለጊያ መስፈርቱን ማስተካከል (scoreThreshold: 0.1)
      const detectorOptions = new faceapi.TinyFaceDetectorOptions({ inputSize: 128, scoreThreshold: 0.1 });

      const idResult = await faceapi.detectSingleFace(imgId, detectorOptions).withFaceLandmarks().withFaceDescriptor();
      const selfieResult = await faceapi.detectSingleFace(imgSelfie, detectorOptions).withFaceLandmarks().withFaceDescriptor();

      if (idResult && selfieResult) {
        const distance = faceapi.euclideanDistance(idResult.descriptor, selfieResult.descriptor);
        finalMatch = Math.round((1 - distance) * 100);
        finalMatch = Math.max(0, Math.min(100, finalMatch));
        console.log(`📊 [MATCH FOUND] እውነተኛ የፊት ማነጻጸር ውጤት ተገኝቷል፦ ${finalMatch}%`);
      } else {
        if (!idResult) console.warn("⚠️ በመታወቂያው (DB) ፎቶ ላይ ፊት አልተገኘም!");
        if (!selfieResult) console.warn("⚠️ በሴልፊው ፎቶ ላይ ፊት አልተገኘም!");
        finalMatch = 0; 
      }
    } catch (faceErr) {
      // 🚨 በማነጻጸር ሂደት ውስጥ የተፈጠረውን ትክክለኛ ስህተት እዚህ ላይ እናየዋለን
      console.error("❌ የፊት ማነጻጸር ዝርዝር ስህተት፦", faceErr);
      finalMatch = 0; 
    }

    // ምስሎቹ የቤዝ64 ዳታ ከሆኑ ወደ ማከማቻ (ImgBB) መስቀል
    if (finalDbPhotoUrl.startsWith("data:image")) finalDbPhotoUrl = await uploadToImgBB(finalDbPhotoUrl);
    if (finalSelfieUrl.startsWith("data:image")) finalSelfieUrl = await uploadToImgBB(finalSelfieUrl);

    // 🌟 የድርጅት መስፈርት ማረጋገጫ (ከ 70% በላይ ከሆነ ብቻ ነው የሚማሳሰሉት)
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
    return res.status(200).json({ success: true, message: "Liveness verification completed", data: record });

  } catch (error) {
    console.error("Liveness Global Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// የሪፖርት ማውጫ መስመሮች (Get Methods) እንዳሉ ይቀጥላሉ...
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
