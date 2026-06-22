import React, { useEffect, useRef, useState } from "react";

function LivenessTest({ faydaNumber, onSuccess }) {
  const videoRef = useRef(null);

  const checksRef = useRef({
    smilePassed: false,
    movePassed: false,
  });

  const [checks, setChecks] = useState({
    smilePassed: false,
    movePassed: false,
  });

  const [statusMessage, setStatusMessage] = useState(
    "⏳ Camera & AI loading..."
  );

  const [instruction, setInstruction] = useState(
    "😊 Please face the camera clearly"
  );

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let stream = null;
    let intervalId = null;
    let running = true;

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

        setLoading(false);

        setStatusMessage("🟢 Liveness test active");

        setInstruction("😊 Please smile");

        const options = new faceapi.TinyFaceDetectorOptions({
          inputSize: 224,
          scoreThreshold: 0.5,
        });

        intervalId = setInterval(async () => {
          if (!running || !videoRef.current) return;

          const detection = await faceapi
            .detectSingleFace(videoRef.current, options)
            .withFaceLandmarks()
            .withFaceExpressions();

          if (!detection) {
            setStatusMessage("⚠️ Face not detected");
            return;
          }

          // ======================
          // SMILE CHECK
          // ======================
          if (
            !checksRef.current.smilePassed &&
            detection.expressions?.happy > 0.35
          ) {
            checksRef.current.smilePassed = true;

            setChecks((p) => ({ ...p, smilePassed: true }));

            setInstruction("↔️ Now turn your head left/right");
          }

          // ======================
          // HEAD MOVEMENT CHECK
          // ======================
          if (
            checksRef.current.smilePassed &&
            !checksRef.current.movePassed
          ) {
            const landmarks = detection.landmarks;

            const nose = landmarks.getNose()[0];
            const leftEye = landmarks.getLeftEye()[0];
            const rightEye = landmarks.getRightEye()[0];

            if (!nose || !leftEye || !rightEye) return;

            const leftDist = Math.abs(nose.x - leftEye.x);
            const rightDist = Math.abs(rightEye.x - nose.x);

            const ratio = leftDist / (rightDist || 1);

            // movement detected
            if (ratio < 0.6 || ratio > 1.4) {
              checksRef.current.movePassed = true;

              setChecks((p) => ({ ...p, movePassed: true }));

              setStatusMessage("✅ Liveness verified");

              setInstruction("Completed");

              clearInterval(intervalId);

              if (stream) {
                stream.getTracks().forEach((t) => t.stop());
              }

              onSuccess({
                smilePassed: true,
                movePassed: true,
              });
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
      running = false;

      if (intervalId) clearInterval(intervalId);

      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [faydaNumber, onSuccess]);

  return (
    <div
      style={{
        maxWidth: "500px",
        margin: "auto",
        textAlign: "center",
        padding: "20px",
      }}
    >
      <h2>🎯 Liveness Verification</h2>

      <div
        style={{
          background: "#162447",
          color: "#fff",
          padding: "12px",
          borderRadius: "10px",
          marginBottom: "15px",
        }}
      >
        {instruction}
      </div>

      <div
        style={{
          width: "280px",
          height: "280px",
          margin: "0 auto",
          borderRadius: "15px",
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
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </div>

      <div style={{ marginTop: "20px" }}>
        <p style={{ color: checks.smilePassed ? "green" : "gray" }}>
          {checks.smilePassed ? "✅" : "⭕"} Smile check
        </p>

        <p style={{ color: checks.movePassed ? "green" : "gray" }}>
          {checks.movePassed ? "✅" : "⭕"} Movement check
        </p>
      </div>

      <p style={{ marginTop: "15px", fontSize: "12px", color: "#777" }}>
        {statusMessage}
      </p>
    </div>
  );
}

export default LivenessTest;
