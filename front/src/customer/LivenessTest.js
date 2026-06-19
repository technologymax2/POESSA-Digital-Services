import React, { useState, useRef, useEffect } from 'react';
import * as faceapi from '@vladmandic/face-api';

function LivenessTest({ faydaNumber, idPhoto }) {
  const videoRef = useRef(null);
  const [task, setTask] = useState("ካሜራ በመጫን ላይ...");
  const [stage, setStage] = useState(0); // 0:Idle, 1:Smile, 2:Nod, 3:Turn, 4:Done

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = 'https://cdn.jsdelivr.net/gh/vladmandic/face-api/model/';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
      ]);
      startVideo();
    };
    loadModels();
  }, []);

  const startVideo = () => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => { videoRef.current.srcObject = stream; setTask("እባክዎ ፈገግ ይበሉ (Smile)"); })
      .catch(err => setTask("ካሜራ አልተገኘም"));
  };

  const verifySuccess = async () => {
    await fetch('https://poessa-digital-services-1.onrender.com/api/pensioners/verify-success', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ faydaNumber, status: 'Verified' })
    });
    setTask("ማረጋገጫው በተሳካ ሁኔታ ተጠናቋል! ✅");
  };

  const runLiveness = async () => {
    const interval = setInterval(async () => {
      if (!videoRef.current || stage === 4) { clearInterval(interval); return; }

      const detection = await faceapi.detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks().withFaceExpressions();
      if (!detection) return;

      const { expressions, landmarks } = detection;
      const nose = landmarks.getNose()[0];

      // 1. Smile
      if (stage === 0 && expressions.happy > 0.7) {
        setStage(1); setTask("ጭንቅላትዎን ወደ ላይ እና ታች ያድርጉ (Nod)");
      }
      // 2. Nod
      else if (stage === 1 && Math.abs(nose.y - 150) > 30) {
        setStage(2); setTask("ወደ ግራ እና ቀኝ ያወዛውዙ (Turn)");
      }
      // 3. Turn
      else if (stage === 2 && Math.abs(nose.x - 200) > 40) {
        setStage(4); verifySuccess();
      }
    }, 1000);
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <h2>{task}</h2>
      <video ref={videoRef} autoPlay muted onPlay={runLiveness} style={{ width: '400px', borderRadius: '10px' }} />
    </div>
  );
}

export default LivenessTest;
