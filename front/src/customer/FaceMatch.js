import React, { useEffect, useState } from "react";

function FaceMatch({ idPhoto, selfiePhoto, onSuccess }) {
  const [loading, setLoading] = useState(true);
  const [isMatched, setIsMatched] = useState(false);
  const [matchPercentage, setMatchPercentage] = useState(0);
  const [statusMessage, setStatusMessage] = useState(
    "⏳ የAI ሞዴሎችን በመጫን ላይ..."
  );

  useEffect(() => {
    const runFaceMatch = async () => {
      try {
        if (!window.faceapi) {
          setStatusMessage("❌ face-api.js አልተጫነም");
          setLoading(false);
          return;
        }

        const faceapi = window.faceapi;

        const MODEL_URL =
          "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model";

        // models
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);

        setStatusMessage("⏳ ፎቶዎችን በመጫን ላይ...");

        const loadImage = src =>
          new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = src;

            img.onload = () => resolve(img);
            img.onerror = reject;
          });

        const img1 = await loadImage(idPhoto);
        const img2 = await loadImage(selfiePhoto);

        setStatusMessage("⏳ ፊቶችን በማግኘት ላይ...");

        const detection1 = await faceapi
          .detectSingleFace(
            img1,
            new faceapi.TinyFaceDetectorOptions()
          )
          .withFaceLandmarks()
          .withFaceDescriptor();

        const detection2 = await faceapi
          .detectSingleFace(
            img2,
            new faceapi.TinyFaceDetectorOptions()
          )
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (!detection1 || !detection2) {
          setStatusMessage(
            "❌ በአንዱ ወይም በሁለቱም ፎቶዎች ላይ ፊት አልተገኘም።"
          );
          setLoading(false);
          return;
        }

        setStatusMessage("⏳ ማነፃፀር በመካሄድ ላይ...");

        const distance = faceapi.euclideanDistance(
          detection1.descriptor,
          detection2.descriptor
        );

        const similarity = Math.round((1 - distance) * 100);

        setMatchPercentage(similarity);

        if (similarity >= 50) {
          setIsMatched(true);

          setStatusMessage(
            `✅ ፊቶቹ ተመሳስለዋል (${similarity}%)`
          );
        } else {
          setIsMatched(false);

          setStatusMessage(
            `❌ ፊቶቹ አልተመሳሰሉም (${similarity}%)`
          );
        }
      } catch (err) {
        console.error(err);

        setStatusMessage(
          "❌ Face Match ስህተት ተፈጥሯል።"
        );
      } finally {
        setLoading(false);
      }
    };

    runFaceMatch();
  }, [idPhoto, selfiePhoto]);

  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "450px",
        margin: "0 auto",
        textAlign: "center"
      }}
    >
      <h3>🤖 የፊት ማነፃፀሪያ</h3>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "20px"
        }}
      >
        <img
          src={idPhoto}
          alt=""
          style={{
            width: "120px",
            height: "130px",
            objectFit: "cover"
          }}
        />

        <img
          src={selfiePhoto}
          alt=""
          style={{
            width: "120px",
            height: "130px",
            objectFit: "cover"
          }}
        />
      </div>

      <div
        style={{
          marginTop: "20px",
          padding: "15px",
          borderRadius: "10px",
          background: loading
            ? "#f8fafc"
            : isMatched
            ? "#dcfce7"
            : "#fee2e2"
        }}
      >
        {statusMessage}

        {!loading && (
          <div style={{ marginTop: "10px" }}>
            Match: {matchPercentage}%
          </div>
        )}
      </div>

      {!loading && isMatched && (
        <button
          onClick={() =>
            onSuccess({
              faceMatched: true,
              matchPercentage
            })
          }
          style={{
            marginTop: "20px",
            width: "100%",
            padding: "14px",
            background: "#22c55e",
            color: "#fff",
            border: "none",
            borderRadius: "8px"
          }}
        >
          ወደ Liveness Test →
        </button>
      )}
    </div>
  );
}

export default FaceMatch;
