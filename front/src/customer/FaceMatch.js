import React, { useEffect, useState } from "react";

let modelsLoaded = false; // ✅ GLOBAL CACHE

function FaceMatch({ idPhoto, selfiePhoto, onSuccess }) {
  const [matchPercentage, setMatchPercentage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("⏳ Starting AI...");
  const [isMatched, setIsMatched] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const runFaceMatch = async () => {
      try {
        const faceapi = window.faceapi;

        if (!faceapi) {
          setStatusMessage("❌ face-api.js not loaded");
          setLoading(false);
          return;
        }

        const MODEL_URL =
          "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model";

        // =========================
        // LOAD MODELS ONLY ONCE
        // =========================
        if (!modelsLoaded) {
          setStatusMessage("⏳ Loading AI models...");

          await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
          ]);

          modelsLoaded = true;
        }

        const loadImage = (src) =>
          new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = src;
            img.onload = () => resolve(img);
            img.onerror = reject;
          });

        setStatusMessage("⏳ Processing images...");

        const [img1, img2] = await Promise.all([
          loadImage(idPhoto),
          loadImage(selfiePhoto),
        ]);

        const detectorOptions = new faceapi.TinyFaceDetectorOptions({
          inputSize: 224,
          scoreThreshold: 0.5,
        });

        setStatusMessage("⏳ Detecting faces...");

        const face1 = await faceapi
          .detectSingleFace(img1, detectorOptions)
          .withFaceLandmarks()
          .withFaceDescriptor();

        const face2 = await faceapi
          .detectSingleFace(img2, detectorOptions)
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (!face1 || !face2) {
          setStatusMessage("❌ Face not detected in one of images");
          setLoading(false);
          return;
        }

        setStatusMessage("⏳ Comparing faces...");

        const distance = faceapi.euclideanDistance(
          face1.descriptor,
          face2.descriptor
        );

        const similarity = Math.round((1 - distance) * 100);
        const safeSimilarity = Math.max(0, Math.min(100, similarity));

        if (!isMounted) return;

        setMatchPercentage(safeSimilarity);

        // =========================
        // UNIFIED THRESHOLD (50%)
        // =========================
        if (safeSimilarity >= 50) {
          setIsMatched(true);
          setStatusMessage(
            `🎉 Match Success (${safeSimilarity}%)`
          );
        } else {
          setIsMatched(false);
          setStatusMessage(
            `❌ Match Failed (${safeSimilarity}%)`
          );
        }
      } catch (err) {
        console.error("Face Match Error:", err);
        setStatusMessage("❌ AI processing error");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    runFaceMatch();

    return () => {
      isMounted = false;
    };
  }, [idPhoto, selfiePhoto]);

  return (
    <div style={{ padding: 20, textAlign: "center" }}>
      <h3>🤖 Face Match AI</h3>

      <div style={{ display: "flex", justifyContent: "center", gap: 20 }}>
        <img src={idPhoto} alt="ID" width={120} />
        <img src={selfiePhoto} alt="Selfie" width={120} />
      </div>

      <div
        style={{
          marginTop: 15,
          padding: 10,
          background: isMatched ? "#dcfce7" : "#fee2e2",
          borderRadius: 8,
        }}
      >
        {statusMessage}
      </div>

      {matchPercentage !== null && (
        <h2>{matchPercentage}% Match</h2>
      )}

      {!loading && (
        <button
          onClick={() => onSuccess(matchPercentage)}
          style={{
            marginTop: 20,
            padding: "12px 20px",
            background: isMatched ? "green" : "gray",
            color: "white",
            border: "none",
            borderRadius: 8,
          }}
        >
          Continue →
        </button>
      )}
    </div>
  );
}

export default FaceMatch;
