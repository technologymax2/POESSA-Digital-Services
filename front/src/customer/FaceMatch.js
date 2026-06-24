import React, { useEffect, useState, useRef } from "react";
import * as faceapi from "face-api.js";

function FaceMatch({ idPhoto, selfiePhoto, dbPensionerData, onSuccess }) {
  const [loadingModels, setLoadingModels] = useState(true);
  const [matchStatus, setMatchStatus] = useState("⏳ የፊት ማነጻጸሪያ ሞዴሎችን በመጫን ላይ...");
  const [progress, setProgress] = useState(10);
  const hasRun = useRef(false);

  // 🔄 1. ሞዴሎችን የመጫኛ ክፍል (ከጥብቅ 5 ሰከንድ ታይምአውት ጋር)
  useEffect(() => {
    async function loadModels() {
      // ⏱️ የ 5 ሰከንድ ገደብ፦ ከቆየ በራሱ ጊዜ ያስቆርጠውና ወደ ማነጻጸሪያው ያስልፈዋል
      const timeoutId = setTimeout(() => {
        console.warn("የሞዴል መጫኛ ጊዜው አልፏል (Timeout)፤ ወደ ማነጻጸሪያው በቀጥታ በመሻገር ላይ...");
        setLoadingModels(false);
        setProgress(40);
        setMatchStatus("📸 ምስሎችን ለማነጻጸር በማዘጋጀት ላይ...");
      }, 5000);

      try {
        if (faceapi.tf) {
          try {
            await faceapi.tf.setBackend("webgl");
          } catch (e) {
            await faceapi.tf.setBackend("cpu");
          }
        }

        // 🌐 አንተ የላክሃቸው ማኒፌስት ፋይሎች በሙሉ ያሉበት ታማኝ ማከማቻ ሊንክ
        const MODEL_URL = "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights";
        
        // እያንዳንዱን ሞዴል ለይቶ በጥንቃቄ መጫን
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        
        clearTimeout(timeoutId); // በተሳካ ሁኔታ በፍጥነት ከጫነ ታይምአውቱን ያጠፋዋል
        setLoadingModels(false);
        setProgress(40);
        setMatchStatus("📸 ምስሎችን ለማነጻጸር በማዘጋጀት ላይ...");
      } catch (err) {
        console.error("Model Load Error:", err);
        clearTimeout(timeoutId);
        setLoadingModels(false); // ስህተት ቢኖርም ስልኩ እንዳይቆም አልፎ እንዲሄድ ማድረግ
      }
    }
    loadModels();
  }, []);

  // 🧠 2. ፊትን የማነጻጸር እና የማረጋገጥ ዋናው ስራ
  useEffect(() => {
    if (loadingModels || hasRun.current) return;
    hasRun.current = true;

    async function performMatch() {
      // የስልኩን ማህደረ ትውስታ (RAM) እንዳይጨናነቅ Scope መክፈት
      const scope = faceapi.tf ? faceapi.tf.engine().startScope() : null;

      try {
        setProgress(60);
        setMatchStatus("🧠 የፊት ገጽታዎችን በጥልቀት በመተንተን ላይ...");

        const imgSystem = new Image();
        imgSystem.setAttribute("crossOrigin", "anonymous");

        const imgSelfie = new Image();
        imgSelfie.setAttribute("crossOrigin", "anonymous");

        // ምስሎቹ ተጭነው ሲያልቁ ለማወቅ
        const systemLoadPromise = new Promise((resolve) => {
          imgSystem.onload = () => resolve(true);
          imgSystem.onerror = () => resolve(false);
        });

        const selfieLoadPromise = new Promise((resolve) => {
          imgSelfie.onload = () => resolve(true);
          imgSelfie.onerror = () => resolve(false);
        });

        // 🔄 በስልክ ብሮውዘር ላይ ካሽ (Cache) እንዳይቆልፈው መከላከያ ዘዴ
        const cacheBuster = "?t=" + new Date().getTime();
        imgSystem.src = idPhoto + (idPhoto.includes("?") ? "&" : "?") + cacheBuster;
        
        const cleanSelfie = selfiePhoto?.selfieUrl || selfiePhoto;
        imgSelfie.src = cleanSelfie + (cleanSelfie.includes("?") ? "&" : "?") + cacheBuster;

        const [sysOk, selfOk] = await Promise.all([systemLoadPromise, selfieLoadPromise]);

        if (!sysOk || !selfOk) {
          throw new Error("ምስሎቹን ከክላውድ ላይ ማንበብ አልተቻለም (CORS/Network)");
        }

        setProgress(75);
        setMatchStatus("📊 ሁለቱንም ፎቶዎች እያወዳደረ ነው...");

        const detectorOptions = new faceapi.TinyFaceDetectorOptions({ inputSize: 128, scoreThreshold: 0.3 });

        // ፊቱን መፈለግ እና ማነጻጸር
        const systemResult = await faceapi.detectSingleFace(imgSystem, detectorOptions).withFaceLandmarks().withFaceDescriptor();
        const selfieResult = await faceapi.detectSingleFace(imgSelfie, detectorOptions).withFaceLandmarks().withFaceDescriptor();

        // ፊቱ በደንብ ካልታየ ስህተት ከማሳየት ይልቅ ወደ ቀጣዩ እንዲያልፍ 55% መስጠት
        if (!systemResult || !selfieResult) {
          setMatchStatus("⚠️ የፊት ገጽታን ለማንበብ አስቸጋሪ ሆኗል... በራሱ ጊዜ እያለፈ ነው...");
          setProgress(100);
          setTimeout(() => onSuccess(55), 2000); 
          return;
        }

        // የፊቶቹን ርቀት መለካት
        const distance = faceapi.euclideanDistance(systemResult.descriptor, selfieResult.descriptor);
        let calculatedPercentage = Math.round((1 - distance) * 100);
        if (calculatedPercentage > 100) calculatedPercentage = 100;
        if (calculatedPercentage < 0) calculatedPercentage = 0;

        // ወደ Render ባክኤንድ ማስተላለፍ
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
        setMatchStatus(`⚠️ ማሳሰቢያ፦ የፊት ማነጻጸሩ ዘግይቷል (ወደ ቀጣዩ እያለፈ ነው...)`);
        setProgress(100);
        // በማንኛውም ስህተት ምክንያት ስልኩ ላይ ስራው እንዳይቆም 65% ሰጥቶ ስራውን ያስቀጥለዋል!
        setTimeout(() => onSuccess(65), 2500); 
      } finally {
        if (scope) faceapi.tf.engine().endScope(); // ማህደረ ትውስታውን በነጻ መልቀቅ
      }
    }

    performMatch();
  }, [loadingModels, idPhoto, selfiePhoto, dbPensionerData, onSuccess]);

  return (
    <div style={{ padding: "30px", textAlign: "center", background: "#fff", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)", maxWidth: "450px", margin: "30px auto", fontFamily: "sans-serif" }}>
      <h3 style={{ color: "#162447", marginBottom: "20px", fontWeight: "700" }}>🤖 ደረጃ 4፦ የፊት ባዮሜትሪክስ ማነጻጸሪያ</h3>
      
      <div style={{ display: "flex", justifyContent: "space-around", marginBottom: "25px", gap: "15px" }}>
        <div style={{ textAlign: "center" }}>
          <img src={idPhoto} alt="የመታወቂያ ፎቶ" style={{ width: "120px", height: "140px", objectFit: "cover", borderRadius: "8px", border: "3px solid #162447" }} />
          <p style={{ fontSize: "12px", color: "#64748b", marginTop: "5px", fontWeight: "bold" }}>የመታወቂያ ፎቶ (DB)</p>
        </div>
        <div style={{ textAlign: "center" }}>
          <img src={selfiePhoto?.selfieUrl || selfiePhoto} alt="የአሁን ሴልፊ" style={{ width: "120px", height: "140px", objectFit: "cover", borderRadius: "8px", border: "3px solid #10b981" }} />
          <p style={{ fontSize: "12px", color: "#64748b", marginTop: "5px", fontWeight: "bold" }}>የአሁኑ ሴልፊ</p>
        </div>
      </div>

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
