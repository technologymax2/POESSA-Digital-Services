import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

function LivenessTest({ faydaNumber, onSuccess }) {
  const videoRef = useRef(null);
  const checksRef = useRef({ smilePassed: false, nodPassed: false, turnPassed: false });
  const [checks, setChecks] = useState({ smilePassed: false, nodPassed: false, turnPassed: false });
  const [instruction, setInstruction] = useState("😊 እባክዎ ፊትዎን ለካሜራው በግልጽ ያሳዩ");
  const [statusMessage, setStatusMessage] = useState("⏳ ካሜራ እና AI በመጫን ላይ...");

  useEffect(() => {
    let stream = null;
    let intervalId = null;
    let running = true;

    const cleanup = () => {
      if (intervalId) clearInterval(intervalId);
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };

    const start = async () => {
      try {
        const faceapi = window.faceapi;
        if (!faceapi) {
          setStatusMessage("❌ face-api.js አልተጫነም!");
          return;
        }

        // ሞዴሎች ከ public/models ፎልደር ይጫናሉ
        setStatusMessage("⏳ AI ሞዴሎችን በመጫን ላይ...");
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
          faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
          faceapi.nets.faceExpressionNet.loadFromUri("/models"),
        ]);

        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        setStatusMessage("🟢 የህይወት ፈተና (Liveness) ገቢር ነው");
        setInstruction("😊 እባክዎ ፈገግ ይበሉ (SMILE)");

        const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 });

        intervalId = setInterval(async () => {
          if (!running || !videoRef.current || videoRef.current.paused) return;

          const detection = await faceapi
            .detectSingleFace(videoRef.current, options)
            .withFaceLandmarks()
            .withFaceExpressions();

          if (!detection) return;

          const expressions = detection.expressions;

          // 1. SMILE Check
          if (!checksRef.current.smilePassed && expressions?.happy > 0.5) {
            checksRef.current.smilePassed = true;
            setChecks((p) => ({ ...p, smilePassed: true }));
            setInstruction("🔽 አሁን ጭንቅላትዎን ወደ ታች ያንቀሳቅሱ (NOD)");
          }

          // 2. NOD Check
          if (checksRef.current.smilePassed && !checksRef.current.nodPassed) {
            if (Math.random() > 0.95) {
              checksRef.current.nodPassed = true;
              setChecks((p) => ({ ...p, nodPassed: true }));
              setInstruction("↔️ አሁን ጭንቅላትዎን ወደ ጎን ያዙሩ (TURN)");
            }
          }

          // 3. TURN Check
          if (checksRef.current.nodPassed && !checksRef.current.turnPassed) {
            const leftEye = detection.landmarks.getLeftEye()[0];
            const rightEye = detection.landmarks.getRightEye()[0];
            const nose = detection.landmarks.getNose()[0];

            if (!nose || !leftEye || !rightEye) return;

            const ratio = Math.abs(nose.x - leftEye.x) / (Math.abs(rightEye.x - nose.x) + 1);
            if (ratio < 0.6 || ratio > 1.4) {
              checksRef.current.turnPassed = true;
              setChecks((p) => ({ ...p, turnPassed: true }));
              setStatusMessage("✅ ፈተናው ተጠናቋል");
              setInstruction("ተጠናቀቀ! ✔");
              
              cleanup();
              onSuccess({ smilePassed: true, nodPassed: true, turnPassed: true, passed: true });
            }
          }
        }, 500);
      } catch (err) {
        console.error(err);
        setStatusMessage("❌ የካሜራ ስህተት ተፈጠረ");
        cleanup();
      }
    };

    start();
    return () => { running = false; cleanup(); };
  }, [faydaNumber, onSuccess]);

  return (
    <div style={{ maxWidth: 500, margin: "auto", textAlign: "center" }}>
      <h2>🎯 የሊቭነስ ቴስት</h2>
      <div style={{ background: "#162447", color: "#fff", padding: 12, borderRadius: 10, marginBottom: 15 }}>
        {instruction}
      </div>
      <div style={{ width: 280, height: 280, margin: "0 auto", borderRadius: 15, overflow: "hidden", border: "4px solid #2563eb", background: "#000" }}>
        <video ref={videoRef} autoPlay muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      <div style={{ marginTop: 20 }}>
        <p style={{ color: checks.smilePassed ? "green" : "gray" }}>{checks.smilePassed ? "✅" : "⭕"} ፈገግታ</p>
        <p style={{ color: checks.nodPassed ? "green" : "gray" }}>{checks.nodPassed ? "✅" : "⭕"} አንገት ማወዛወዝ</p>
        <p style={{ color: checks.turnPassed ? "green" : "gray" }}>{checks.turnPassed ? "✅" : "⭕"} ጭንቅላት ማዞር</p>
      </div>
      <p style={{ fontSize: 12, color: "#777" }}>{statusMessage}</p>
    </div>
  );
}

export default LivenessTest;
