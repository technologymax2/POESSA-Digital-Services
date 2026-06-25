import React, { useEffect, useState } from "react";
import * as faceapi from "face-api.js";

function FaceMatch({ idPhoto, selfiePhoto, onSuccess }) {
  const [statusMessage, setStatusMessage] = useState("⏳ የፊት ማረጋገጫ ይጀመራል...");
  const [isMatched, setIsMatched] = useState(false);
  const [matchPercentage, setMatchPercentage] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadModels = async () => {
      try {
        const MODEL_URL = "/models";
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        processImages();
      } catch (e) {
        setStatusMessage("❌ AI ሞዴሎች አልተጫኑም!");
      }
    };

    const processImages = async () => {
      try {
        setStatusMessage("⏳ ምስሎችን በማዘጋጀት ላይ...");
        const img1 = await createHtmlImage(idPhoto);
        const img2 = await createHtmlImage(selfiePhoto);

        setStatusMessage("⏳ ፊቶችን በመለየት ላይ...");
        // ለሞባይል ስክሪን የተሻለ ቅንብር
        const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.3 });

        const f1 = await faceapi.detectSingleFace(img1, options).withFaceLandmarks().withFaceDescriptor();
        const f2 = await faceapi.detectSingleFace(img2, options).withFaceLandmarks().withFaceDescriptor();

        if (!f1 || !f2) {
          setStatusMessage("❌ ፊት አልተገኘም! እባክዎ ብርሃን ባለበት ቦታ ሆነው ፊትዎን በግልጽ ያሳዩ።");
          return;
        }

        const dist = faceapi.euclideanDistance(f1.descriptor, f2.descriptor);
        const score = Math.round((1 - dist) * 100);
        
        if (isMounted) {
          setMatchPercentage(score);
          if (score >= 45) { // Threshold 45% (ለሞባይል ትንሽ ልቅ ማድረግ ተገቢ ነው)
            setIsMatched(true);
            setStatusMessage(`✅ ማረጋገጫ ተሳክቷል! (${score}%)`);
            setTimeout(() => onSuccess(score), 1000);
          } else {
            setStatusMessage(`❌ ፊቱ አይመሳሰልም! (${score}%) - እባክዎ እንደገና ይሞክሩ።`);
          }
        }
      } catch (err) {
        setStatusMessage("❌ የፊት ማነፃፀር ስህተት! እባክዎ የበይነመረብ ግንኙነትዎን ያረጋግጡ።");
      }
    };

    const createHtmlImage = (src) => new Promise((res, rej) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => res(img);
      img.onerror = rej;
      img.src = src;
    });

    loadModels();
    return () => { isMounted = false; };
  }, [idPhoto, selfiePhoto]);

  return (
    <div style={{ padding: "10px", textAlign: "center", maxWidth: "400px", margin: "0 auto" }}>
      <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginBottom: "15px" }}>
        <img src={idPhoto} alt="ID" style={{ width: "100px", height: "100px", borderRadius: "50%", border: "2px solid #ccc" }} />
        <img src={selfiePhoto} alt="Selfie" style={{ width: "100px", height: "100px", borderRadius: "50%", border: "2px solid #ccc" }} />
      </div>
      <div style={{ padding: "15px", backgroundColor: isMatched ? "#dcfce7" : "#fee2e2", borderRadius: "10px" }}>
        {statusMessage}
      </div>
    </div>
  );
}

export default FaceMatch;
