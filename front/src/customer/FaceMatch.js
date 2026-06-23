import React, { useEffect, { useState } } from "react";

let modelsLoaded = false;

function FaceMatch({
  idPhoto,
  registeredPhoto,
  selfiePhoto,
  onSuccess,
}) {
  const [matchPercentage, setMatchPercentage] = useState(null);
  const [statusMessage, setStatusMessage] = useState("⏳ Starting AI...");
  const [loading, setLoading] = useState(true);
  const [isMatched, setIsMatched] = useState(false);

  const actualPhoto = idPhoto || registeredPhoto;

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      try {
        const faceapi = window.faceapi;

        console.log("ID PHOTO =", actualPhoto);
        console.log("SELFIE PHOTO =", selfiePhoto);

        if (!faceapi) {
          setStatusMessage("❌ face-api.js not loaded");
          return;
        }

        if (!actualPhoto || !selfiePhoto) {
          setStatusMessage("❌ Missing images");
          return;
        }

        const MODEL_URL = "/models";

        setStatusMessage("⏳ Loading AI models...");

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
            const img = new Image();

            img.crossOrigin = "anonymous";

            img.onload = () => resolve(img);

            img.onerror = () =>
              reject(new Error(`Failed to load image: ${src}`));

            img.src = src;
          });

        setStatusMessage("⏳ Loading images...");

        const [img1, img2] = await Promise.all([
          loadImage(actualPhoto),
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

        if (!face1) {
          setStatusMessage("❌ No face found in ID photo");
          return;
        }

        if (!face2) {
          setStatusMessage("❌ No face found in selfie");
          return;
        }

        setStatusMessage("⏳ Comparing faces...");

        const distance = faceapi.euclideanDistance(
          face1.descriptor,
          face2.descriptor
        );

        console.log("Face Distance =", distance);

        const similarity = Math.max(
          0,
          Math.min(
            100,
            Math.round((1 - distance / 0.6) * 100)
          )
        );

        if (!mounted) return;

        setMatchPercentage(similarity);

        if (distance < 0.6) {
          setIsMatched(true);

          setStatusMessage(
            `✅ Face Match Success (${similarity}%)`
          );

          setTimeout(() => {
            if (onSuccess) {
              onSuccess(similarity);
            }
          }, 1000);
        } else {
          setIsMatched(false);

          setStatusMessage(
            `❌ Face Match Failed (${similarity}%)`
          );
        }
      } catch (error) {
        console.error("Face Match Error:", error);

        setStatusMessage(
          "❌ Error while comparing faces"
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    run();

    return () => {
      mounted = false;
    };
  }, [actualPhoto, selfiePhoto, onSuccess]);

  return (
    <div
      style={{
        padding: "20px",
        textAlign: "center",
      }}
    >
      <h2>🤖 Face Verification</h2>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "20px",
          marginTop: "20px",
        }}
      >
        <div>
          <p>ID Photo</p>

          <img
            src={actualPhoto}
            alt="ID"
            style={{
              width: "140px",
              height: "140px",
              objectFit: "cover",
              borderRadius: "10px",
              border: "2px solid #ddd",
            }}
          />
        </div>

        <div>
          <p>Selfie</p>

          <img
            src={selfiePhoto}
            alt="Selfie"
            style={{
              width: "140px",
              height: "140px",
              objectFit: "cover",
              borderRadius: "10px",
              border: "2px solid #ddd",
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
        <h1
          style={{
            marginTop: "15px",
          }}
        >
          {matchPercentage}% Match
        </h1>
      )}

      {!loading && !isMatched && (
        <button
          style={{
            marginTop: "15px",
            padding: "10px 20px",
            cursor: "pointer",
          }}
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      )}
    </div>
  );
}

export default FaceMatch;
