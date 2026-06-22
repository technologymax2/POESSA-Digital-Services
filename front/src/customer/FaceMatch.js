import React, { useEffect, useState } from "react";

function FaceMatch({ registeredPhoto, selfiePhoto, onSuccess }) {
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("⏳ Loading AI...");
  const [matchPercentage, setMatchPercentage] = useState(null);

  useEffect(() => {
    let mounted = true;

    const runFaceMatch = async () => {
      try {
        const faceapi = window.faceapi;

        if (!faceapi) {
          setStatusMessage("❌ face-api.js not loaded");
          return;
        }

        const MODEL_URL = "/models";

        setStatusMessage("⏳ Loading models...");

        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);

        const loadImage = (src) =>
          new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
          });

        setStatusMessage("⏳ Loading images...");

        const img1 = await loadImage(registeredPhoto);
        const img2 = await loadImage(selfiePhoto);

        setStatusMessage("⏳ Detecting faces...");

        const options = new faceapi.TinyFaceDetectorOptions({
          inputSize: 320,
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
          setLoading(false);
          return;
        }

        const distance = faceapi.euclideanDistance(
          face1.descriptor,
          face2.descriptor
        );

        let similarity = (1 - distance) * 100;
        similarity = Math.max(0, Math.min(100, Math.round(similarity)));

        if (!mounted) return;

        setMatchPercentage(similarity);

        if (similarity >= 50) {
          setStatusMessage(`✅ Match Successful (${similarity}%)`);
          setTimeout(() => onSuccess(similarity), 1000);
        } else {
          setStatusMessage(`❌ Face Mismatch (${similarity}%)`);
        }
      } catch (err) {
        console.error(err);
        setStatusMessage("❌ Error while comparing faces");
      }

      setLoading(false);
    };

    runFaceMatch();

    return () => {
      mounted = false;
    };
  }, [registeredPhoto, selfiePhoto]);

  return (
    <div style={{ padding: 20, textAlign: "center" }}>
      <h2>🤖 Face Verification</h2>

      <div style={{ display: "flex", justifyContent: "center", gap: 30 }}>
        <div>
          <h4>Registered</h4>
          <img
            src={registeredPhoto}
            style={{ width: 140, height: 140, borderRadius: "50%" }}
          />
        </div>

        <div>
          <h4>Selfie</h4>
          <img
            src={selfiePhoto}
            style={{ width: 140, height: 140, borderRadius: "50%" }}
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
