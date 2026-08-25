import React, { useRef, useState, useCallback, useEffect } from "react";
import Webcam from "react-webcam";

const FaceProcessor = ({ onResult }) => {
  const webcamRef = useRef(null);
  
  const [cameraOn, setCameraOn] = useState(false);
  const [preview, setPreview] = useState(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [status, setStatus] = useState("Loading models...");

  // 1. ሞዴሎችን በቅደም ተከተል መጫን
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = '/models';
        await window.faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await window.faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await window.faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        await window.faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
        await window.faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL);
        
        setIsModelLoaded(true);
        setStatus("Ready");
        console.log("✅ All models loaded successfully!");
      } catch (e) {
        setStatus("Error loading models");
        alert("ሞዴሎቹን መጫን አልተቻለም።");
      }
    };
    loadModels();
  }, []);

  // 2. የጋራ የፊት መለየት ሂደት
  const processImage = async (imageSrc, file = null) => {
    setStatus("Analyzing...");
    const img = await window.faceapi.fetchImage(imageSrc);
    
    // ፊትን መለየት እና መረጃዎችን መውሰድ
    const detection = await window.faceapi.detectSingleFace(
      img, 
      new window.faceapi.TinyFaceDetectorOptions()
    )
    .withFaceLandmarks()
    .withFaceDescriptor()
    .withFaceExpressions()
    .withAgeAndGender();

    if (!detection) {
      alert("⚠️ ፊት አልተገኘም! እባክዎ ፊትዎን በግልጽ ያሳዩ።");
      setStatus("Ready");
      return;
    }
    
    // ውጤቱን ለፓረንት ኮምፖነንት መላክ
if (onResult) {
  onResult(
    file,
    imageSrc,
    detection.descriptor
  );
}

setStatus("Ready");
  };

  // 3. የካሜራ ቀረጻ
  const capture = useCallback(async () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) processImage(imageSrc);
  }, []);

  // 4. የፋይል መምረጫ
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
        processImage(reader.result, file);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <div className="text-center font-bold p-2 bg-gray-100 rounded">Status: {status}</div>

      {/* የፋይል መምረጫ እና ካሜራ መቀያየሪያ */}
      {!cameraOn && !preview && (
        <div className="space-y-3">
          <label className="block border-2 border-dashed p-6 cursor-pointer text-center hover:bg-gray-50">
            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            <p>📁 Click to Upload Image</p>
          </label>
          <button 
            onClick={() => setCameraOn(true)} 
            disabled={!isModelLoaded}
            className="w-full bg-blue-600 text-white p-2 rounded disabled:bg-gray-400"
          >
            {isModelLoaded ? "Open Camera" : "Loading AI..."}
          </button>
        </div>
      )}

      {/* የካሜራ UI */}
      {cameraOn && (
        <div className="space-y-2">
          <Webcam ref={webcamRef} screenshotFormat="image/jpeg" className="w-full rounded" />
          <div className="flex gap-2">
            <button onClick={capture} className="flex-1 bg-green-600 text-white p-2 rounded">Capture</button>
            <button onClick={() => setCameraOn(false)} className="flex-1 bg-gray-600 text-white p-2 rounded">Cancel</button>
          </div>
        </div>
      )}

      {/* የፕሪቪው UI */}
      {preview && (
        <div className="space-y-2">
          <img src={preview} alt="Preview" className="w-full h-64 object-cover rounded" />
          <button onClick={() => { setPreview(null); setStatus("Ready"); }} className="w-full bg-red-600 text-white p-2 rounded">Remove Image</button>
        </div>
      )}
    </div>
  );
};

export default FaceProcessor;
