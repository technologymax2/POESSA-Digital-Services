import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from '@vladmandic/face-api';


function LivenessTest() {
  const videoRef = useRef(null);
  const intervalRef = useRef(null);

  const [challenge] = useState("እባክዎ ፈገግ ይበሉ 😊");
  const [status, setStatus] = useState("ሞዴሎች እየተጫኑ ነው...");
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    loadModels();

    return () => {
      clearInterval(intervalRef.current);
      stopCamera();
    };
  }, []);

  const loadModels = async () => {
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.faceExpressionNet.loadFromUri('/models')
      ]);

      setStatus("ሞዴሎች ተጭነዋል፤ ካሜራ እየተከፈተ ነው...");
      startVideo();
    } catch (err) {
      setStatus("የሞዴል ስህተት: " + err.message);
    }
  };

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 400,
          height: 300,
          facingMode: "user"
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setStatus("እባክዎ የካሜራ ፈቃድ ይስጡ");
      console.error(err);
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;

    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleVideoPlay = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(async () => {
      if (!videoRef.current || isVerified) return;

      try {
        const detection = await faceapi
          .detectSingleFace(
            videoRef.current,
            new faceapi.TinyFaceDetectorOptions()
          )
          .withFaceLandmarks()
          .withFaceExpressions();

        if (!detection) {
          setStatus("እባክዎ ፊትዎን ወደ ካሜራ ያቅርቡ");
          return;
        }

        setStatus("ፊት ተገኝቷል፤ ፈገግ ይበሉ 😊");

        const smileScore = detection.expressions.happy;

        if (smileScore > 0.8) {
          setIsVerified(true);
          setStatus("በአሸናፊነት ተረጋግጧል! 🎉");

          clearInterval(intervalRef.current);
          stopCamera();
        }
      } catch (error) {
        console.error("Face Detection Error:", error);
      }
    }, 700);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-900 text-white">
      <h2 className="text-xl font-bold mb-2">
        POESSA ዲጂታል አገልግሎት
      </h2>

      <p className="text-xs text-slate-400 mb-6">
        የጡረተኞች የህይወት ማረጋገጫ ሲስተም
      </p>

      <div className="p-4 bg-amber-400 text-black font-bold rounded-2xl mb-6 w-full max-w-sm text-center shadow-lg">
        {challenge}
      </div>

      <div className="relative rounded-3xl overflow-hidden border-4 border-blue-600 w-full max-w-sm aspect-[4/3] bg-black shadow-2xl">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          onPlay={handleVideoPlay}
          className="w-full h-full object-cover"
        />

        {isVerified && (
          <div className="absolute inset-0 bg-emerald-500/20 backdrop-blur-sm flex items-center justify-center">
            <span className="bg-emerald-600 px-6 py-3 rounded-full font-bold">
              ✓ ተረጋግጧል
            </span>
          </div>
        )}
      </div>

      <p
        className={`mt-6 text-center font-semibold ${
          isVerified
            ? 'text-emerald-400 text-base'
            : 'text-cyan-400 text-sm'
        }`}
      >
        {status}
      </p>
    </div>
  );
}

export default LivenessTest;
