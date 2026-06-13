import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from '@vladmandic/face-api';
import './LivenessTest.css'; 

function LivenessTest() {
  const videoRef = useRef(null);
  const [challenge, setChallenge] = useState("እባክዎ ፈገግ ይበሉ (Smile Please)");
  const [status, setStatus] = useState("የፊት መለያ ሞዴሎች እየተጫኑ ነው...");
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    // Vercel ላይ ከ /front/public/models ማውጫ ውስጥ በቀጥታ እንዲያነብ ማድረግ
    const modelPath = window.location.origin + '/models';

    Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(modelPath),
      faceapi.nets.faceLandmark68Net.loadFromUri(modelPath),
      faceapi.nets.faceExpressionNet.loadFromUri(modelPath)
    ]).then(() => {
      setStatus("ሞዴሎች ተጭነዋል፤ ካሜራ እየተከፈተ ነው...");
      startVideo();
    }).catch(err => {
      console.error(err);
      setStatus("የሞዴል ስህተት፡ እባክዎ ገጹን Refresh ያድርጉት");
    });
  }, []);

  const startVideo = () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: { width: 400, height: 300, facingMode: "user" } })
        .then(stream => { 
          if (videoRef.current) videoRef.current.srcObject = stream; 
        })
        .catch(err => setStatus("እባክዎ የካሜራ ፈቃድ ይስጡ"));
    } else {
      setStatus("ብሮውዘርዎ ካሜራ አይደግፍም");
    }
  };

  const handleVideoPlay = () => {
    const interval = setInterval(async () => {
      if (!videoRef.current || isVerified) {
        clearInterval(interval);
        return;
      }
      
      try {
        const detections = await faceapi.detectSingleFace(
          videoRef.current, 
          new faceapi.TinyFaceDetectorOptions()
        ).withFaceLandmarks().withFaceExpressions();

        if (detections) {
          setStatus("ፊት ተገኝቷል፤ ትዕዛዙን ይፈጽሙ...");
          const smileValue = detections.expressions.happy;
          
          // ፈገግታው ከ 80% በላይ መሆኑን ማረጋገጫ
          if (smileValue > 0.80) { 
            setIsVerified(true);
            setStatus("በአሸናፊነት ተረጋግጧል! (Verified) 🎉");
            clearInterval(interval);
          }
        } else {
          setStatus("እባክዎ ፊትዎን ወደ ካሜራው ያቅርቡ");
        }
      } catch (e) {
        // የቪዲዮ ፍሬም መቋረጥ ስህተቶችን በዝምታ ለማለፍ
      }
    }, 600);
  };

  return (
    <div className="liveness-container">
      <h2 className="liveness-title">POESSA ዲጂታል አገልግሎት</h2>
      <p className="liveness-subtitle">የጡረተኞች የህይወት ማረጋገጫ ሲስተም</p>
      
      <div className="challenge-box">
        {challenge}
      </div>
      
      <div className="video-wrapper">
        <video 
          ref={videoRef} 
          autoPlay 
          muted 
          onPlay={handleVideoPlay} 
          className="video-element" 
          playsInline 
        />
        {isVerified && (
          <div className="verified-overlay">
            <span className="verified-badge">✓ ተረጋግጧል</span>
          </div>
        )}
      </div>
      
      <p className={`status-text ${isVerified ? 'success' : 'loading'}`}>
        {status}
      </p>
    </div>
  );
}

export default LivenessTest;
