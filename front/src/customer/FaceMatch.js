// FaceMatch.js - ይህንን ኮድ በፋይልዎ ውስጥ ሙሉ ለሙሉ ይተኩ
import React, { useEffect, useState } from "react";
import * as faceapi from "face-api.js";

function FaceMatch({ idPhoto, selfiePhoto, onSuccess }) {
  const [status, setStatus] = useState("⏳ ስርዓቱ እየተዘጋጀ ነው...");

  useEffect(() => {
    const run = async () => {
      try {
        const MODEL_URL = "/models";
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);

        const loadImg = (src) => new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = src;
        });

        setStatus("⏳ ምስሎችን በማዘጋጀት ላይ...");
        const [img1, img2] = await Promise.all([loadImg(idPhoto), loadImg(selfiePhoto)]);
        
        setStatus("⏳ ፊቶችን በመለየት ላይ...");
        const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 224 });
        const f1 = await faceapi.detectSingleFace(img1, options).withFaceLandmarks().withFaceDescriptor();
        const f2 = await faceapi.detectSingleFace(img2, options).withFaceLandmarks().withFaceDescriptor();

        if (!f1 || !f2) {
          setStatus("❌ ፊት አልተገኘም! እባክዎ ጥርት ያለ ፎቶ ይጠቀሙ።");
          return;
        }

        const dist = faceapi.euclideanDistance(f1.descriptor, f2.descriptor);
        const score = Math.round((1 - dist) * 100);

        if (score > 40) {
          setStatus(`✅ ተሳክቷል! (${score}% ይመሳሰላል)`);
          onSuccess(score);
        } else {
          setStatus(`❌ አልተመሳሰለም! (${score}%)`);
        }
      } catch (err) {
        setStatus("❌ ስህተት! እባክዎ ኢንተርኔትዎን ያረጋግጡ።");
        console.error(err);
      }
    };
    run();
  }, [idPhoto, selfiePhoto, onSuccess]);

  return <div style={{ textAlign: "center", padding: "20px" }}>{status}</div>;
}
export default FaceMatch;
