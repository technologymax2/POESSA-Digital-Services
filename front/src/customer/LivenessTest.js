import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

function LivenessTest({ faydaNumber, onSuccess }) {
  const videoRef = useRef(null);

  const [instruction, setInstruction] = useState("😊 Face the camera");
  const [statusMessage, setStatusMessage] = useState("⏳ Loading...");
  const [checks, setChecks] = useState({
    smilePassed: false,
    nodPassed: false,
    turnPassed: false,
  });

  useEffect(() => {
    let stream;
    let intervalId;
    let lastNoseY = null;

    const MODEL_URL = process.env.PUBLIC_URL + "/models";

    const start = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ]);

        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });

        videoRef.current.srcObject = stream;

        setStatusMessage("🟢 Active");
        setInstruction("😊 Please SMILE");

        const options = new faceapi.TinyFaceDetectorOptions({
          inputSize: 224,
          scoreThreshold: 0.5,
        });

        intervalId = setInterval(async () => {
          if (!videoRef.current) return;

          const detection = await faceapi
            .detectSingleFace(videoRef.current, options)
            .withFaceLandmarks()
            .withFaceExpressions();

          if (!detection) return;

          const exp = detection.expressions;
          const nose = detection.landmarks.getNose()[0];

          // ✅ SMILE
          if (!checks.smilePassed && exp.happy > 0.6) {
            setChecks((p) => ({ ...p, smilePassed: true }));
            setInstruction("🔽 Nod your head");
          }

          // ✅ NOD (real movement)
          if (checks.smilePassed && !checks.nodPassed && nose) {
            if (lastNoseY !== null) {
              const movement = Math.abs(nose.y - lastNoseY);

              if (movement > 6) {
                setChecks((p) => ({ ...p, nodPassed: true }));
                setInstruction("↔️ Turn your head");
              }
            }
            lastNoseY = nose.y;
          }

          // ✅ TURN (simple eye ratio)
          if (checks.nodPassed && !checks.turnPassed) {
            const leftEye = detection.landmarks.getLeftEye()[0];
            const rightEye = detection.landmarks.getRightEye()[0];

            if (leftEye && rightEye && nose) {
              const ratio =
                Math.abs(nose.x - leftEye.x) /
                Math.abs(rightEye.x - nose.x || 1);

              if (ratio < 0.6 || ratio > 1.4) {
                setChecks((p) => ({ ...p, turnPassed: true }));
                setStatusMessage("✅ Done");

                clearInterval(intervalId);
                stream.getTracks().forEach((t) => t.stop());

                onSuccess({
                  smilePassed: true,
                  nodPassed: true,
                  turnPassed: true,
                  passed: true,
                });
              }
            }
          }
        }, 400);
      } catch (err) {
        console.error(err);
        setStatusMessage("❌ Camera error");
      }
    };

    start();

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div style={{ textAlign: "center" }}>
      <h2>🎯 Liveness Test</h2>

      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{ width: 300, height: 300, borderRadius: 10 }}
      />

      <p>{instruction}</p>
      <p>{statusMessage}</p>

      <p>Smile: {checks.smilePassed ? "✔" : "✖"}</p>
      <p>Nod: {checks.nodPassed ? "✔" : "✖"}</p>
      <p>Turn: {checks.turnPassed ? "✔" : "✖"}</p>
    </div>
  );
}

export default LivenessTest;
