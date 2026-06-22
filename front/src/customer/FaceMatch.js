import React, { useEffect, useState } from "react";
import * as faceapi from "face-api.js";

function FaceMatch({ registeredPhoto, selfiePhoto, onSuccess }) {
  const [statusMessage, setStatusMessage] = useState("Loading...");
  const [matchPercentage, setMatchPercentage] = useState(null);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      try {
        console.log("REGISTERED:", registeredPhoto);
        console.log("SELFIE:", selfiePhoto);

        if (!registeredPhoto || !selfiePhoto) {
          setStatusMessage("Missing images");
          return;
        }

        const MODEL_URL = "/models";

        setStatusMessage("Loading AI models...");

        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);

        setStatusMessage("Loading images...");

        const loadImage = (src) =>
          new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => resolve(img);
            img.onerror = (e) => reject("Image load failed: " + src);
            img.src = src;
          });

        const img1 = await loadImage(registeredPhoto);
        const img2 = await loadImage(selfiePhoto);

        setStatusMessage("Detecting faces...");

        const options = new faceapi.TinyFaceDetectorOptions({
          inputSize: 320,
          scoreThreshold: 0.5,
        });

        const result1 = await faceapi
          .detectSingleFace(img1, options)
          .withFaceLandmarks()
          .withFaceDescriptor();

        const result2 = await faceapi
          .detectSingleFace(img2, options)
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (!result1 || !result2) {
          setStatusMessage("Face not detected in one image");
          return;
        }

        const distance = faceapi.euclideanDistance(
          result1.descriptor,
          result2.descriptor
        );

        console.log("DISTANCE:", distance);

        let similarity = (1 - distance / 0.6) * 100;
        similarity = Math.max(0, Math.min(100, Math.round(similarity)));

        if (!mounted) return;

        setMatchPercentage(similarity);

        if (similarity >= 50) {
          setStatusMessage(`Match OK (${similarity}%)`);
          setTimeout(() => onSuccess(similarity), 1000);
        } else {
          setStatusMessage(`Face Mismatch (${similarity}%)`);
        }
      } catch (err) {
        console.error("FACE MATCH ERROR:", err);
        setStatusMessage("❌ Error: " + err);
      }
    };

    run();

    return () => {
      mounted = false;
    };
  }, [registeredPhoto, selfiePhoto]);

  return (
    <div style={{ textAlign: "center", padding: 20 }}>
      <h2>Face Verification</h2>

      <div style={{ display: "flex", justifyContent: "center", gap: 20 }}>
        <img src={registeredPhoto} width={150} style={{ borderRadius: 10 }} />
        <img src={selfiePhoto} width={150} style={{ borderRadius: 10 }} />
      </div>

      <h3 style={{ marginTop: 20 }}>{statusMessage}</h3>

      {matchPercentage !== null && (
        <h2>{matchPercentage}% Match</h2>
      )}
    </div>
  );
}

export default FaceMatch;
