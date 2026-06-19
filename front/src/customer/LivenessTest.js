import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from '@vladmandic/face-api';
import './LivenessTest.css';

function LivenessTest({ faydaNumber }) {
  const videoRef = useRef(null);
  const [task, setTask] = useState("እባክዎ ፈገግ ይበሉ (Smile)");
  const [stage, setStage] = useState(0); // 0:Smile, 1:Nod, 2:Turn, 3:Done
  const [status, setStatus] = useState("ሞዴሎችን በመጫን ላይ...");
  const [isVerified, setIsVerified] = useState(false);

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
      .then(stream => { videoRef.current.srcObject = stream; setStatus("ካሜራ ተከፍቷል"); })
      .catch(err => setStatus("ካሜራ አልተገኘም"));
  };

  const handleVideoPlay = () => {
    const interval = setInterval(async () => {
      if (!videoRef.current || stage === 3) { clearInterval(interval); return; }

      const detection = await faceapi.detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks().withFaceExpressions();

      if (!detection) return;

      const { expressions, landmarks } = detection;
      const nose = landmarks.getNose()[0]; // የአፍንጫ መሃል

      // 1. ፈገግታ ማረጋገጫ
      if (stage === 0 && expressions.happy > 0.8) {
        setTask("በጣም ጥሩ! አሁን ጭንቅላትዎን ወደ ላይ እና ታች ያድርጉ (Nod)");
        setStage(1);
      } 
      // 2. Nod (Up/Down) - በጊዜ ሂደት የ Y አቀማመጥ ለውጥ
      else if (stage === 1 && Math.abs(nose.y - 150) > 30) {
        setTask("አሁን ጭንቅላትዎን ወደ ግራ እና ቀኝ ያወዛውዙ (Turn)");
        setStage(2);
      }
      // 3. Turn (Left/Right) - የ X አቀማመጥ ለውጥ
      else if (stage === 2 && Math.abs(nose.x - 200) > 40) {
        setStage(3);
        verifyUser();
      }
    }, 1000);
  };

  const verifyUser = async () => {
    setIsVerified(true);
    setTask("የህይወት ማረጋገጫ ተጠናቋል!");
    // ወደ Backend የመጨረሻውን የኦዲት መረጃ መላክ
    await fetch('https://poessa-digital-services-1.onrender.com/api/pensioners/verify-success', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ faydaNumber, status: 'Verified', timestamp: new Date() })
    });
  };

  return (
    <div className="liveness-container">
      <h2>{task}</h2>
      <video ref={videoRef} autoPlay muted onPlay={handleVideoPlay} style={{ width: '400px', borderRadius: '10px' }} />
      <p>{status}</p>
      {isVerified && <div className="success-badge">✅ የተረጋገጠ</div>}
    </div>
  );
}

export default LivenessTest;
