import React, { useEffect, useState } from "react";
import * as faceapi from "@vladmandic/face-api";
import "./Verification.css";

function FaceMatch({ idPhoto, selfiePhoto, onSuccess }) {
  const [message, setMessage] = useState("ሞዴሎችን በመጫን ላይ...");

  useEffect(() => {
    const runVerification = async () => {
      try {
        // የሞዴል መጫኛ URL
        const MODEL_URL = "https://cdn.jsdelivr.net/gh/vladmandic/face-api/model/";
        
        setMessage("ሞዴሎችን በመጫን ላይ (እባክዎ ይጠብቁ)...");
        
        // ለሞባይል ስልኮች ፈጣን እና ቀለል ያለ ሞዴል መጫን
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);

        setMessage("ፎቶዎችን በማወዳደር ላይ...");

        // ምስሎችን ማዘጋጀት
        const idImg = await faceapi.fetchImage(idPhoto);
        const selfieImg = await faceapi.fetchImage(selfiePhoto);

        // ፊቶችን መለየት (TinyFaceDetector በመጠቀም)
        const idDescriptor = await faceapi.detectSingleFace(idImg, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptor();
        
        const selfieDescriptor = await faceapi.detectSingleFace(selfieImg, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (!idDescriptor || !selfieDescriptor) {
          setMessage("❌ ፊት አልተገኘም፤ እባክዎ ፎቶውን በግልጽ ያንሱ።");
          return;
        }

        // የርቀት መለኪያ (Distance) ማነፃፀር
        const distance = faceapi.euclideanDistance(idDescriptor.descriptor, selfieDescriptor.descriptor);

        if (distance < 0.6) {
          setMessage("✅ የፊት ማመሳሰል ተሳክቷል!");
          setTimeout(() => onSuccess(), 1000);
        } else {
          setMessage("❌ ፊቶች አይመሳሰሉም። እባክዎ ጥርት ያለ ፎቶ ይጠቀሙ።");
        }
      } catch (err) {
        console.error("FaceMatch Error:", err);
        setMessage("⚠️ የስርዓት ስህተት ተፈጥሯል፤ እባክዎ የኢንተርኔት ግንኙነትዎን ይፈትሹ።");
      }
    };

    runVerification();
  }, [idPhoto, selfiePhoto, onSuccess]);

  return (
    <div className="verification-wizard-container">
      <h2 className="verification-wizard-status">{message}</h2>
    </div>
  );
}

export default FaceMatch;
