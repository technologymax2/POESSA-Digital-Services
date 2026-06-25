import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

function LivenessTest({ faydaNumber, onSuccess }) {
  const videoRef = useRef(null);
  const [instruction, setInstruction] = useState("⏳ AI ሞዴሎችን በመጫን ላይ...");
  const [status, setStatus] = useState("⏳ እባክዎ ይጠብቁ...");
  const [checks, setChecks] = useState({ smilePassed: false, nodPassed: false, turnPassed: false });
  
  // Ref to track state without re-rendering the interval
  const checksRef = useRef({ smilePassed: false, nodPassed: false, turnPassed: false });
  const lastNoseY = useRef(0);

  useEffect(() => {
    let stream = null;
    let intervalId = null;

    const startDetection = async () => {
      try {
        // 1. Load Models from your /public/models folder
        const MODEL_URL = "/models";
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ]);

        // 2. Start Camera
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        if (videoRef.current) videoRef.current.srcObject = stream;
        
        setInstruction("😊 ፈገግ ይበሉ (Smile)");
        setStatus("🟢 ካሜራ ንቁ ነው");

        // 3. Main AI Loop
        intervalId = setInterval(async () => {
          if (!videoRef.current) return;

          const detection = await faceapi
            .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceExpressions();

          if (!detection) return;

          // STEP 1: SMILE
          if (!checksRef.current.smilePassed && detection.expressions.happy > 0.6) {
            checksRef.current.smilePassed = true;
            setChecks((p) => ({ ...p, smilePassed: true }));
            setInstruction("🔽 አሁን ራስዎን ወደ ታች/ላይ ያንቀሳቅሱ (Nod)");
          }

          // STEP 2: NOD
          if (checksRef.current.smilePassed && !checksRef.current.nodPassed) {
            const noseY = detection.landmarks.getNose()[0].y;
            if (Math.abs(noseY - lastNoseY.current) > 15) {
              checksRef.current.nodPassed = true;
              setChecks((p) => ({ ...p, nodPassed: true }));
              setInstruction("↔️ አሁን ራስዎን ወደ ጎን ያዙሩ (Turn)");
            }
            lastNoseY.current = noseY;
          }

          // STEP 3: TURN
          if (checksRef.current.nodPassed && !checksRef.current.turnPassed) {
            const nose = detection.landmarks.getNose()[0];
            const leftEye = detection.landmarks.getLeftEye()[0];
            const rightEye = detection.landmarks.getRightEye()[0];
            const ratio = Math.abs(nose.x - leftEye.x) / Math.abs(rightEye.x - nose.x || 1);
            
            if (ratio < 0.7 || ratio > 1.3) {
              checksRef.current.turnPassed = true;
              setChecks((p) => ({ ...p, turnPassed: true }));
              setInstruction("✅ ተጠናቀቀ!");
              clearInterval(intervalId);
              onSuccess({ smilePassed: true, nodPassed: true, turnPassed: true });
            }
          }
        }, 500);

      } catch (err) {
        console.error("Liveness Error:", err);
        setStatus("❌ ካሜራውን መጠቀም አልተቻለም");
      }
    };

    startDetection();

    // Cleanup on unmount
    return () => {
      clearInterval(intervalId);
      if (stream) stream.getTracks().forEach((track) => track.stop());
    };
  }, [onSuccess]);

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h3>🎯 የሕይወት መኖር ማረጋገጫ (Liveness)</h3>
      <div style={{ position: "relative", width: "320px", height: "240px", margin: "0 auto" }}>
        <video ref={videoRef} autoPlay muted playsInline style={{ width: "100%", borderRadius: "10px" }} />
      </div>
      <h4 style={{ color: "#162447" }}>{instruction}</h4>
      <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "10px" }}>
        <span style={{ color: checks.smilePassed ? "green" : "gray" }}>{checks.smilePassed ? "✅" : "⭕"} ፈገግታ</span>
        <span style={{ color: checks.nodPassed ? "green" : "gray" }}>{checks.nodPassed ? "✅" : "⭕"} መነቅነቅ</span>
        <span style={{ color: checks.turnPassed ? "green" : "gray" }}>{checks.turnPassed ? "✅" : "⭕"} መዞር</span>
      </div>
    </div>
  );
}

export default LivenessTest;
