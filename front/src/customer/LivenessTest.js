import React, { useEffect, useRef, useState } from "react";

function LivenessTest({ faydaNumber, matchPercentage, onSuccess }) {
  const videoRef = useRef(null);
  const [statusMessage, setStatusMessage] = useState("⏳ የህያውነት ፈተናውን በማዘጋጀት ላይ...");
  const [loading, setLoading] = useState(true);
  
  const smilePassedRef = useRef(false);
  const nodPassedRef = useRef(false);
  const isFinishedRef = useRef(false);

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
          setStatusMessage("❌ የፊት መለያው ስክሪፕት አልተጫነም፤ እባክዎ ገጹን ያድሱት።");
          return;
        }

        setStatusMessage("⏳ የፊት ገጽታ መለኪያ ሞዴሎችን በመጫን ላይ...");
        
        // 🌟 [ዋና ማሻሻያ] የፊት ስሜት (Expression) መለኪያ ሞዴል መጫኑን ማረጋገጥ (እንዳይሽከረከር የሚያደርገው ቁልፍ ይሄ ነው)
        if (!faceapi.nets.faceExpressionNet.params) {
          await faceapi.nets.faceExpressionNet.loadFromUri("/models");
        }

        setStatusMessage("⏳ ካሜራውን በማስነሳት ላይ...");
        
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 320 }, height: { ideal: 320 } }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            setLoading(false);
            setStatusMessage("🟢 የህያውነት ፈተናው ተጀምሯል!");
            setCurrentInstruction("😊 እባክዎ ለካሜራው በግልጽ ፈገግ ይበሉ...");
          };
        }

        intervalId = setInterval(async () => {
          if (isFinishedRef.current) return;
          if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) return;

          try {
            // ሞዴሉ አሁን ስለተጫነ ይህ ትንተና ያለምንም ስህተት በፍጥነት ይሰራል
            const detection = await faceapi.detectSingleFace(
              videoRef.current, 
              new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.4 })
            )
            .withFaceLandmarks()
            .withFaceExpressions();

            if (!detection) return;

            // 1️⃣ የፈገግታ ማረጋገጫ (Smile Detection)
            const smileValue = detection.expressions?.happy || 0;

            if (!smilePassedRef.current && smileValue > 0.35) { // ፈገግታው በፍጥነት እንዲያነበው ወሰኑ ዝቅ ተደርጓል
              smilePassedRef.current = true;
              setChecks(prev => ({ ...prev, smilePassed: true }));
              setCurrentInstruction("👋 አሁን ደግሞ ራስዎን ቀስ አድርገው ወደ ግራና ቀኝ ያንቀሳቅሱ...");
            }

            // 2️⃣ የእንቅስቃሴ ማረጋገጫ (Motion Detection)
            if (smilePassedRef.current && !nodPassedRef.current) {
              const landmarks = detection.landmarks;
              const nose = landmarks.getNose()[0];
              const leftEye = landmarks.getLeftEye()[0];
              const rightEye = landmarks.getRightEye()[0];

              const leftDist = nose.x - leftEye.x;
              const rightDist = rightEye.x - nose.x;
              const ratio = leftDist / rightDist;

              if (ratio < 0.75 || ratio > 1.30) { 
                nodPassedRef.current = true;
                isFinishedRef.current = true;
                
                setChecks(prev => ({ ...prev, nodPassed: true }));
                setStatusMessage("🎉 ፈተናውን አጠናቀዋል! መረጃው እየተቀመጠ ነው...");
                setCurrentInstruction("✅ ፈተናው በስኬት አልፏል!");

                clearInterval(intervalId);

                // ካሜራውን ከማጥፋት በፊት የ 800ms ዕረፍት
                setTimeout(() => {
                  if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                  }
                  if (onSuccess) {
                    onSuccess({
                      faydaNumber: faydaNumber,
                      matchPercentage: matchPercentage,
                      smilePassed: true,
                      nodPassed: true,
                      faceMatched: true
                    });
                  }
                }, 800);
              }
            }
          } catch (loopErr) {
            console.error("Loop detection error:", loopErr);
          }
        }, 400);

      } catch (err) {
        console.error("Liveness Error:", err);
        setStatusMessage("❌ የካሜራ ፈቃድ መክፈት አልተቻለም።");
        setLoading(false);
      }
    };

    startLiveness();

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [faydaNumber, matchPercentage, onSuccess]); 

  return (
    <div style={{ padding: "20px", maxWidth: "450px", margin: "0 auto", textAlign: "center", fontFamily: "sans-serif" }}>
      <h3 style={{ color: "#162447" }}>🎯 ደረጃ 4፦ የህያውነት ፈተና (Liveness Test)</h3>
      <p style={{ color: "#64748b", fontSize: "14px" }}>ይህ ሰው በትክክል በህይወት ያለና ካሜራው ፊት መኖሩን ማረጋገጫ</p>

      <div style={{ background: "#162447", color: "#fff", padding: "15px", borderRadius: "8px", margin: "15px 0", fontSize: "16px", fontWeight: "bold" }}>
        {currentInstruction}
      </div>

      <div style={{ background: "#000", borderRadius: "12px", width: "260px", height: "260px", margin: "0 auto", overflow: "hidden", position: "relative", border: "4px solid #3b82f6" }}>
        <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        {loading && <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", color: "#fff", fontSize: "13px" }}>እየጫነ ነው... ⏳</div>}
      </div>

      <div style={{ marginTop: "20px", textAlign: "left", display: "inline-block" }}>
        <div style={{ fontSize: "15px", marginBottom: "8px", color: checks.smilePassed ? "#22c55e" : "#64748b", fontWeight: "bold" }}>
          {checks.smilePassed ? "✅" : "⭕"} 1. የፈገግታ ፈተና (Smile Check)
        </div>
        <div style={{ fontSize: "15px", color: checks.nodPassed ? "#22c55e" : "#64748b", fontWeight: "bold" }}>
          {checks.nodPassed ? "✅" : "⭕"} 2. የእንቅስቃሴ ፈተና (Motion Check)
        </div>
      </div>

      <p style={{ fontSize: "12px", color: "#2563eb", fontWeight: "bold", marginTop: "20px" }}>{statusMessage}</p>
    </div>
  );
}

export default LivenessTest;
