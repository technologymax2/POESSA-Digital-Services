import React, { useEffect, useState } from "react";

function FaceMatch({ idPhoto, selfiePhoto, onSuccess }) {
  const [matchPercentage, setMatchPercentage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState(
    "⏳ የAI ሞዴሎችን በመጫን ላይ..."
  );
  const [isMatched, setIsMatched] = useState(false);

  useEffect(() => {
    const runFaceMatch = async () => {
      try {
        if (!window.faceapi) {
          setStatusMessage(
            "❌ የፊት መለያው ስክሪፕት አልተጫነም።"
          );
          setLoading(false);
          return;
        }

        const faceapi = window.faceapi;

        const MODEL_URL =
          "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model";

        setStatusMessage("⏳ የAI ሞዴሎችን በመጫን ላይ...");

        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);

        // ----------------------------
        // helper
        // ----------------------------
        const loadImage = (src) => {
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = src;

            img.onload = () => resolve(img);
            img.onerror = reject;
          });
        };

        setStatusMessage("⏳ ፎቶዎችን በማንበብ ላይ...");

        const img1 = await loadImage(idPhoto);
        const img2 = await loadImage(selfiePhoto);

        setStatusMessage("⏳ የፊት መመሳሰልን በማረጋገጥ ላይ...");

        let detection1 = await faceapi
          .detectSingleFace(
            img1,
            new faceapi.TinyFaceDetectorOptions()
          )
          .withFaceLandmarks()
          .withFaceDescriptor();

        let detection2 = await faceapi
          .detectSingleFace(
            img2,
            new faceapi.TinyFaceDetectorOptions()
          )
          .withFaceLandmarks()
          .withFaceDescriptor();

        // fallback
        if (!detection1) {
          detection1 = await faceapi
            .detectSingleFace(img1)
            .withFaceLandmarks()
            .withFaceDescriptor();
        }

        if (!detection2) {
          detection2 = await faceapi
            .detectSingleFace(img2)
            .withFaceLandmarks()
            .withFaceDescriptor();
        }

        if (!detection1 || !detection2) {
          setStatusMessage(
            "❌ በፎቶዎቹ ላይ ፊት ማግኘት አልተቻለም።"
          );
          setLoading(false);
          return;
        }

        const distance = faceapi.euclideanDistance(
          detection1.descriptor,
          detection2.descriptor
        );

        const similarity = Math.max(
          0,
          Math.min(100, Math.round((1 - distance) * 100))
        );

        setMatchPercentage(similarity);

        if (similarity >= 50) {
          setIsMatched(true);

          setStatusMessage(
            `🎉 ማመሳሰሉ ተሳክቷል! የፊት መመሳሰል ${similarity}%`
          );
        } else {
          setIsMatched(false);

          setStatusMessage(
            `❌ ፎቶዎቹ አልተመሳሰሉም። የመመሳሰል መጠን ${similarity}%`
          );
        }
      } catch (err) {
        console.error("Face Match Error:", err);

        setStatusMessage(
          "❌ በፊት ማነፃፀሪያው ላይ ስህተት ተፈጥሯል።"
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
      <h3>🤖 ደረጃ 3፦ የፊት ማነፃፀሪያ</h3>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "20px",
          margin: "20px 0"
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
              borderRadius: "8px"
            }}
          />
          <p>የመታወቂያ ፎቶ</p>
        </div>

        <div>
          <img
            src={selfiePhoto}
            alt="Selfie"
            style={{
              width: "120px",
              height: "130px",
              objectFit: "cover",
              borderRadius: "8px"
            }}
          />
          <p>የአሁኑ ሴልፊ</p>
        </div>
      </div>

      <div
        style={{
          marginTop: "20px",
          padding: "15px",
          borderRadius: "10px",
          background: isMatched ? "#ecfdf5" : "#fef2f2"
        }}
      >
        {statusMessage}
      </div>

      {matchPercentage !== null && (
        <h2 style={{ marginTop: "20px" }}>
          {matchPercentage}%
        </h2>
      )}

      {!loading && isMatched && (
        <button
          onClick={() => onSuccess(matchPercentage)}
          style={{
            marginTop: "20px",
            background: "#16a34a",
            color: "#fff",
            border: "none",
            padding: "14px 25px",
            borderRadius: "8px",
            cursor: "pointer"
          }}
        >
          ደረጃ 4 ይቀጥሉ →
        </button>
      )}

      {!loading && !isMatched && (
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: "20px",
            background: "#dc2626",
            color: "#fff",
            border: "none",
            padding: "14px 25px",
            borderRadius: "8px",
            cursor: "pointer"
          }}
        >
          🔄 እንደገና ይሞክሩ
        </button>
      )}
    </div>
  );
}

export default FaceMatch;
