import React, { useEffect, useState } from "react";

function FaceMatch({ idPhoto, selfiePhoto, onSuccess }) {
  const [matchPercentage, setMatchPercentage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState(
    "⏳ AI በመጀመር ላይ..."
  );
  const [isMatched, setIsMatched] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const runFaceMatch = async () => {
      try {
        const faceapi = window.faceapi;

        if (!faceapi) {
          setStatusMessage("❌ face-api.js አልተጫነም (script missing)");
          setLoading(false);
          return;
        }

        const MODEL_URL =
          "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model";

        setStatusMessage("⏳ AI ሞዴሎች በመጫን ላይ...");

        // Load models ONLY ONCE safely
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

        setStatusMessage("⏳ ፎቶዎች በመተንተን ላይ...");

        const [img1, img2] = await Promise.all([
          loadImage(idPhoto),
          loadImage(selfiePhoto),
        ]);

        const detectorOptions = new faceapi.TinyFaceDetectorOptions({
          inputSize: 224,
          scoreThreshold: 0.5,
        });

        setStatusMessage("⏳ ፊት በመፈለግ ላይ...");

        let face1 = await faceapi
          .detectSingleFace(img1, detectorOptions)
          .withFaceLandmarks()
          .withFaceDescriptor();

        let face2 = await faceapi
          .detectSingleFace(img2, detectorOptions)
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (!face1 || !face2) {
          setStatusMessage("❌ በፎቶዎቹ ላይ ፊት አልተገኘም");
          setLoading(false);
          return;
        }

        setStatusMessage("⏳ መመሳሰል በማረጋገጥ ላይ...");

        const distance = faceapi.euclideanDistance(
          face1.descriptor,
          face2.descriptor
        );

        const similarity = Math.round((1 - distance) * 100);

        const safeSimilarity = Math.max(0, Math.min(100, similarity));

        if (!isMounted) return;

        setMatchPercentage(safeSimilarity);

        if (safeSimilarity >= 60) {
          setIsMatched(true);
          setStatusMessage(
            `🎉 ተሳክቷል! መመሳሰል ${safeSimilarity}%`
          );
        } else {
          setIsMatched(false);
          setStatusMessage(
            `❌ አልተመሳሰሉም (${safeSimilarity}%)`
          );
        }
      } catch (err) {
        console.error("Face Match Error:", err);
        setStatusMessage("❌ AI ስህተት ተፈጥሯል");
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
    <div
      style={{
        padding: "20px",
        maxWidth: "450px",
        margin: "0 auto",
        textAlign: "center",
      }}
    >
      <h3>🤖 Face Matching System</h3>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "20px",
          margin: "20px 0",
        }}
      >
        <div>
          <img
            src={idPhoto}
            alt="ID"
            style={{
              width: "120px",
              height: "130px",
              objectFit: "cover",
              borderRadius: "8px",
            }}
          />
          <p>ID Photo</p>
        </div>

        <div>
          <img
            src={selfiePhoto}
            alt="Selfie"
            style={{
              width: "120px",
              height: "130px",
              objectFit: "cover",
              borderRadius: "8px",
            }}
          />
          <p>Selfie</p>
        </div>
      </div>

      <div
        style={{
          padding: "15px",
          borderRadius: "10px",
          background: isMatched ? "#dcfce7" : "#fee2e2",
        }}
      >
        {statusMessage}
      </div>

      {matchPercentage !== null && (
        <h2 style={{ marginTop: "15px" }}>
          {matchPercentage}% Match
        </h2>
      )}

      {!loading && isMatched && (
        <button
          onClick={() => onSuccess(matchPercentage)}
          style={{
            marginTop: "20px",
            background: "#16a34a",
            color: "#fff",
            padding: "14px 25px",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Continue →
        </button>
      )}

      {!loading && !isMatched && (
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: "20px",
            background: "#dc2626",
            color: "#fff",
            padding: "14px 25px",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Retry
        </button>
      )}
    </div>
  );
}

export default FaceMatch;
