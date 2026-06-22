import React, { useEffect, useState } from "react";
import * as faceapi from "face-api.js";

function FaceMatch({
  registeredPhoto,
  selfiePhoto,
  onSuccess
}) {

  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("⏳ Loading AI...");
  const [matchPercentage, setMatchPercentage] = useState(null);
  const [isMatched, setIsMatched] = useState(false);

  useEffect(() => {

    const runFaceMatch = async () => {

      try {

        console.log("REGISTERED PHOTO =", registeredPhoto);
        console.log("SELFIE PHOTO =", selfiePhoto);

        const MODEL_URL = "/models";

        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);

        const loadImage = (src) =>
          new Promise((resolve, reject) => {

            const img = new Image();

            img.crossOrigin = "anonymous";

            img.onload = () => resolve(img);

            img.onerror = () => {
              console.log("FAILED IMAGE =", src);
              reject();
            };

            img.src = src;
          });

        const img1 = await loadImage(registeredPhoto);
        const img2 = await loadImage(selfiePhoto);

        const detectorOptions =
          new faceapi.TinyFaceDetectorOptions({
            inputSize: 320
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
            "❌ Face not detected"
          );

          setLoading(false);

          return;
        }

        const distance = faceapi.euclideanDistance(
          face1.descriptor,
          face2.descriptor
        );

        const similarity =
          Math.round((1 - distance / 0.6) * 100);

        const percentage =
          Math.max(0, Math.min(100, similarity));

        setMatchPercentage(percentage);

        if (percentage >= 50) {

          setIsMatched(true);

          setStatusMessage(
            `✅ Match successful (${percentage}%)`
          );

          setTimeout(() => {
            onSuccess(percentage);
          }, 1000);

        } else {

          setStatusMessage(
            `❌ Face mismatch (${percentage}%)`
          );

        }

      } catch (err) {

        console.error(err);

        setStatusMessage(
          "❌ Error loading registered image"
        );

      }

      setLoading(false);
    };

    runFaceMatch();

  }, [registeredPhoto, selfiePhoto, onSuccess]);

  return (
    <div style={{ textAlign: "center" }}>

      <h2>🤖 የፊት ማረጋገጫ</h2>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 20
        }}
      >

        <div>
          <p>Registered Photo</p>

          <img
            src={registeredPhoto}
            alt="Registered"
            onError={() =>
              console.log(
                "Broken registered image:",
                registeredPhoto
              )
            }
            style={{
              width: 120,
              height: 120,
              borderRadius: "50%",
              objectFit: "cover"
            }}
          />
        </div>

        <div>
          <p>Selfie Photo</p>

          <img
            src={selfiePhoto}
            alt="Selfie"
            style={{
              width: 120,
              height: 120,
              borderRadius: "50%",
              objectFit: "cover"
            }}
          />
        </div>

      </div>

      <div
        style={{
          marginTop: 20,
          fontWeight: "bold"
        }}
      >
        {statusMessage}
      </div>

      {matchPercentage !== null && (
        <h2>{matchPercentage}% Match</h2>
      )}

    </div>
  );
}

export default FaceMatch;
