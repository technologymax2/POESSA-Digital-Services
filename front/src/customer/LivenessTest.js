import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from '@vladmandic/face-api';
import './LivenessTest.css'; 

// React 19 ደጋግሞ ሲያነሳው ሞዴሎቹ ተጋጭተው እንዳይቆሙ መቆለፊያ
let isModelsLoading = false;
let isModelsLoaded = false;

function LivenessTest() {
  const videoRef = useRef(null);
  const [challenge, setChallenge] = useState("እባክዎ ፈገግ ይበሉ (Smile Please)");
  const [status, setStatus] = useState("የፊት መለያ ሞዴሎች እየተጫኑ ነው...");
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    // ሞዴሎቹ አስቀድመው ከተጫኑ በቀጥታ ካሜራውን ክፈት
    if (isModelsLoaded) {
      setStatus("ሞዴሎች ዝግጁ ናቸው፤ ካሜራ እየተከፈተ ነው...");
      startVideo();
      return;
    }

    if (isModelsLoading) return;
    isModelsLoading = true;

    setStatus("ሞዴሎች ከ Vercel ላይ እየተጫኑ ነው...");

    // በ Vercel ላይ ካለው የ public/models ፎልደር ጋር ፍጹም ማገናኛ
    const modelPath = '/models';

    Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(modelPath),
      faceapi.nets.faceLandmark68Net.loadFromUri(modelPath),
      faceapi.nets.faceExpressionNet.loadFromUri(modelPath)
    ]).then(() => {
      isModelsLoaded = true;
      isModelsLoading = false;
      setStatus("ሞዴሎች በተሳካ ሁኔታ ተጭነዋል! ካሜራ እየተከፈተ ነው...");
      startVideo();
    }).catch(err => {
      console.error("የመጫን ስህተት:", err);
      isModelsLoading = false;
      setStatus("የሞዴል ፋይሎችን ማንበብ አልተቻለም። እባክዎ ገጹን Refresh ያድርጉ።");
    });

    // ገጹ ሲዘጋ ቪዲዮውን ለማቆም
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  const startVideo = () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: { width: 400, height: 300, facingMode: "user" } })
        .then(stream => { 
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          setStatus("ካሜራ ተከፍቷል፤ እባክዎ ፈገግ ይበሉ...");
        })
        .catch(err => {
          console.error(err);
          setStatus("እባክዎ ለብሮውዘርዎ የካሜራ ፈቃድ (Allow) ይስጡ");
        });
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
          
          if (smileValue > 0.75) { 
            setIsVerified(true);
            setStatus("በአሸናፊነት ተረጋግጧል! (Verified) 🎉");
            clearInterval(interval);
          }
        } else {
          setStatus("እባክዎ ፊትዎን ወደ ካሜራው ያቅናው...");
        }
      } catch (e) {
        // ፍሬሞች በሚቋረጡበት ጊዜ የሚመጡ ጥቃቅን ስህተቶችን በዝምታ ለማለፍ
      }
    }, 500);
  };

  return (
    <div className="liveness-container">
      <h2 className="liveness-title">POESSA ዲጂታል አገልግሎት</h2>
      <p className="liveness-subtitle">የጡረተኞች የህይវត្ត ማረጋገጫ ሲስተም</p>
      
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
