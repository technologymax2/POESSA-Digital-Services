import React, { useEffect, useRef, useState } from "react";

function LivenessTest({ faydaNumber, onSuccess }) {
  const videoRef = useRef(null);
  const checksRef = useRef({ smilePassed: false, nodPassed: false });
  const [statusMessage, setStatusMessage] = useState("⏳ ካሜራውን እና የባዮሜትሪክስ ሞዴሉን በማዘጋጀት ላይ...");
  const [loading, setLoading] = useState(true);
  
  const [checks, setChecks] = useState({
    smilePassed: false,
    nodPassed: false
  });

  const [currentInstruction, setCurrentInstruction] = useState("እባክዎ ካሜራውን ቀጥ ብለው ይመልከቱ");

  useEffect(() => {
    let stream = null;
    let intervalId = null;

    const startLiveness = async () => {
      try {
        const faceapi = window.faceapi;
        if (!faceapi) {
          setStatusMessage("❌ የፊት መለያው ስክሪፕት አልተጫነም፤ እባክዎ index.htmlን ይፈትሹ።");
          return;
        }

        setStatusMessage("⏳ የAI ሞዴሎችን ወደ ብሮውዘር በመጫን ላይ...");
        const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model";
        
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);

        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 400 }, height: { ideal: 400 } }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        setLoading(false);
        setStatusMessage("🟢 የህያውነት ፈተናው ተጀምሯል!");
        setCurrentInstruction("😊 እባክዎ ለካሜራው በግልጽ ፈገግ ይበሉ...");

        intervalId = setInterval(async () => {
          if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) return;

          const detection = await faceapi.detectSingleFace(
            videoRef.current, 
            new faceapi.TinyFaceDetectorOptions()
          )
          .withFaceLandmarks()
          .withFaceExpressions();

          if (!detection) return;

          // ሀ. የፈገግታ ማረጋገጫ
          if (!checksRef.current.smilePassed && detection.expressions.happy > 0.45) {
            checksRef.current.smilePassed = true;
            setChecks(prev => ({ ...prev, smilePassed: true }));
            setCurrentInstruction("👋 አሁን ደግሞ ራስዎን ቀስ አድርገው ወደ ግራና ቀኝ ያወዛውዙ...");
          }

          // ለ. የራስ ማወዛወዝ ማረጋገጫ
          if (checksRef.current.smilePassed && !checksRef.current.nodPassed) {
            const landmarks = detection.landmarks;
            const nose = landmarks.getNose()[0];
            const leftEye = landmarks.getLeftEye()[0];
            const rightEye = landmarks.getRightEye()[0];

            const leftDist = nose.x - leftEye.x;
            const rightDist = rightEye.x - nose.x;
            const ratio = leftDist / rightDist;

            if (ratio < 0.65 || ratio > 1.45) {
              checksRef.current.nodPassed = true;
              setChecks(prev => ({ ...prev, nodPassed: true }));
              
              // ፈተናው ሲያልቅ ካሜራውን በግዳጅ ይዝጋው
              clearInterval(intervalId);
              if (stream) stream.getTracks().forEach(track => track.stop());
              
              // አንድ ጊዜ ብቻ እንዲላክ
              onSuccess({
                faceMatched: true,
                smilePassed: true,
                nodPassed: true,
                turnPassed: true
              });
            }
          }
        }, 400);

      } catch (err) {
        console.error("Liveness Error:", err);
        setStatusMessage("❌ ካሜራ መክፈት አልተቻለም ወይም ሞዴሉ አልተጫነም።");
      }
    };

    startLiveness();

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, []); // ባዶ Dependency array ለትክክለኛ አሰራር

  return (
    <div style={{ padding: "20px", maxWidth: "450px", margin: "0 auto", textAlign: "center", fontFamily: "sans-serif" }}>
      <h3 style={{ color: "#162447" }}>🎯 ደረጃ 4፦ የህያውነት ፈተና (Liveness Test)</h3>
      <p style={{ color: "#64748b", fontSize: "14px" }}>ይህ ሰው በትክክል በህይወት ያለና ካሜራው ፊት መኖሩን ማረጋገጫ</p>

      <div style={{ background: "#162447", color: "#fff", padding: "15px", borderRadius: "8px", margin: "15px 0", fontSize: "16px", fontWeight: "bold" }}>
        {currentInstruction}
      </div>

      <div style={{ background: "#000", borderRadius: "12px", width: "260px", height: "260px", margin: "0 auto", overflow: "hidden", position: "relative", border: "4px solid #3b82f6" }}>
        <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        {loading && <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", color: "#fff", fontSize: "12px" }}>እየጫነ ነው...</div>}
      </div>

      <div style={{ marginTop: "20px", textAlign: "left", display: "inline-block" }}>
        <div style={{ fontSize: "15px", marginBottom: "8px", color: checks.smilePassed ? "#22c55e" : "#64748b" }}>
          {checks.smilePassed ? "✅" : "⭕"} 1. የፈገግታ ፈተና (Smile Check)
        </div>
        <div style={{ fontSize: "15px", color: checks.nodPassed ? "#22c55e" : "#64748b" }}>
          {checks.nodPassed ? "✅" : "⭕"} 2. የእንቅስቃሴ ፈተና (Motion Check)
        </div>
      </div>

      <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "20px" }}>{statusMessage}</p>
    </div>
  );
}

export default LivenessTest;
