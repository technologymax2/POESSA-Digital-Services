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
      
      // 1. ሞዴሎችን መጫን (ለሞባይል ሲባል TinyFaceDetector ተጠቅሟል)
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);

      const idImg = await faceapi.fetchImage(idPhoto);
      const selfieImg = await faceapi.fetchImage(selfiePhoto);

      // 2. ፊቶችን መለየት (TinyFaceDetector ለሞባይል ፈጣን ነው)
      const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 224 });
      
      const idDescriptor = await faceapi
        .detectSingleFace(idImg, options)
        .withFaceLandmarks()
        .withFaceDescriptor();
        
      const selfieDescriptor = await faceapi
        .detectSingleFace(selfieImg, options)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!idDescriptor || !selfieDescriptor) {
        setMessage("❌ ፊት አልተገኘም፤ እባክዎ ጥርት ያለ ፎቶ እንደገና ያንሱ።");
        setLoading(false);
        return;
      }

      // 3. ማነፃፀር
      const distance = faceapi.euclideanDistance(
        idDescriptor.descriptor, 
        selfieDescriptor.descriptor
      );

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
      setMessage("⚠️ የስርዓት ስህተት ተፈጥሯል፤ እባክዎ ኢንተርኔትዎን ይፈትሹ።");
      setLoading(false);
    }
  };

  return (
    <div className="verification-wizard-container">
      {loading && (
        <>
          <div className="verification-wizard-loader"></div>
          <p style={{ color: "#64748b" }}>እባክዎን ይጠብቁ...</p>
        </>
      )}
      <h2 className="verification-wizard-status">{message}</h2>
    </div>
  );
}

export default FaceMatch;
