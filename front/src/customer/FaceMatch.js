import React, { useEffect, useState } from "react";
import * as faceapi from "face-api.js";

function FaceMatch({ registeredPhoto, selfiePhoto, onSuccess }) {
  const [matchPercentage, setMatchPercentage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState(
    "⏳ AI ሞዴሎችን በመጫን ላይ..."
  );
  const [isMatched, setIsMatched] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const runFaceMatch = async () => {
      try {
        setStatusMessage("⏳ AI ሞዴሎችን በመጫን ላይ...");

        const MODEL_URL = "/models";

        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);

        const loadImage = (src) =>
          new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = src;
            img.onload = () => resolve(img);
            img.onerror = reject;
          });

        setStatusMessage("⏳ ምስሎችን በማዘጋጀት ላይ...");

        const [img1, img2] = await Promise.all([
          loadImage(registeredPhoto), // image stored in database
          loadImage(selfiePhoto), // selfie image
        ]);

        setStatusMessage("⏳ ፊቶችን በመለየት ላይ...");

        const detectorOptions = new faceapi.TinyFaceDetectorOptions({
          inputSize: 320,
          scoreThreshold: 0.5,
        });

        const face1 = await faceapi
          .detectSingleFace(img1, detectorOptions)
          .withFaceLandmarks()
          .withFaceDescriptor();

        const face2 = await faceapi
          .detectSingleFace(img2, detectorOptions)
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (!face1 || !face2) {
          setStatusMessage(
            "❌ ፊት አልተገኘም! እባክዎ ጥርት ያለ ፎቶ ይጠቀሙ።"
          );
          setLoading(false);
          return;
        }

        const distance = faceapi.euclideanDistance(
          face1.descriptor,
          face2.descriptor
        );

        const similarity = Math.round((1 - distance / 0.6) * 100);
        const safeSimilarity = Math.max(0, Math.min(100, similarity));

        if (!isMounted) return;

        setMatchPercentage(safeSimilarity);

        if (safeSimilarity >= 75) {
          setIsMatched(true);

          setStatusMessage(
            `🎉 ማረጋገጫ ተሳክቷል! (${safeSimilarity}%)`
          );

          setTimeout(() => {
            onSuccess(safeSimilarity);
          }, 1500);
        } else {
          setIsMatched(false);

          setStatusMessage(
            `❌ ፊቱ አይመሳሰልም! (${safeSimilarity}%)`
          );
        }
      } catch (err) {
        console.error("Face Match Error:", err);

        setStatusMessage(
          "❌ የ AI ስህተት ተፈጥሯል፤ እባክዎ እንደገና ይሞክሩ።"
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    runFaceMatch();

    return () => {
      isMounted = false;
    };
  }, [registeredPhoto, selfiePhoto, onSuccess]);

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h3>🤖 የፊት ማረጋገጫ</h3>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "20px",
          marginTop: "20px",
        }}
      >
        <div>
          <p>Registered Photo</p>
          <img
            src={registeredPhoto}
            alt="Registered"
            style={{
              width: "120px",
              height: "120px",
              borderRadius: "50%",
              objectFit: "cover",
            }}
          />
        </div>

        <div>
          <p>Selfie Photo</p>
          <img
            src={selfiePhoto}
            alt="Selfie"
            style={{
              width: "120px",
              height: "120px",
              borderRadius: "50%",
              objectFit: "cover",
            }}
          />
        </div>
      </div>

      <div
        style={{
          marginTop: "20px",
          fontWeight: "bold",
          fontSize: "18px",
        }}
      >
        {statusMessage}
      </div>

      {matchPercentage !== null && (
        <h2>{matchPercentage}% Match</h2>
      )}

      {!loading && !isMatched && (
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: "10px 20px",
            cursor: "pointer",
          }}
        >
          🔄 እንደገና ይሞክሩ
        </button>
      )}
    </div>
  );
}

export default FaceMatch;
