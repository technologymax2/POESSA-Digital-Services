// src/components/LivenessTest.js
import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

function LivenessTest({ faydaNumber, onSuccess }) {
  const videoRef = useRef(null);
  const [instruction, setInstruction] = useState("😊 እባክዎ ካሜራውን ይመልከቱ");
  const [statusMessage, setStatusMessage] = useState("⏳ AI እየተጫነ ነው...");
  const [checks, setChecks] = useState({ smilePassed: false, nodPassed: false, turnPassed: false });
  const checksRef = useRef({ smilePassed: false, nodPassed: false, turnPassed: false });
  const lastNoseY = useRef(0);

  useEffect(() => {
    let stream;
    const start = async () => {
      const MODEL_URL = "/models";
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
      ]);
      stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      setStatusMessage("🟢 Liveness Test ዝግጁ ነው");
    };
    start();

    const interval = setInterval(async () => {
      if (!videoRef.current) return;
      const det = await faceapi.detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks().withFaceExpressions();
      if (!det) return;

      // Smile Logic
      if (!checksRef.current.smilePassed && det.expressions.happy > 0.6) {
        checksRef.current.smilePassed = true;
        setChecks(p => ({ ...p, smilePassed: true }));
        setInstruction("🔽 አሁን ራስዎን ወደ ታች/ላይ ያንቀሳቅሱ (Nod)");
      }
      // Nod Logic
      if (checksRef.current.smilePassed && !checksRef.current.nodPassed) {
        const noseY = det.landmarks.getNose()[0].y;
        if (Math.abs(noseY - lastNoseY.current) > 10) {
          checksRef.current.nodPassed = true;
          setChecks(p => ({ ...p, nodPassed: true }));
          setInstruction("↔️ አሁን ራስዎን ወደ ጎን ያዙሩ (Turn)");
        }
        lastNoseY.current = noseY;
      }
      // Turn Logic
      if (checksRef.current.nodPassed && !checksRef.current.turnPassed) {
        const nose = det.landmarks.getNose()[0];
        const leftEye = det.landmarks.getLeftEye()[0];
        const rightEye = det.landmarks.getRightEye()[0];
        const ratio = Math.abs(nose.x - leftEye.x) / Math.abs(rightEye.x - nose.x || 1);
        if (ratio < 0.6 || ratio > 1.4) {
          checksRef.current.turnPassed = true;
          setChecks(p => ({ ...p, turnPassed: true }));
          onSuccess({ smilePassed: true, nodPassed: true, turnPassed: true });
        }
      }
    }, 500);

    return () => { clearInterval(interval); stream?.getTracks().forEach(t => t.stop()); };
  }, [onSuccess]);

  return (
    <div style={{ textAlign: "center" }}>
      <h2>🎯 Liveness Test</h2>
      <video ref={videoRef} autoPlay muted style={{ width: "300px", borderRadius: "15px" }} />
      <p style={{ fontWeight: "bold" }}>{instruction}</p>
      <p>{statusMessage}</p>
      <div>{checks.smilePassed ? "✅" : "⭕"} ፈገግታ | {checks.nodPassed ? "✅" : "⭕"} መነቅነቅ | {checks.turnPassed ? "✅" : "⭕"} መዞር</div>
    </div>
  );
}
export default LivenessTest;
