import React, { useEffect, useRef, useState } from "react";

function LivenessTest({ faydaNumber, onSuccess }) {
  const videoRef = useRef(null);
  const [statusMessage, setStatusMessage] = useState("⏳ ካሜራውን በማዘጋጀት ላይ...");
  const [loading, setLoading] = useState(true);
  const [checks, setChecks] = useState({ smilePassed: false, nodPassed: false });
  const [currentInstruction, setCurrentInstruction] = useState("እባክዎ ካሜራውን ይመልከቱ");

  useEffect(() => {
    let stream = null;
    let intervalId = null;

    const startLiveness = async () => {
      try {
        const faceapi = window.faceapi;
        if (!faceapi) { setStatusMessage("❌ የፊት መለያው አልተጫነም"); return; }
        
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri("https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model"),
          faceapi.nets.faceLandmark68Net.loadFromUri("https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model"),
          faceapi.nets.faceExpressionNet.loadFromUri("https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model"),
        ]);

        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().then(() => setLoading(false));
          setStatusMessage("🟢 ፈተናው ተጀምሯል!");
          setCurrentInstruction("😊 እባክዎ ፈገግ ይበሉ...");
        }

        intervalId = setInterval(async () => {
          if (!videoRef.current || videoRef.current.paused) return;
          const det = await faceapi.detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions();
          if (!det) return;

          if (!checks.smilePassed && det.expressions.happy > 0.4) {
            setChecks(p => ({ ...p, smilePassed: true }));
            setCurrentInstruction("👋 አሁን ራስዎን ወደ ጎን ያንቀሳቅሱ...");
          }

          if (checks.smilePassed && !checks.nodPassed) {
            const nose = det.landmarks.getNose()[0];
            const left = det.landmarks.getLeftEye()[0];
            const right = det.landmarks.getRightEye()[0];
            const ratio = (nose.x - left.x) / (right.x - nose.x);
            if (ratio < 0.7 || ratio > 1.3) {
              setChecks(p => ({ ...p, nodPassed: true }));
              clearInterval(intervalId);
              if (stream) stream.getTracks().forEach(t => t.stop());
              onSuccess({ faceMatched: true, smilePassed: true, nodPassed: true });
            }
          }
        }, 500);
      } catch (err) {
        setStatusMessage("❌ ካሜራ ፈቃድ ተከልክሏል");
      }
    };
    startLiveness();
    return () => { clearInterval(intervalId); if (stream) stream.getTracks().forEach(t => t.stop()); };
  }, []);

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h3>🎯 የህያውነት ፈተና</h3>
      <video ref={videoRef} autoPlay playsInline muted style={{ width: "260px", height: "260px", background: "#000", borderRadius: "12px", objectFit: "cover" }} />
      <p style={{ fontWeight: "bold" }}>{currentInstruction}</p>
      <div style={{ color: checks.smilePassed ? "green" : "gray" }}>{checks.smilePassed ? "✅" : "⭕"} ፈገግታ</div>
      <div style={{ color: checks.nodPassed ? "green" : "gray" }}>{checks.nodPassed ? "✅" : "⭕"} እንቅስቃሴ</div>
    </div>
  );
}
export default LivenessTest;
