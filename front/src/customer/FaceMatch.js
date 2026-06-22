import React, { useEffect, useState } from "react";
import * as faceapi from "face-api.js";

function FaceMatch({ registeredPhoto, selfiePhoto, onSuccess }) {
  const [status, setStatus] = useState("⏳ Loading...");
  const [match, setMatch] = useState(null);

  useEffect(() => {
    let mounted = true;

    const MODEL_URL = process.env.PUBLIC_URL + "/models";

    const run = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);

        const img1 = await faceapi.fetchImage(registeredPhoto);
        const img2 = await faceapi.fetchImage(selfiePhoto);

        const options = new faceapi.TinyFaceDetectorOptions({
          inputSize: 224,
          scoreThreshold: 0.5,
        });

        const result1 = await faceapi
          .detectSingleFace(img1, options)
          .withFaceLandmarks()
          .withFaceDescriptor();

        const result2 = await faceapi
          .detectSingleFace(img2, options)
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (!result1 || !result2) {
          setStatus("❌ Face not detected");
          return;
        }

        const distance = faceapi.euclideanDistance(
          result1.descriptor,
          result2.descriptor
        );

        const similarity = Math.max(
          0,
          Math.min(100, Math.round((1 - distance) * 100))
        );

        if (!mounted) return;

        setMatch(similarity);

        if (distance < 0.5) {
          setStatus(`✅ Match ${similarity}%`);
          onSuccess(similarity);
        } else {
          setStatus(`❌ No match ${similarity}%`);
        }
      } catch (err) {
        console.error(err);
        setStatus("❌ Error comparing faces");
      }
    };

    run();

    return () => {
      mounted = false;
    };
  }, [registeredPhoto, selfiePhoto]);

  return (
    <div style={{ textAlign: "center" }}>
      <h2>🤖 Face Match</h2>
      <p>{status}</p>
      {match !== null && <h3>{match}%</h3>}
    </div>
  );
}

export default FaceMatch;
