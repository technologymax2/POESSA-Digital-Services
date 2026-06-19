import React, { useEffect, useState } from "react";
import * as faceapi from "@vladmandic/face-api";
import "./Verification.css";

function FaceMatch({ idPhoto, selfiePhoto, onSuccess }) {
  const [message, setMessage] = useState("ፊቶችን በማወዳደር ላይ...");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    verifyFace();
  }, []);

  const verifyFace = async () => {
    try {
      const MODEL_URL = "https://cdn.jsdelivr.net/gh/vladmandic/face-api/model/";
      
      // ሞዴሎችን መጫን
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);

      const idImg = await faceapi.fetchImage(idPhoto);
      const selfieImg = await faceapi.fetchImage(selfiePhoto);

      const idDescriptor = await faceapi.detectSingleFace(idImg).withFaceLandmarks().withFaceDescriptor();
      const selfieDescriptor = await faceapi.detectSingleFace(selfieImg).withFaceLandmarks().withFaceDescriptor();

      if (!idDescriptor || !selfieDescriptor) {
        setMessage("❌ ፊት አልተገኘም፤ እባክዎ እንደገና ይሞክሩ።");
        setLoading(false);
        return;
      }

      const distance = faceapi.euclideanDistance(idDescriptor.descriptor, selfieDescriptor.descriptor);

      if (distance < 0.6) {
        setMessage("✅ የፊት ማመሳሰል ተሳክቷል!");
        setLoading(false);
        setTimeout(() => onSuccess(), 1500);
      } else {
        setMessage("❌ ፊቶች አይመሳሰሉም። እባክዎ ጥርት ያለ ፎቶ ይጠቀሙ።");
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setMessage("⚠️ የስርዓት ስህተት ተፈጥሯል።");
      setLoading(false);
    }
  };

  return (
    <div className="verification-wizard-container">
      {loading && <div className="verification-wizard-loader"></div>}
      <h2 className="verification-wizard-status">{message}</h2>
    </div>
  );
}

export default FaceMatch;
