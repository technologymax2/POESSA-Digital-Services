import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

const IMGBB_API_KEY = process.env.REACT_APP_IMGBB_API_KEY || "ebd592608f4dba1e8271bec8e920c408";

function CaptureSelfie({ onSuccess }) {
  const [image, setImage] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const videoRef = useRef(null);

  // ገጹ እንደተከፈተ ካሜራውን በራስ-ሰር ይክፈት
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
    canvas.getContext("2d").drawImage(video, 0, 0);
    const base64Image = canvas.toDataURL("image/jpeg", 0.7);

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", base64Image.split(",")[1]);
      const res = await axios.post(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, formData);
      setImage(res.data.data.url);
      stopCamera();
    } catch (err) {
      alert("❌ አፕሎድ አልተሳካም");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h3>👤 ደረጃ 2 - Selfie Capture</h3>

      {/* የካሜራ ማሳያ */}
      <div style={{ width: "220px", height: "220px", margin: "20px auto", borderRadius: "50%", overflow: "hidden", border: "4px solid #162447", background: "#f1f5f9" }}>
        {uploading ? (
            <div style={{ marginTop: "90px" }}>⏳ Uploading...</div>
        ) : image ? (
            <img src={image} alt="Selfie" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
            <video ref={videoRef} autoPlay playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        )}
      </div>

      {/* ቁልፎች */}
      {!image && !uploading && (
        <button onClick={captureSelfie} style={{ width: "100%", padding: "15px", background: "#22c55e", color: "#fff", border: "none", borderRadius: "8px" }}>
            📸 Capture
        </button>
      )}

      {image && (
        <>
            <button onClick={() => onSuccess(image)} style={{ width: "100%", padding: "15px", background: "#162447", color: "#fff", border: "none", borderRadius: "8px" }}>
                Face Match →
            </button>
            <button onClick={() => { setImage(""); startSelfieCamera(); }} style={{ width: "100%", padding: "10px", marginTop: "10px", background: "none", border: "1px solid #ccc" }}>
                🔄 እንደገና አንሳ
            </button>
        </>
      )}
    </div>
  );
}

export default CaptureSelfie;
