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
        // 1. ሞዴሎችን መጫን
        setStatusMessage("⏳ AI ሞዴሎችን በመጫን ላይ...");
        const MODEL_URL = "/models"; 
        
        // face-api ሞዴሎች መጫናቸውን ማረጋገጥ
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);

        // 2. ምስሎችን መጫን - እዚህ ጋር CrossOrigin መስጠት በጣም አስፈላጊ ነው
        const loadImage = (src) =>
          new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous"; // ይህ መስመር CORS ስህተትን ለመከላከል ነው
            img.src = src;
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error("ምስል መጫን አልተቻለም"));
          });

        setStatusMessage("⏳ ምስሎችን በማዘጋጀት ላይ...");
        const [img1, img2] = await Promise.all([
          loadImage(idPhoto),
          loadImage(selfiePhoto),
        ]);

        // 3. ፊቶችን መለየት
        setStatusMessage("⏳ ፊቶችን በመለየት ላይ...");
        const detectorOptions = new faceapi.TinyFaceDetectorOptions({
          inputSize: 320, 
          scoreThreshold: 0.4, // ትንሽ ዝቅ አድርገነዋል
        });

        const face1 = await faceapi.detectSingleFace(img1, detectorOptions).withFaceLandmarks().withFaceDescriptor();
        const face2 = await faceapi.detectSingleFace(img2, detectorOptions).withFaceLandmarks().withFaceDescriptor();

        if (!face1 || !face2) {
          setStatusMessage("❌ በምስሎቹ ውስጥ ፊት አልተገኘም! እባክዎ ብርሃን ባለበት ቦታ ሆነው እንደገና ይሞክሩ።");
          setLoading(false);
          return;
        }

        // 4. ማነፃፀር
        const distance = faceapi.euclideanDistance(face1.descriptor, face2.descriptor);
        const similarity = Math.round((1 - distance) * 100);
        const safeSimilarity = Math.max(0, Math.min(100, similarity));

        if (!isMounted) return;

        setMatchPercentage(safeSimilarity);

        if (safeSimilarity >= 50) {
          setIsMatched(true);
          setStatusMessage(`🎉 ማረጋገጫ ተሳክቷል! (${safeSimilarity}%)`);
          setTimeout(() => onSuccess(safeSimilarity), 1000);
        } else {
          setIsMatched(false);
          setStatusMessage(`❌ ፊቱ አይመሳሰልም! (${safeSimilarity}%)`);
        }
      } catch (err) {
        console.error("Face Match Error:", err);
        setStatusMessage("❌ የ AI ስህተት ተፈጥሯል፤ እባክዎ ኢንተርኔት ይኑርዎት።");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    runFaceMatch();
    return () => { isMounted = false; };
  }, [idPhoto, selfiePhoto]);

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h3>🤖 የፊት ማረጋገጫ</h3>
      <div style={{ display: "flex", justifyContent: "center", gap: "20px" }}>
        <img src={idPhoto} alt="Registered" style={{ width: "120px", height: "120px", borderRadius: "50%", objectFit: "cover" }} />
        <img src={selfiePhoto} alt="Selfie" style={{ width: "120px", height: "120px", borderRadius: "50%", objectFit: "cover" }} />
      </div>
      <div style={{ marginTop: "15px", padding: "10px", background: isMatched ? "#dcfce7" : "#fee2e2", borderRadius: "8px", fontWeight: "bold" }}>
        {statusMessage}
      </div>
    </div>
  );
}

export default FaceMatch;
