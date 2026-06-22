import React, { useEffect, useState } from "react";
import * as faceapi from "face-api.js";

function FaceMatch({ registeredPhoto, selfiePhoto, onSuccess }) {
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("⏳ Loading AI models...");
  const [matchPercentage, setMatchPercentage] = useState(null);

  useEffect(() => {
    let mounted = true;

    const runFaceMatch = async () => {
      try {
        setLoading(true);
        setMatchPercentage(null);

        console.log("REGISTERED =", registeredPhoto);
        console.log("SELFIE =", selfiePhoto);

        if (!registeredPhoto || !selfiePhoto) {
          setStatusMessage("❌ Missing images");
          setLoading(false);
          return;
        }

        // ======================
        // LOAD MODELS
        // ======================
        const MODEL_URL = "/models";

        setStatusMessage("⏳ Loading AI models...");

        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);

        // ======================
        // LOAD IMAGE SAFE
        // ======================
        const loadImage = (src) =>
          new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";

            img.onload = () => resolve(img);
            img.onerror = () => {
              console.log("IMAGE LOAD FAILED:", src);
              reject(new Error("Image load failed"));
            };

            img.src = src;
          });

        setStatusMessage("⏳ Loading images...");

        const img1 = await loadImage(registeredPhoto);
        const img2 = await loadImage(selfiePhoto);

        // ======================
        // DETECTION OPTIONS
        // ======================
        const options = new faceapi.TinyFaceDetectorOptions({
          inputSize: 320,
          scoreThreshold: 0.5,
        });

        setStatusMessage("⏳ Detecting faces...");

        // ======================
        // DETECT FACE 1
        // ======================
        const result1 = await faceapi
          .detectSingleFace(img1, options)
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (!result1) {
          setStatusMessage("❌ No face detected in REGISTERED photo");
          setLoading(false);
          return;
        }

        // ======================
        // DETECT FACE 2
        // ======================
        const result2 = await faceapi
          .detectSingleFace(img2, options)
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (!result2) {
          setStatusMessage("❌ No face detected in SELFIE photo");
          setLoading(false);
          return;
        }

        // ======================
        // COMPARE FACES
        // ======================
        const distance = faceapi.euclideanDistance(
          result1.descriptor,
          result2.descriptor
        );

        console.log("Distance =", distance);

        let similarity = (1 - distance / 0.6) * 100;

        similarity = Math.max(0, Math.min(100, Math.round(similarity)));

        if (!mounted) return;

        setMatchPercentage(similarity);

        // ======================
        // RESULT
        // ======================
        if (similarity >= 50) {
          setStatusMessage(`✅ Match Successful (${similarity}%)`);

          setTimeout(() => {
            if (mounted) onSuccess(similarity);
          }, 1000);
        } else {
          setStatusMessage(`❌ Face Mismatch (${similarity}%)`);
        }
      } catch (err) {
        console.error("FACE MATCH ERROR:", err);
        setStatusMessage("❌ Error while comparing faces");
      }

      setLoading(false);
    };

    runFaceMatch();

    return () => {
      mounted = false;
    };
  }, [registeredPhoto, selfiePhoto, onSuccess]);

  return (
    <div style={{ padding: 20, textAlign: "center" }}>
      <h2>🤖 Face Verification</h2>

      <div style={{ display: "flex", justifyContent: "center", gap: 30 }}>
        <div>
          <h4>Registered Photo</h4>
          <img
            src={registeredPhoto}
            alt="registered"
            style={{
              width: 140,
              height: 140,
              borderRadius: "50%",
              objectFit: "cover",
            }}
          />
        </div>

        <div>
          <h4>Selfie</h4>
          <img
            src={selfiePhoto}
            alt="selfie"
            style={{
              width: 140,
              height: 140,
              borderRadius: "50%",
              objectFit: "cover",
            }}
          />
        </div>
      </div>

      <div style={{ marginTop: 20, fontWeight: "bold" }}>
        {statusMessage}
      </div>

      {matchPercentage !== null && (
        <h2>{matchPercentage}% Match</h2>
      )}

      {loading && <p>Processing...</p>}
    </div>
  );
}

export default FaceMatch;
