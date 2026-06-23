import React, { useEffect, useState } from "react";
import * as faceapi from "face-api.js";

function FaceMatch({ idPhoto, selfiePhoto, onSuccess }) {
  const [status, setStatus] = useState("⏳ ስርዓቱ እየተዘጋጀ ነው...");
  const [isMatched, setIsMatched] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const startProcessing = async () => {
      try {
        setStatus("⏳ AI ሞዴሎችን በመጫን ላይ...");
        const MODEL_URL = "/models";
        
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);

        setStatus("⏳ ምስሎችን በማዘጋጀት ላይ...");
        const img1 = await loadImage(idPhoto);
        const img2 = await loadImage(selfiePhoto);

        setStatus("⏳ ፊቶችን በመለየት ላይ...");
        const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 224 });
        
        const detection1 = await faceapi.detectSingleFace(img1, options).withFaceLandmarks().withFaceDescriptor();
        const detection2 = await faceapi.detectSingleFace(img2, options).withFaceLandmarks().withFaceDescriptor();

        if (!detection1 || !detection2) {
          setStatus("❌ ፊት አልተገኘም! እባክዎ ብርሃን ባለበት ቦታ ምስሉን እንደገና ያንሱ።");
          return;
        }

        const distance = faceapi.euclideanDistance(detection1.descriptor, detection2.descriptor);
        const score = Math.round((1 - distance) * 100);

        if (isMounted) {
          if (score > 40) {
            setIsMatched(true);
            setStatus(`✅ ማረጋገጫ ተሳክቷል! (${score}%)`);
            setTimeout(() => onSuccess(score), 1500);
          } else {
            setStatus(`❌ ፊቱ አይመሳሰልም! (${score}%) - እባክዎ እንደገና ይሞክሩ።`);
          }
        }
      } catch (err) {
        setStatus("❌ ስህተት ተፈጥሯል! እባክዎ ኢንተርኔትዎን ያረጋግጡ።");
        console.error("Face Match Error:", err);
      }
    };

    const loadImage = (src) => new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("ምስል መጫን አልተቻለም"));
      img.src = src;
    });

    startProcessing();
    return () => { isMounted = false; };
  }, [idPhoto, selfiePhoto, onSuccess]);

  return (
    <div style={{ padding: "20px", textAlign: "center", fontFamily: "sans-serif" }}>
      <h3 style={{ color: "#333" }}>🤖 የፊት ማረጋገጫ (Face Verification)</h3>
      <div style={{ display: "flex", justifyContent: "center", gap: "15px", marginBottom: "20px" }}>
        <img src={idPhoto} alt="Registered" style={{ width: "100px", height: "100px", borderRadius: "50%", objectFit: "cover", border: "2px solid #ddd" }} />
        <img src={selfiePhoto} alt="Selfie" style={{ width: "100px", height: "100px", borderRadius: "50%", objectFit: "cover", border: "2px solid #ddd" }} />
      </div>
      <div style={{ 
        padding: "15px", 
        borderRadius: "8px", 
        background: isMatched ? "#dcfce7" : "#fee2e2", 
        color: isMatched ? "#166534" : "#991b1b",
        fontWeight: "bold" 
      }}>
        {status}
      </div>
    </div>
  );
}

export default FaceMatch;
