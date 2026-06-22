import React, { useEffect, useState } from "react";

let modelsLoaded = false;

function FaceMatch({ idPhoto, selfiePhoto, onSuccess }) {
  const [matchPercentage, setMatchPercentage] = useState(null);
  const [statusMessage, setStatusMessage] = useState("⏳ Starting AI...");
  const [loading, setLoading] = useState(true);
  const [isMatched, setIsMatched] = useState(false);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      try {
        const faceapi = window.faceapi;

        if (!faceapi) {
          setStatusMessage("❌ face-api.js not loaded");
          return;
        }

        if (!idPhoto || !selfiePhoto) {
          setStatusMessage("❌ Missing images");
          return;
        }

        const MODEL_URL = "/models";

        if (!modelsLoaded) {
          await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
          ]);
          modelsLoaded = true;
        }

        const loadImage = (src) =>
          new Promise((resolve, reject) => {
            if (!src) return reject("empty image");

            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => resolve(img);
            img.onerror = () => reject("load failed");
            img.src = src;
          });

        setStatusMessage("⏳ Loading images...");

        const [img1, img2] = await Promise.all([
          loadImage(idPhoto),
          loadImage(selfiePhoto),
        ]);

        setStatusMessage("⏳ Detecting faces...");

        const options = new faceapi.TinyFaceDetectorOptions({
          inputSize: 224,
          scoreThreshold: 0.5,
        });

        const face1 = await faceapi
          .detectSingleFace(img1, options)
          .withFaceLandmarks()
          .withFaceDescriptor();

        const face2 = await faceapi
          .detectSingleFace(img2, options)
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (!face1 || !face2) {
          setStatusMessage("❌ Face not detected");
          return;
        }

        const distance = faceapi.euclideanDistance(
          face1.descriptor,
          face2.descriptor
        );

        const similarity = Math.max(
          0,
          Math.min(100, Math.round((1 - distance / 0.6) * 100))
        );

        if (!mounted) return;

        setMatchPercentage(similarity);

        if (similarity >= 50) {
          setIsMatched(true);
          setStatusMessage(`✅ Match Success (${similarity}%)`);
          setTimeout(() => onSuccess(similarity), 800);
        } else {
          setIsMatched(false);
          setStatusMessage(`❌ Match Failed (${similarity}%)`);
        }
      } catch (e) {
        console.error(e);
        setStatusMessage("❌ Error while comparing faces");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    run();

    return () => {
      mounted = false;
    };
  }, [idPhoto, selfiePhoto]);

  return (
    <div style={{ padding: 20, textAlign: "center" }}>
      <h3>Face Match AI</h3>

      <div style={{ display: "flex", justifyContent: "center", gap: 20 }}>
        <img src={idPhoto} width={130} alt="ID" />
        <img src={selfiePhoto} width={130} alt="Selfie" />
      </div>

      <div style={{ marginTop: 15 }}>{statusMessage}</div>

      {matchPercentage !== null && (
        <h2>{matchPercentage}% Match</h2>
      )}
    </div>
  );
}

export default FaceMatch;
