import React, { useEffect, useState } from "react";
import * as faceapi from "face-api.js";

function FaceMatch({ idPhoto, selfiePhoto, onSuccess }) {
  const [matchPercentage, setMatchPercentage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("⏳ AI ሞዴሎችን በመጫን ላይ...");
  const [isMatched, setIsMatched] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const runFaceMatch = async () => {
      try {
        // 1. ሞዴሎችን መጫን (ለአንዴ ብቻ እንዲጫኑ በ public/models ይቆዩ)
        setStatusMessage("⏳ AI ሞዴሎችን በመጫን ላይ...");
        const MODEL_URL = "/models"; 
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);

        // 2. ምስሎችን መጫን
        const loadImage = (src) =>
          new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = src;
            img.onload = () => resolve(img);
            img.onerror = reject;
          });

        setStatusMessage("⏳ ምስሎችን በማዘጋጀት ላይ...");
        const [img1, img2] = await Promise.all([
          loadImage(idPhoto),
          loadImage(selfiePhoto),
        ]);

        // 3. ፊቶችን መለየት (Detection)
        setStatusMessage("⏳ ፊቶችን በመለየት ላይ...");
        const detectorOptions = new faceapi.TinyFaceDetectorOptions({
          inputSize: 320, 
          scoreThreshold: 0.3,
        });

        const face1 = await faceapi.detectSingleFace(img1, detectorOptions).withFaceLandmarks().withFaceDescriptor();
        const face2 = await faceapi.detectSingleFace(img2, detectorOptions).withFaceLandmarks().withFaceDescriptor();

        if (!face1 || !face2) {
          setStatusMessage("❌ በሁለቱም ምስሎች ውስጥ ፊት አልተገኘም! እባክዎ ጥርት ያለ ፎቶ ይጠቀሙ።");
          setLoading(false);
          return;
        }

        // 4. ማነፃፀር
        setStatusMessage("⏳ ፊቶችን በማነፃፀር ላይ...");
        const distance = faceapi.euclideanDistance(face1.descriptor, face2.descriptor);
        
        // 5. መቶኛ ማስላት
        const similarity = Math.round((1 - distance) * 100);
        const safeSimilarity = Math.max(0, Math.min(100, similarity));

        if (!isMounted) return;

        setMatchPercentage(safeSimilarity);

        if (safeSimilarity >= 50) {
          setIsMatched(true);
          setStatusMessage(`🎉 ማረጋገጫ ተሳክቷል! (${safeSimilarity}%)`);
        } else {
          setIsMatched(false);
          setStatusMessage(`❌ ፊቱ አይመሳሰልም! (${safeSimilarity}%)`);
        }
      } catch (err) {
        console.error("Face Match Error:", err);
        setStatusMessage("❌ የ AI ስህተት ተፈጥሯል፤ እባክዎ እንደገና ይሞክሩ።");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    runFaceMatch();
    return () => { isMounted = false; };
  }, [idPhoto, selfiePhoto]);

  return (
    <div style={{ padding: "20px", textAlign: "center", fontFamily: "sans-serif" }}>
      <h3>🤖 Face Match AI</h3>

      <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginBottom: "20px" }}>
        <img src={idPhoto} alt="ID" style={{ width: "120px", height: "120px", borderRadius: "8px", objectFit: "cover", border: "2px solid #cbd5e1" }} />
        <img src={selfiePhoto} alt="Selfie" style={{ width: "120px", height: "120px", borderRadius: "8px", objectFit: "cover", border: "2px solid #cbd5e1" }} />
      </div>

      <div style={{ marginTop: "15px", padding: "10px", background: isMatched ? "#dcfce7" : "#fee2e2", borderRadius: "8px", fontWeight: "bold" }}>
        {statusMessage}
      </div>

      {matchPercentage !== null && (
        <h2 style={{ color: isMatched ? "#15803d" : "#b91c1c" }}>{matchPercentage}% Match</h2>
      )}

      {!loading && (
        <button
          onClick={() => onSuccess(matchPercentage)}
          style={{ marginTop: "20px", padding: "12px 30px", background: isMatched ? "#162447" : "#94a3b8", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}
          disabled={!isMatched}
        >
          {isMatched ? "ቀጥል →" : "መመሳሰል አልተገኘም"}
        </button>
      )}
    </div>
  );
}

export default FaceMatch;
