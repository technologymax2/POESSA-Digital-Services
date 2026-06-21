import React, { useEffect, useRef, useState } from "react";

function LivenessTest({ faydaNumber, matchPercentage, onSuccess }) {
  const videoRef = useRef(null);
  const [statusMessage, setStatusMessage] = useState("⏳ የህያውነት ፈተናን በማዘጋጀት ላይ...");
  const [loading, setLoading] = useState(true);
  
  const smilePassedRef = useRef(false);
  const nodPassedRef = useRef(false);
  const isFinishedRef = useRef(false);

  const [checks, setChecks] = useState({ smilePassed: false, nodPassed: false });
  const [currentInstruction, setCurrentInstruction] = useState("እባክዎ ካሜራውን ቀጥ ብለው ይመልከቱ");

  useEffect(() => {
    let stream = null;
    let intervalId = null;

    const startLiveness = async () => {
      try {
        const faceapi = window.faceapi;
        if (!faceapi) {
          setStatusMessage("❌ የፊት መለያው ስክሪፕት አልተጫነም፤ ገጹን ያድሱ።");
          return;
        }

        setStatusMessage("⏳ ሞዴሎችን በመጫን ላይ...");
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
          faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
          faceapi.nets.faceExpressionNet.loadFromUri("/models"),
        ]);

        setStatusMessage("⏳ ካሜራውን በመክፈት ላይ...");
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 320 }, height: { ideal: 320 } }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = async () => {
            await videoRef.current.play();
            setLoading(false);
            setStatusMessage("🟢 ፈተናው ተጀምሯል!");
            setCurrentInstruction("😊 እባክዎ ለካሜራው በግልጽ ፈገግ ይበሉ...");
          };
        }

        intervalId = setInterval(async () => {
          if (isFinishedRef.current || !videoRef.current || videoRef.current.paused) return;

          const detection = await faceapi.detectSingleFace(
            videoRef.current, 
            new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.4 })
          )
          .withFaceLandmarks()
          .withFaceExpressions();

          if (!detection) return;

          // 1. ፈገግታ ማረጋገጫ
          if (!smilePassedRef.current && detection.expressions.happy > 0.35) {
            smilePassedRef.current = true;
            setChecks(prev => ({ ...prev, smilePassed: true }));
            setCurrentInstruction("👋 አሁን ደግሞ ራስዎን ወደ ጎን ቀስ ብለው ያንቀሳቅሱ...");
          }

          // 2. የእንቅስቃሴ ማረጋገጫ (Nod/Turn)
          if (smilePassedRef.current && !nodPassedRef.current) {
            const landmarks = detection.landmarks;
            const nose = landmarks.getNose()[0];
            const leftEye = landmarks.getLeftEye()[0];
            const rightEye = landmarks.getRightEye()[0];
            const ratio = (nose.x - leftEye.x) / (rightEye.x - nose.x);

            if (ratio < 0.75 || ratio > 1.30) {
              nodPassedRef.current = true;
              isFinishedRef.current = true;
              setChecks(prev => ({ ...prev, nodPassed: true }));
              setStatusMessage("🎉 ፈተናው ተጠናቋል!");
              clearInterval(intervalId);

              setTimeout(() => {
                if (stream) stream.getTracks().forEach(t => t.stop());
                if (onSuccess) onSuccess({ smilePassed: true, nodPassed: true, turnPassed: true });
              }, 1000);
            }
          }
        }, 500);
      } catch (err) {
        console.error(err);
        setStatusMessage("❌ የካሜራ ፈቃድ ተከልክሏል ወይም ስህተት ተፈጥሯል።");
        setLoading(false);
      }
    };

    startLiveness();

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, []);

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h3>🎯 የህያውነት ፈተና (Liveness Test)</h3>
      <div style={{ background: "#000", width: "260px", height: "260px", margin: "0 auto", borderRadius: "12px", overflow: "hidden" }}>
        <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      <div style={{ margin: "15px", fontWeight: "bold" }}>{currentInstruction}</div>
      <div style={{ color: "blue" }}>{statusMessage}</div>
    </div>
  );
}

export default LivenessTest;
