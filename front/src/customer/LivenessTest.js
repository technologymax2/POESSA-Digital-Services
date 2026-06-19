import React, { useState, useRef, useEffect } from 'react';
import * as faceapi from '@vladmandic/face-api';

function LivenessTest({ faydaNumber, idPhoto }) {
  const videoRef = useRef(null);
  const [task, setTask] = useState("ፊትዎን ወደ ካሜራ ያድርጉ");
  const [stage, setStage] = useState(0); 

  // የፊት ማመሳከሪያ (Face Comparison)
  const compareWithDB = async (liveFace) => {
    // 1. ከዳታቤዝ ፎቶ ጋር ማነጻጸር
    // 2. ተመሳሳይ ከሆነ ወደ LivenessTest ይገባል
    setTask("በጣም ጥሩ! አሁን ፈገግ ይበሉ (Smile)");
  };

  const runLiveness = async () => {
    const detections = await faceapi.detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks().withFaceExpressions();

    if (!detections) return;

    // ደረጃ በደረጃ እንቅስቃሴዎችን መፈተሽ
    if (stage === 0 && detections.expressions.happy > 0.7) {
      setTask("ጭንቅላትዎን ወደ ላይ እና ታች ያድርጉ (Nod)");
      setStage(1);
    } else if (stage === 1 && Math.abs(detections.landmarks.getNose()[0].y - 150) > 30) {
      setTask("ወደ ግራ እና ቀኝ ያወዛውዙ (Turn)");
      setStage(2);
    } else if (stage === 2 && Math.abs(detections.landmarks.getNose()[0].x - 200) > 40) {
      setTask("ማረጋገጫ ተጠናቋል! 🎉");
      // የመጨረሻውን የ Backend ጥሪ እዚህ ያድርጉ
    }
  };

  return (
    <div>
      <h3>{task}</h3>
      <video ref={videoRef} autoPlay onPlay={runLiveness} />
    </div>
  );
}
export default LivenessTest;
