import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';

function LivenessTest() {
  const videoRef = useRef(null);
  const [challenge, setChallenge] = useState("እባክዎ ፈገግ ይበሉ (Smile Please)");
  const [status, setStatus] = useState("የፊት መለያ ሞዴሎች እየተጫኑ ነው...");
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
      faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
      faceapi.nets.faceExpressionNet.loadFromUri('/models')
    ]).then(() => {
      setStatus("ሞዴሎች ተጭነዋል፤ ካሜራ እየተከፈተ ነው...");
      startVideo();
    }).catch(err => setStatus("የሞዴል ስህተት፡ " + err));
  }, []);

  const startVideo = () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: { width: 400, height: 300 } })
        .then(stream => { if (videoRef.current) videoRef.current.srcObject = stream; })
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
          if (smileValue > 0.80) { 
            setIsVerified(true);
            setStatus("በአሸናፊነት ተረጋግጧል! (Verified) 🎉");
            clearInterval(interval);
          }
        } else {
          setStatus("እባክዎ ፊትዎን ወደ ካሜራው ያቅርቡ");
        }
      } catch (e) {
        // ማንኛውንም በሂደት ላይ የሚመጣ ስህተት በዝምታ ለማለፍ
      }
    }, 600);
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-slate-900 min-h-screen text-white">
      <h2 className="text-xl font-bold mb-2">POESSA ዲጂታል አገልግሎት</h2>
      <p className="text-xs text-slate-400 mb-6">የጡረተኞች የህይወት ማረጋገጫ ሲስተም</p>
      
      <div className="p-4 bg-amber-400 text-black font-black rounded-2xl mb-6 w-full max-w-sm text-center shadow-lg text-lg">
        {challenge}
      </div>
      
      <div className="relative rounded-3xl overflow-hidden border-4 border-blue-600 w-full max-w-sm aspect-[4/3] shadow-2xl bg-black">
        <video ref={videoRef} autoPlay muted onPlay={handleVideoPlay} className="w-full h-full object-cover" playsInline />
        {isVerified && (
          <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center backdrop-blur-sm">
            <span className="bg-emerald-600 text-white font-bold px-6 py-3 rounded-full text-sm">✓ ተረጋግጧል</span>
          </div>
        )}
      </div>
      
      <p className={`mt-6 font-semibold text-center text-sm ${isVerified ? 'text-emerald-400 text-base' : 'text-cyan-400'}`}>
        {status}
      </p>
    </div>
  );
}

export default LivenessTest;
