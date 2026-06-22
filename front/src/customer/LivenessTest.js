import React, { useEffect, useRef, useState } from "react";

function LivenessTest({ faydaNumber, onSuccess }) {
  const videoRef = useRef(null);

  const checksRef = useRef({
    smilePassed: false,
    nodPassed: false
  });

  const [loading, setLoading] = useState(true);

  const [statusMessage, setStatusMessage] = useState(
    "⏳ ካሜራውን እና AI ሞዴሉን በማዘጋጀት ላይ..."
  );

  const [currentInstruction, setCurrentInstruction] = useState(
    "😊 እባክዎ ፊትዎን በግልጽ ያሳዩ"
  );

  const [checks, setChecks] = useState({
    smilePassed: false,
    nodPassed: false
  });

  useEffect(() => {
    let stream = null;
    let intervalId = null;

    const startLiveness = async () => {
      try {
        if (!window.faceapi) {
          setStatusMessage(
            "❌ face-api script አልተጫነም!"
          );
          return;
        }

        const faceapi = window.faceapi;

        const MODEL_URL =
          "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model";

        // load models
        await faceapi.nets.tinyFaceDetector.loadFromUri(
          MODEL_URL
        );

        await faceapi.nets.faceLandmark68Net.loadFromUri(
          MODEL_URL
        );

        await faceapi.nets.faceExpressionNet.loadFromUri(
          MODEL_URL
        );

        // open camera
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 480 },
            height: { ideal: 480 }
          }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        setLoading(false);

        setStatusMessage(
          "🟢 የህያውነት ፈተና ተጀምሯል"
        );

        setCurrentInstruction(
          "😊 እባክዎ ፈገግ ይበሉ"
        );

        intervalId = setInterval(async () => {
          if (
            !videoRef.current ||
            videoRef.current.paused ||
            videoRef.current.ended
          ) {
            return;
          }

          const detection = await faceapi
            .detectSingleFace(
              videoRef.current,
              new faceapi.TinyFaceDetectorOptions()
            )
            .withFaceLandmarks()
            .withFaceExpressions();

          if (!detection) return;

          // ===================
          // Smile Check
          // ===================
          if (
            !checksRef.current.smilePassed &&
            detection.expressions.happy > 0.45
          ) {
            checksRef.current.smilePassed = true;

            setChecks((prev) => ({
              ...prev,
              smilePassed: true
            }));

            setCurrentInstruction(
              "↔️ አሁን ራስዎን ወደ ግራ ወይም ቀኝ ያዙሩ"
            );
          }

          // ===================
          // Head Turn Check
          // ===================
          if (
            checksRef.current.smilePassed &&
            !checksRef.current.nodPassed
          ) {
            const landmarks = detection.landmarks;

            const nose = landmarks.getNose()[0];

            const leftEye = landmarks.getLeftEye()[0];

            const rightEye = landmarks.getRightEye()[0];

            const leftDistance =
              nose.x - leftEye.x;

            const rightDistance =
              rightEye.x - nose.x;

            const ratio =
              leftDistance / rightDistance;

            if (ratio < 0.65 || ratio > 1.45) {
              checksRef.current.nodPassed = true;

              setChecks((prev) => ({
                ...prev,
                nodPassed: true
              }));

              setStatusMessage(
                "✅ የህያውነት ፈተና ተሳክቷል"
              );

              clearInterval(intervalId);

              if (stream) {
                stream
                  .getTracks()
                  .forEach((track) =>
                    track.stop()
                  );
              }

              // send result back
              onSuccess({
                smilePassed: true,
                nodPassed: true,
                turnPassed: true
              });
            }
          }
        }, 400);
      } catch (err) {
        console.error(err);

        setStatusMessage(
          "❌ ካሜራውን መክፈት አልተቻለም"
        );

        setLoading(false);
      }
    };

    startLiveness();

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }

      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [faydaNumber, onSuccess]);

  return (
    <div
      style={{
        maxWidth: "500px",
        margin: "auto",
        textAlign: "center",
        padding: "20px"
      }}
    >
      <h2>🎯 ደረጃ 4 - Liveness Test</h2>

      <div
        style={{
          background: "#162447",
          color: "#fff",
          padding: "15px",
          borderRadius: "10px",
          marginBottom: "20px",
          fontWeight: "bold"
        }}
      >
        {currentInstruction}
      </div>

      <div
        style={{
          width: "280px",
          height: "280px",
          margin: "0 auto",
          borderRadius: "15px",
          overflow: "hidden",
          border: "4px solid #2563eb",
          background: "#000"
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
            objectFit: "cover"
          }}
        />
      </div>

      <div
        style={{
          marginTop: "25px"
        }}
      >
        <p
          style={{
            color: checks.smilePassed
              ? "#16a34a"
              : "#64748b"
          }}
        >
          {checks.smilePassed ? "✅" : "⭕"} Smile Check
        </p>

        <p
          style={{
            color: checks.nodPassed
              ? "#16a34a"
              : "#64748b"
          }}
        >
          {checks.nodPassed ? "✅" : "⭕"} Motion Check
        </p>
      </div>

      <p
        style={{
          marginTop: "20px",
          color: "#94a3b8",
          fontSize: "13px"
        }}
      >
        {statusMessage}
      </p>
    </div>
  );
}

export default LivenessTest;
