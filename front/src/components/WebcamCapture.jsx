import React, { useRef, useState, useCallback, useEffect } from "react";
import Webcam from "react-webcam";

const faceapi = window.faceapi;

const WebcamCapture = ({ onCapture, preview }) => {
  const webcamRef = useRef(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [facingMode, setFacingMode] = useState("user");
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [status, setStatus] = useState("Idle");

  // 1. Efficient Model Loading
  useEffect(() => {
    const loadModels = async () => {
      try {
        setStatus("Loading models...");
        const MODEL_URL = process.env.REACT_APP_MODEL_URL || "/models";
        
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
          faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL),
        ]);
        
        setIsModelLoaded(true);
        setStatus("Ready");
      } catch (error) {
  console.error("Model loading error:", error);
  alert(error.message);
  setStatus("Error loading models");
}
    };
    loadModels();
  }, []);

  // 2. Optimized Capture Logic
  const capture = useCallback(async () => {
    if (!isModelLoaded || !webcamRef.current) return;

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    try {
      setStatus("Analyzing...");
      
      // Load image and convert for processing
      const img = await faceapi.fetchImage(imageSrc);
      
      const detection = await faceapi.detectSingleFace(
        img, 
        new faceapi.TinyFaceDetectorOptions()
      )
      .withFaceLandmarks()
      .withFaceDescriptor()
      .withFaceExpressions()
      .withAgeAndGender();

      if (!detection) {
        setStatus("Ready");
        alert("⚠️ ፊት አልተገኘም! እባክዎ በደንብ ብርሃን ባለበት ቦታ ይሞክሩ።");
        return;
      }

      // Convert to File for upload
      const response = await fetch(imageSrc);
      const blob = await response.blob();
      const file = new File([blob], `capture_${Date.now()}.jpg`, { type: "image/jpeg" });

      setCameraOn(false);
      setStatus("Ready");
      if (onCapture) {
  onCapture(file, imageSrc, detection.descriptor);
}
    } catch (err) {
      setStatus("Ready");
      alert("ስህተት ተፈጠረ። እባክዎ እንደገና ይሞክሩ።");
    }
  }, [onCapture, isModelLoaded]);

  return (
    <div className="w-full max-w-md mx-auto p-4">
      {!cameraOn && !preview && (
        <button 
          type="button"
  onClick={() => setCameraOn(true)}
  disabled={!isModelLoaded}
          className="w-full bg-blue-600 disabled:bg-gray-400 text-white py-3 rounded-xl font-bold transition-all hover:bg-blue-700"
        >
          {isModelLoaded ? "📷 ካሜራ ይክፈቱ" : "⌛ AI ሞዴሎችን በመጫን ላይ..."}
        </button>
      )}

      {cameraOn && (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border-4 border-blue-100">
            <Webcam 
              ref={webcamRef} 
              audio={false} 
              screenshotFormat="image/jpeg" 
              videoConstraints={{ facingMode }} 
              className="w-full aspect-square object-cover" 
            />
          </div>
          <div className="flex gap-2">
            <button
  type="button"
  onClick={() => setFacingMode(prev => prev === "user" ? "environment" : "user")}
  className="p-3 bg-gray-200 rounded-lg"
>🔄</button>
            <button
  type="button"
  onClick={capture}
  className="flex-1 bg-green-600 text-white font-semibold py-3 rounded-lg hover:bg-green-700"
>{status}</button>
            <button
  type="button"
  onClick={() => setCameraOn(false)}
  className="px-6 bg-red-500 text-white rounded-lg"
>ሰርዝ</button>
          </div>
        </div>
      )}
      
      {preview && !cameraOn && (
        <div className="space-y-3">
          <img src={preview} alt="Result" className="w-full rounded-lg shadow-lg" />
          <button
  type="button"
  onClick={() => setCameraOn(true)}
  className="w-full bg-yellow-500 text-white py-2 rounded-lg font-bold"
>እንደገና ይሞክሩ</button>
        </div>
      )}
    </div>
  );
};

export default WebcamCapture;
