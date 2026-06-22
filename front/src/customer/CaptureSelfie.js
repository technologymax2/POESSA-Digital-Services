import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

// API ቁልፍ (በ .env ፋይልህ ውስጥ ቢቀመጥ ይመረጣል)
const IMGBB_API_KEY = process.env.REACT_APP_IMGBB_API_KEY || "ebd592608f4dba1e8271bec8e920c408";

function CaptureSelfie({ onSuccess }) {
  const [image, setImage] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const videoRef = useRef(null);

  // 1. ገጹ እንደተከፈተ ካሜራውን በራስ-ሰር ለመክፈት
  useEffect(() => {
    startSelfieCamera();
    // ገጹ ሲዘጋ ካሜራውን ለማጥፋት
    return () => stopCamera();
  }, []);

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const startSelfieCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 480 }, height: { ideal: 480 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      console.error("Camera error:", err);
      alert("❌ ካሜራ መክፈት አልተቻለም። እባክዎ ለካሜራ ፍቃድ ይስጡ።");
    }
  };

  const captureSelfie = async () => {
    const video = videoRef.current;
    if (!video || video.readyState !== 4) {
      alert("⏳ ካሜራው በመጫን ላይ ነው... እባክዎ ይጠብቁ።");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const base64Image = canvas.toDataURL("image/jpeg", 0.7);

    stopCamera();
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("image", base64Image.split(",")[1]);

      const response = await axios.post(
        `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
        formData
      );

      if (response.data?.data?.url) {
        setImage(response.data.data.url);
      } else {
        throw new Error("Upload failed");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("❌ ፎቶውን መጫን አልተቻለም።");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ maxWidth: "450px", margin: "0 auto", padding: "20px", textAlign: "center" }}>
      <h3>👤 ደረጃ 2 - Selfie Capture</h3>

      <div style={{ width: "220px", height: "220px", margin: "20px auto", borderRadius: "50%", overflow: "hidden", border: "4px solid #162447", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {cameraActive ? (
          <video ref={videoRef} autoPlay playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : image ? (
          <img src={image} alt="Selfie" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : uploading ? (
          <p>⏳ በመጫን ላይ...</p>
        ) : (
          <div style={{ fontSize: "50px" }}>👤</div>
        )}
      </div>

      {/* የካሜራ ቁልፎች */}
      {!cameraActive && !image && !uploading && (
        <button onClick={startSelfieCamera} style={{ width: "100%", padding: "14px", background: "#475569", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" }}>
          🤳 ካሜራ ክፈት
        </button>
      )}

      {cameraActive && (
        <button onClick={captureSelfie} style={{ width: "100%", padding: "14px", background: "#22c55e", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" }}>
          📸 Capture
        </button>
      )}

      {/* ውጤት ከታየ በኋላ የሚታዩ አማራጮች */}
      {image && !uploading && (
        <>
          <button onClick={() => onSuccess(image)} style={{ width: "100%", padding: "14px", background: "#162447", color: "#fff", border: "none", borderRadius: "8px", marginBottom: "10px" }}>
            Face Match →
          </button>
          <button onClick={startSelfieCamera} style={{ width: "100%", padding: "10px", background: "transparent", color: "#64748b", border: "1px solid #64748b", borderRadius: "8px" }}>
            🔄 እንደገና አንሳ
          </button>
        </>
      )}
    </div>
  );
}

export default CaptureSelfie;
