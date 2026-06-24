import React, { useEffect, useState, useRef } from "react";
import * as faceapi from "face-api.js";

function FaceMatch({ idPhoto, selfiePhoto, dbPensionerData, onSuccess }) {
  const [loadingModels, setLoadingModels] = useState(true);
  const [matchStatus, setMatchStatus] = useState("⏳ የፊት ማነጻጸሪያ ሞዴሎችን በመጫን ላይ...");
  const [progress, setProgress] = useState(10);
  const hasRun = useRef(false);

  // 1. ሞዴሎችን የመጫኛ ክፍል
  useEffect(() => {
    async function loadModels() {
      try {
        const MODEL_URL = "/models";
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        
        setLoadingModels(false);
        setProgress(40);
        setMatchStatus("📸 ምስሎችን በማዘጋጀት ላይ...");
      } catch (err) {
        console.error("Model Load Error:", err);
        setMatchStatus("❌ የፊት ማነጻጸሪያ ሞዴሎችን መጫን አልተቻለም!");
      }
    }
    loadModels();
  }, []);

  // 2. ፊትን የማነጻጸር ዋናው ስራ
  useEffect(() => {
    if (loadingModels || hasRun.current) return;
    hasRun.current = true;

    async function performMatch() {
      try {
        setProgress(60);
        setMatchStatus("🧠 የፊት ገጽታዎችን በጥልቀት በመተንተን ላይ...");

        // የቆየውን/የመታወቂያ ፎቶ ማዘጋጀት
        const imgSystem = new Image();
        imgSystem.crossOrigin = "anonymous";
        imgSystem.src = idPhoto;

        // አዲሱን ሴልፊ ማዘጋጀት
        const imgSelfie = new Image();
        imgSelfie.crossOrigin = "anonymous";
        // selfiePhoto ኦብጀክት ከሆነ የውስጡን ሊንክ ይለያል
        imgSelfie.src = selfiePhoto?.selfieUrl || selfiePhoto;

        await Promise.all([
          new Promise((r) => (imgSystem.onload = r)),
          new Promise((r) => (imgSelfie.onload = r)),
        ]);

        setProgress(75);
        setMatchStatus("📊 ሁለቱንም ፎቶዎች እያወዳደረ ነው...");

        // 🌟 ይበልጥ ፈጣንና ጥብቅ ለሆነ አፈጻጸም TinyFaceDetector ተጠቅመናል
        const systemResult = await faceapi
          .detectSingleFace(imgSystem, new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.4 }))
          .withFaceLandmarks()
          .withFaceDescriptor();

        const selfieResult = await faceapi
          .detectSingleFace(imgSelfie, new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.4 }))
          .withFaceLandmarks()
          .withFaceDescriptor();

        // አንደኛው ፊት በትክክል ካልታየ ውድቅ ያደርጋል
        if (!systemResult || !selfieResult) {
          setMatchStatus("❌ የፊት ገጽታን ከፎቶው ላይ ማንበብ አልተቻለም! እባክዎ በቂ ብርሃን ባለበት ቦታ ይሞክሩ።");
          setProgress(100);
          setTimeout(() => onSuccess(0), 2500); 
          return;
        }

        // 🌟 [እውነተኛው የኢዩክሊዲያን ርቀት ስሌት]
        const distance = faceapi.euclideanDistance(systemResult.descriptor, selfieResult.descriptor);
        
        // ርቀቱን ወደ ፐርሰንት (Percentage) መቀየሪያ ፎርሙላ
        let calculatedPercentage = Math.round((1 - distance) * 100);
        if (calculatedPercentage > 100) calculatedPercentage = 100;
        if (calculatedPercentage < 0) calculatedPercentage = 0;

        // ⚠️ [ደህንነት] የነበረው የፊክ ሬንደም ማሳለፊያ መስመር ሙሉ በሙሉ ተወግዷል!
        // አሁን ሁለት የተለያየ ሰው ሲመጣ ውጤቱ በቀጥታ በጣም ዝቅተኛ (ከ30% - 50% በታች) ይሆናል።

        // የጡረተኛውን የፊት ዴስክሪፕተር በባክኤንድ ለማደስ (ካስፈለገ)
        if (dbPensionerData?.faydaNumber) {
          try {
            await fetch("https://poessa-digital-services-1.onrender.com/api/pensioners/verify-face", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                query: dbPensionerData.faydaNumber,
                currentDescriptor: Array.from(selfieResult.descriptor)
              })
            });
          } catch (dbErr) {
            console.error("ዳታቤዝ ማደስ አልተቻለም፦", dbErr);
          }
        }

        setProgress(100);
        setMatchStatus(`📊 ማነጻጸሩ ተጠናቋል! ውጤት፦ ${calculatedPercentage}%`);

        setTimeout(() => {
          onSuccess(calculatedPercentage);
        }, 2000);

      } catch (err) {
        console.error("Face Matching Error:", err);
        setMatchStatus("❌ በማነጻጸር ሂደት ላይ ስህተት አጋጥሟል!");
        setProgress(100);
        setTimeout(() => onSuccess(0), 2000);
      }
    }

    performMatch();
  }, [loadingModels, idPhoto, selfiePhoto, dbPensionerData, onSuccess]);

  return (
    <div style={{ padding: "30px", textAlign: "center", background: "#fff", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)", maxWidth: "450px", margin: "30px auto", fontFamily: "sans-serif" }}>
      <h3 style={{ color: "#162447", marginBottom: "20px", fontWeight: "700" }}>🤖 ደረጃ 4፦ የፊት ባዮሜትሪክስ ማነጻጸሪያ</h3>
      
      {/* የሁለቱ ምስሎች ጎን ለጎን ማሳያ እይታ */}
      <div style={{ display: "flex", justifyContent: "space-around", marginBottom: "25px", gap: "15px" }}>
        <div style={{ textAlign: "center" }}>
          <img 
            src={idPhoto} 
            alt="የመታወቂያ ፎቶ" 
            style={{ width: "120px", height: "140px", objectFit: "cover", borderRadius: "8px", border: "3px solid #162447" }} 
          />
          <p style={{ fontSize: "12px", color: "#64748b", marginTop: "5px", fontWeight: "bold" }}>የመታወቂያ ፎቶ (DB)</p>
        </div>
        <div style={{ textAlign: "center" }}>
          <img 
            src={selfiePhoto?.selfieUrl || selfiePhoto} 
            alt="የአሁን ሴልፊ" 
            style={{ width: "120px", height: "140px", objectFit: "cover", borderRadius: "8px", border: "3px solid #10b981" }} 
          />
          <p style={{ fontSize: "12px", color: "#64748b", marginTop: "5px", fontWeight: "bold" }}>የአሁኑ ሴልፊ</p>
        </div>
      </div>

      {/* የሂደት ማሳያ አሞሌ (Progress Bar) */}
      <div style={{ width: "100%", background: "#e2e8f0", height: "8px", borderRadius: "4px", overflow: "hidden", marginBottom: "15px" }}>
        <div style={{ width: `${progress}%`, background: progress === 100 ? "#10b981" : "#162447", height: "100%", transition: "0.4s ease" }}></div>
      </div>

      <div style={{ padding: "12px", borderRadius: "8px", background: "#f8fafc", border: "1px solid #e2e8f0", fontSize: "15px", fontWeight: "bold", color: "#162447" }}>
        {matchStatus}
      </div>
    </div>
  );
}

export default FaceMatch;
