import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

const IMGBB_API_KEY = process.env.REACT_APP_IMGBB_API_KEY || "ebd592608f4dba1e8271bec8e920c408";

function CaptureSelfie({ onSuccess }) {
  const [image, setImage] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [faceDescriptor, setFaceDescriptor] = useState(null); // 🔥 አዲስ፡ የፊት አሻራ ዳታ መያዣ
  const [analyzerStatus, setAnalyzerStatus] = useState(""); // 🔥 አዲስ፡ የትንተና ሁኔታ ማሳያ
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

      // 2️⃣ 🔥 ወሳኝ ደረጃ፦ በፍሮንት-ኤንድ ካለው faceapi ላይ የፊት አሻራውን (Descriptor) መለካት
      if (window.faceapi) {
        setAnalyzerStatus("🔍 የፊት ገጽታን በቪዥን AI በመተንተን ላይ...");
        const imgElement = new Image();
        imgElement.src = base64Image;
        imgElement.onload = async () => {
          const detection = await window.faceapi
            .detectSingleFace(imgElement, new window.faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptor();

          if (detection && detection.descriptor) {
            // የፊት አሻራውን (Float32Array) ወደ መደበኛ Array በመቀየር ስቴት ላይ ማስቀመጥ
            const descriptorArray = Array.from(detection.descriptor);
            setFaceDescriptor(descriptorArray);
            setAnalyzerStatus("🟢 የፊት ገጽታ ትንተና በተሳካ ሁኔታ ተጠናቋል!");
          } else {
            setAnalyzerStatus("⚠️ ፎቶው ተነስቷል ነገር ግን ፊት በግልጽ አልታየም። እባክዎ ድጋሚ ይሞክሩ።");
          }
        };
      } else {
        setAnalyzerStatus("⚠️ የፊት መለኪያ ሞዴሎች አልተጫኑም።");
      }

    } catch (err) {
      alert("❌ አፕሎድ ወይም የፊት ትንተና አልተሳካም");
      setAnalyzerStatus("❌ ስህተት አጋጥሟል!");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: "20px", textAlign: "center", maxWidth: "400px", margin: "0 auto" }}>
      <h3>👤 ደረጃ 2 - Selfie Capture</h3>

      <div style={{ width: "220px", height: "220px", margin: "20px auto", borderRadius: "50%", overflow: "hidden", border: "4px solid #162447", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {uploading ? (
            <div>⏳ Uploading...</div>
        ) : image ? (
            <img src={image} alt="Selfie" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
            <video ref={videoRef} autoPlay playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        )}
      </div>

      {analyzerStatus && (
        <p style={{ fontSize: "13px", fontWeight: "500", color: faceDescriptor ? "#16a34a" : "#b45309", padding: "5px" }}>
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
            {/* 🔥 ማሻሻያ፦ አሁን በ onSuccess በኩል የፎቶውን ሊንክ እና የተለካውን faceDescriptor አብሮ ያስተላልፋል */}
            <button 
              onClick={() => onSuccess({ selfieUrl: image, currentDescriptor: faceDescriptor })} 
              disabled={!faceDescriptor}
              style={{ width: "100%", padding: "15px", background: faceDescriptor ? "#162447" : "#cbd5e1", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: faceDescriptor ? "pointer" : "not-allowed" }}
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
