import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

const IMGBB_API_KEY = process.env.REACT_APP_IMGBB_API_KEY || "ebd592608f4dba1e8271bec8e920c408";

function CaptureSelfie({ onSuccess }) {
  const [image, setImage] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [faceDescriptor, setFaceDescriptor] = useState(null); 
  const [analyzerStatus, setAnalyzerStatus] = useState(""); 
  const videoRef = useRef(null);

  useEffect(() => {
    startSelfieCamera();
    return () => stopCamera();
  }, []);

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    }
    setCameraActive(false);
  };

  const startSelfieCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      console.error("Camera error:", err);
    }
  };

  const captureSelfie = async () => {
    const video = videoRef.current;
    if (!video || video.readyState !== 4) return alert("⏳ ካሜራ በመጫን ላይ...");

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);
    const base64Image = canvas.toDataURL("image/jpeg", 0.7);

    setUploading(true);
    setAnalyzerStatus("⏳ ፎቶውን ወደ ደመና እየሰቀልን እና ፊቱን እየመረመርን ነው...");
    
    try {
      // 1️⃣ ፎቶውን ወደ ImgBB መጫን
      const formData = new FormData();
      formData.append("image", base64Image.split(",")[1]);
      const res = await axios.post(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, formData);
      const uploadedUrl = res.data.data.url;
      setImage(uploadedUrl);
      stopCamera();

      // 2️⃣ የፊት አሻራውን (Descriptor) መለካት
      if (window.faceapi) {
        setAnalyzerStatus("🔍 የፊት ገጽታን በቪዥን AI በመተንተን ላይ...");
        
        const imgElement = new Image();
        imgElement.src = base64Image;
        imgElement.onload = async () => {
          try {
            const faceapi = window.faceapi;
            // 🌟 [ዋና ማሻሻያ] ትክክለኛውን የ CDN ሞዴል አድራሻ እዚህም መጠቀም
            const MODEL_URL = "https://justadudewhohacks.github.io/face-api.js/models";

            // ሞዴሎቹ አስቀድመው ካልተጫኑ እዚህ ላይ መጫን
            if (!faceapi.nets.tinyFaceDetector.params || !faceapi.nets.faceLandmark68Net.params || !faceapi.nets.faceRecognitionNet.params) {
              await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
              await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
              await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
            }

            const detection = await faceapi
              .detectSingleFace(imgElement, new faceapi.TinyFaceDetectorOptions())
              .withFaceLandmarks()
              .withFaceDescriptor();

            if (detection && detection.descriptor) {
              const descriptorArray = Array.from(detection.descriptor);
              setFaceDescriptor(descriptorArray);
              setAnalyzerStatus("🟢 የፊት ገጽታ ትንተና በተሳካ ሁኔታ ተጠናቋል!");
            } else {
              setAnalyzerStatus("⚠️ ፎቶው ተነስቷል ነገር ግን ፊት በግልጽ አልታየም። እባክዎ ድጋሚ ይሞክሩ።");
              // ሴፍቲ ኔት፡ ፊት ባይገኝ እንኳ ተጠቃሚው እንዲያልፍ ባዶ አሻራ መፍቀድ
              setFaceDescriptor([]); 
            }
          } catch (innerErr) {
            console.error("Face Analysis Inner Error:", innerErr);
            setAnalyzerStatus("⚠️ የፊት መለኪያው ዘገየ፤ ነገር ግን 'Face Match'ን ተጭነው ማለፍ ይችላሉ።");
            setFaceDescriptor([]); // ሴፍቲ ኔት
          } finally {
            setUploading(false); // ስፒነሩን እዚህ ማቆም
          }
        };
      } else {
        setAnalyzerStatus("⚠️ የፊት መለያ ሲስተም (Script) አልተጫነም።");
        setFaceDescriptor([]); 
        setUploading(false);
      }

    } catch (err) {
      console.error(err);
      alert("❌ አፕሎድ ወይም የፊት ትንተና አልተሳካም");
      setAnalyzerStatus("❌ ስህተት አጋጥሟል!");
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: "20px", textAlign: "center", maxWidth: "400px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <h3>👤 ደረጃ 2 - Selfie Capture</h3>

      <div style={{ width: "220px", height: "220px", margin: "20px auto", borderRadius: "50%", overflow: "hidden", border: "4px solid #162447", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {uploading ? (
            <div style={{ fontWeight: "bold", color: "#162447" }}>⏳ እባክዎ ይጠብቁ...</div>
        ) : image ? (
            <img src={image} alt="Selfie" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
            <video ref={videoRef} autoPlay playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        )}
      </div>

      {analyzerStatus && (
        <p style={{ fontSize: "13px", fontWeight: "500", color: faceDescriptor ? "#16a34a" : "#b45309", backgroundColor: "#f8fafc", padding: "8px", borderRadius: "6px" }}>
          {analyzerStatus}
        </p>
      )}

      {!image && !uploading && (
        <button onClick={captureSelfie} style={{ width: "100%", padding: "15px", background: "#22c55e", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
            📸 Capture Photo
        </button>
      )}

      {image && (
        <>
            <button 
              onClick={() => onSuccess({ selfieUrl: image, currentDescriptor: faceDescriptor })} 
              disabled={uploading}
              style={{ width: "100%", padding: "15px", background: "#162447", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}
            >
                Face Match →
            </button>
            <button onClick={() => { setImage(""); setFaceDescriptor(null); setAnalyzerStatus(""); startSelfieCamera(); }} style={{ width: "100%", padding: "10px", marginTop: "10px", background: "none", border: "1px solid #ccc", borderRadius: "8px", cursor: "pointer" }}>
                🔄 እንደገና አንሳ
            </button>
        </>
      )}
    </div>
  );
}

export default CaptureSelfie;
