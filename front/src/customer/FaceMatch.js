import React, { useState, useEffect } from "react";

function FaceMatch({ idPhoto, selfiePhoto, onSuccess }) {
  const [matchPercentage, setMatchPercentage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("⏳ የAI ሞዴሎችን በመጫን ላይ...");
  const [isMatched, setIsMatched] = useState(false);

  useEffect(() => {
    const runFaceMatch = async () => {
      try {
        if (!window.faceapi) {
          setStatusMessage("❌ የፊት መለያው ስክሪፕት አልተጫነም፤ እባክዎ ገጹን ያድሱት።");
          setLoading(false);
          return;
        }

        const faceapi = window.faceapi;
        setStatusMessage("⏳ የፊቱን ነጥቦች መለያ ሞዴሎች በማውረድ ላይ...");
        
        // 1. የ Face-API ሞዴሎችን ከ CDN መጫን
        const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model";
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL); 
        await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);

        setStatusMessage("⏳ ሁለቱንም ፎቶዎች ከ ImgBB በማንበብ ላይ...");

        // 2. ፎቶዎቹን በ HTML Image አማካኝነት በደህንነት (CORS) መጫኛ
        const loadImg = (src) => {
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous"; 
            img.src = src;
            img.onload = () => resolve(img);
            img.onerror = (err) => reject(new Error(`ፎቶውን መጫን አልተቻለም፦ ${src}`));
          });
        };

        const img1 = await loadImg(idPhoto); 
        const img2 = await loadImg(selfiePhoto); 

        setStatusMessage("⏳ ሁለቱንም ፎቶዎች በማነፃፀር ላይ...");

        // 3. ፊትን በሁለቱም ሞዴሎች (Tiny እና SSD) መፈለግ
        let detection1 = await faceapi.detectSingleFace(img1, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();
        let detection2 = await faceapi.detectSingleFace(img2, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();

        if (!detection1) {
          detection1 = await faceapi.detectSingleFace(img1).withFaceLandmarks().withFaceDescriptor();
        }
        if (!detection2) {
          detection2 = await faceapi.detectSingleFace(img2).withFaceLandmarks().withFaceDescriptor();
        }

        if (!detection1 || !detection2) {
          setStatusMessage("❌ በፎቶዎቹ ላይ የሰውን ፊት በትክክል ማግኘት አልተቻለም! እባክዎ ሙሉ ፊትዎ እንዲታይ ሆነው በግልጽ ይነሱ።");
          setLoading(false);
          return;
        }

        // 4. በሁለቱ ፊቶች መካከል ያለውን የቦታ ርቀት ማነፃፀር
        const distance = faceapi.euclideanDistance(detection1.descriptor, detection2.descriptor);
        // የርቀቱን ውጤት ወደ መቶኛ (%) መቀየር
        const similarity = Math.max(0, Math.min(100, Math.round((1 - distance) * 100)));
        setMatchPercentage(similarity);

        // 5. የመመሳሰል ወሰን ማረጋገጫ (Threshold)
        if (similarity >= 50) { 
          setIsMatched(true);
          setStatusMessage(`🎉 ማመሳሰሉ ተሳክቷል! የፊት መመሳሰል መጠን፦ ${similarity}%`);
        } else {
          setIsMatched(false);
          setStatusMessage(`❌ ፎቶዎቹ አይመሳሰሉም! የመመሳሰል መጠን፦ ${similarity}% ብቻ ነው።`);
        }

      } catch (err) {
        console.error("Face Matching Error:", err);
        setStatusMessage("❌ የፊት ማነፃፃሪያው ላይ የቴክኒክ ስህተት አጋጥሟል።");
      } finally {
        setLoading(false);
      }
    };

    runFaceMatch();
  }, [idPhoto, selfiePhoto]);

  return (
    <div style={{ padding: "20px", maxWidth: "450px", margin: "0 auto", textAlign: "center", fontFamily: "sans-serif" }}>
      <h3 style={{ color: "#162447", fontWeight: "700" }}>🤖 ደረጃ 3፦ የፊት ባዮሜትሪክስ ማነፃፀሪያ</h3>
      <p style={{ color: "#64748b", fontSize: "14px" }}>በመታወቂያ ፎቶ እና በአዲሱ ሴልፊ መካከል ያለውን አንድነት በAI ማረጋገጫ</p>

      {/* 📸 የፎቶዎች ጎን ለጎን ማሳያ ሰሌዳ */}
      <div style={{ display: "flex", justifyContent: "center", gap: "20px", margin: "20px 0" }}>
        <div>
          <img src={idPhoto} alt="Database" style={{ width: "110px", height: "120px", objectFit: "cover", borderRadius: "8px", border: "2px solid #cbd5e1" }} />
          <span style={{ display: "block", fontSize: "11px", color: "#64748b", marginTop: "4px", fontWeight: "600" }}>የመታወቂያ ፎቶ</span>
        </div>
        <div>
          <img src={selfiePhoto} alt="Selfie" style={{ width: "110px", height: "120px", objectFit: "cover", borderRadius: "8px", border: "2px solid #cbd5e1" }} />
          <span style={{ display: "block", fontSize: "11px", color: "#64748b", marginTop: "4px", fontWeight: "600" }}>የአሁን ሴልፊ</span>
        </div>
      </div>

      {/* 📊 የሁኔታ ማሳያ መልዕክት ሳጥን */}
      <div style={{ background: loading ? "#f8fafc" : isMatched ? "#f0fdf4" : "#fef2f2", padding: "15px", borderRadius: "10px", border: `1px solid ${loading ? "#e2e8f0" : isMatched ? "#bbf7d0" : "#fecaca"}`, margin: "20px 0" }}>
        <p style={{ fontSize: "14px", fontWeight: "600", color: loading ? "#334155" : isMatched ? "#15803d" : "#b91c1c", margin: 0 }}>
          {statusMessage}
        </p>
      </div>

      {/* 🔘 የድርጊት ቁልፎች */}
      {!loading && isMatched && (
        <button 
          onClick={() => onSuccess(matchPercentage)} // 🌟 የፐርሰንት ውጤቱን ይዞ ወደ ቀጣዩ (Liveness) ገጽ ይሄዳል
          style={{ background: "#22c55e", color: "#fff", padding: "14px", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", width: "100%", fontSize: "15px", boxShadow: "0 4px 6px rgba(34, 197, 94, 0.2)" }}
        >
          ደረጃ 4 እለፍ (የህያውነት ፈተና) →
        </button>
      )}

      {!loading && !isMatched && (
        <button 
          onClick={() => window.location.reload()} 
          style={{ background: "#dc2626", color: "#fff", padding: "12px", border: "none", borderRadius: "8px", cursor: "pointer", width: "100%", fontWeight: "bold" }}
        >
          🔄 እንደገና ይሞክሩ
        </button>
      )}
    </div>
  );
}

export default FaceMatch;
