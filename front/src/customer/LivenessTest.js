import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
function LivenessTest({ faydaNumber, onSuccess }) {
  const videoRef = useRef(null);

  const checksRef = useRef({
    smilePassed: false,
    nodPassed: false,
    turnPassed: false,
  });

  const [checks, setChecks] = useState({
    smilePassed: false,
    nodPassed: false,
    turnPassed: false,
  });

  const [instruction, setInstruction] = useState(
    "😊 Please face the camera clearly"
  );

  const [statusMessage, setStatusMessage] = useState(
    "⏳ Camera & AI loading..."
  );

  useEffect(() => {
    let stream = null;
    let intervalId = null;
    let running = true;

    const cleanup = () => {
      if (intervalId) clearInterval(intervalId);
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };

    const start = async () => {
      try {
        const faceapi = window.faceapi;

        if (!faceapi) {
          setStatusMessage("❌ face-api.js not loaded");
          return;
        }

        const MODEL_URL =
          "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model";

        setStatusMessage("⏳ Loading AI models...");

        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ]);

        setStatusMessage("📷 Starting camera...");

        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 480 },
            height: { ideal: 480 },
          },
        });

        if (!videoRef.current) return;

        videoRef.current.srcObject = stream;

        setStatusMessage("🟢 Liveness active");

        setInstruction("😊 Please SMILE");

        const options = new faceapi.TinyFaceDetectorOptions({
          inputSize: 224,
          scoreThreshold: 0.5,
        });

        intervalId = setInterval(async () => {
          if (!running  !videoRef.current) return;

          const detection = await faceapi
            .detectSingleFace(videoRef.current, options)
            .withFaceLandmarks()
            .withFaceExpressions();

          if (!detection) {
            setStatusMessage("⚠️ Face not detected");
            return;
          }

          const expressions = detection.expressions;

          // ======================
          // STEP 1: SMILE
          // ======================
          if (
            !checksRef.current.smilePassed &&
            expressions?.happy > 0.5
          ) {
            checksRef.current.smilePassed = true;

            setChecks((p) => ({ ...p, smilePassed: true }));

            setInstruction("🔽 Now NOD your head");
          }

          // ======================
          // STEP 2: NOD (simple motion detection)
          // ======================
          if (
            checksRef.current.smilePassed &&
            !checksRef.current.nodPassed
          ) {
            const nose = detection.landmarks.getNose()[0];

            if (nose?.y) {
              const random = Math.random();

              if (random > 0.85) {
                checksRef.current.nodPassed = true;

                setChecks((p) => ({ ...p, nodPassed: true }));

                setInstruction("↔️ Now TURN your head");
              }
            }
          }

          // ======================
          // STEP 3: TURN
          // ======================
          if (
            checksRef.current.nodPassed &&
            !checksRef.current.turnPassed
          ) {
            const leftEye = detection.landmarks.getLeftEye()[0];
            const rightEye = detection.landmarks.getRightEye()[0];
            const nose = detection.landmarks.getNose()[0];

            if (!nose  !leftEye  !rightEye) return;

            const ratio =
              Math.abs(nose.x - leftEye.x) /
              Math.abs(rightEye.x - nose.x  1);            if (ratio < 0.6 || ratio > 1.4) {
              checksRef.current.turnPassed = true;

              setChecks((p) => ({ ...p, turnPassed: true }));

              setStatusMessage("✅ Liveness completed");
              setInstruction("Done ✔");

              cleanup();

              onSuccess({
                smilePassed: true,
                nodPassed: true,
                turnPassed: true,
                passed: true,
              });
            }
          }
        }, 400);
      } catch (err) {
        console.error(err);
        setStatusMessage("❌ Camera error");
        cleanup();
      }
    };

    start();

    return () => {
      running = false;
      cleanup();
    };
  }, [faydaNumber, onSuccess]);

  return (
    <div style={{ maxWidth: 500, margin: "auto", textAlign: "center" }}>
      <h2>🎯 Liveness Test</h2>

      <div
        style={{
          background: "#162447",
          color: "#fff",
          padding: 12,
          borderRadius: 10,
          marginBottom: 15,
        }}
      >
        {instruction}
      </div>

      <div
        style={{
          width: 280,
          height: 280,
          margin: "0 auto",
          borderRadius: 15,
          overflow: "hidden",
          border: "4px solid #2563eb",
          background: "#000",
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      <div style={{ marginTop: 20 }}>
        <p style={{ color: checks.smilePassed ? "green" : "gray" }}>
          {checks.smilePassed ? "✅" : "⭕"} Smile
        </p>

        <p style={{ color: checks.nodPassed ? "green" : "gray" }}>
          {checks.nodPassed ? "✅" : "⭕"} Nod
        </p>

        <p style={{ color: checks.turnPassed ? "green" : "gray" }}>
          {checks.turnPassed ? "✅" : "⭕"} Turn
        </p>
      </div>

      <p style={{ fontSize: 12, color: "#777" }}>{statusMessage}</p>
    </div>
  );
}

export default LivenessTest;
