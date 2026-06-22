import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

const API_BASE_URL = "https://poessa-digital-services-1.onrender.com";
const IMGBB_API_KEY = "ebd592608f4dba1e8271bec8e920c408";

function CaptureIDCard({ onSuccess }) {
  const [faydaNumber, setFaydaNumber] = useState("");
  const [image, setImage] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [scanStatus, setScanStatus] = useState("");
  const [scanning, setScanning] = useState(false);
  const [verifyingInDB, setVerifyingInDB] = useState(false);
  const videoRef = useRef(null);

  // የካሜራ ስትሪምን በአግባቡ ለመዝጋት (ጥቁር ስክሪን ችግርን ይፈታል)
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
    setCameraActive(false);
  };

  const startCamera = async () => {
    setCameraActive(true);
    setScanStatus("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error("ካሜራ መክፈት አልተቻለም:", err);
      alert("እባክዎ የካሜራ ፈቃድ ይስጡ!");
    }
  };

  const uploadIdToImgBB = async (base64Image, retryCount = 0) => {
  try {
    // 1. መረጃውን በደንብ ማጽዳት
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
    
    const formData = new FormData();
    formData.append("image", base64Data);

    const response = await axios.post(
      `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data", // ይሄ ወሳኝ ነው
        },
        timeout: 20000,
      }
    );
    return response.data?.data?.url || null;
  } catch (error) {
    if (retryCount < 2) {
      return await uploadIdToImgBB(base64Image, retryCount + 1);
    }
    // ስህተቱን በኮንሶል ለማየት እንዲያግዘን
    console.error("❌ ImgBB Detailed Error:", error.response?.data || error.message);
    return null;
  }
};



  const capturePhoto = async () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 400;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64Image = canvas.toDataURL("image/jpeg", 0.6);

    stopCamera();
    setScanning(true);
    setScanStatus("⏳ ምስሉ ወደ ሰርቨር በመሰቀል ላይ ነው...");

    const uploadedUrl = await uploadIdToImgBB(base64Image);
    if (uploadedUrl) {
      setImage(uploadedUrl);
      setScanStatus("✅ ምስሉ ተሰቅሏል! መረጃውን ያረጋግጡ።");
    } else {
      setScanStatus("⚠️ ስህተት፡ ፎቶ መስቀል አልተቻለም።");
    }
    setScanning(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (faydaNumber.length !== 16 || !image) {
      alert("⚠️ ፋይዳ ቁጥሩን (16 ዲጂት) እና ፎቶውን ያረጋግጡ!");
      return;
    }

    setVerifyingInDB(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/pensioners`);
      const found = response.data?.data?.find(p => p.faydaNumber === faydaNumber);
      if (found) {
        onSuccess({ faydaNumber, idPhotoUrl: image });
      } else {
        alert("❌ ይህ የፋይዳ ቁጥር በሲስተሙ አልተገኘም!");
      }
    } catch (err) {
      console.error("DB Error:", err);
      onSuccess({ faydaNumber, idPhotoUrl: image });
    } finally {
      setVerifyingInDB(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "450px", margin: "0 auto", textAlign: "center", fontFamily: "sans-serif" }}>
      <h3 style={{ color: "#162447" }}>🆔 ደረጃ 1፡ የጡረተኛ መታወቂያ መረጃ</h3>
      
      <div style={{ background: "#f1f5f9", borderRadius: "12px", height: "220px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", border: "2px dashed #cbd5e1" }}>
        {cameraActive ? (
          <video ref={videoRef} autoPlay playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : image ? (
          <img src={image} alt="ID" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <span style={{ color: "#94a3b8" }}>📷 ካሜራ ዝግጁ</span>
        )}
      </div>

      <div style={{ marginTop: "20px" }}>
        {!cameraActive ? (
          <button type="button" onClick={startCamera} style={{ width: "100%", padding: "12px", background: "#475569", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" }}>
            {image ? "🔄 እንደገና አንሳ" : "📸 ካሜራ ክፈት"}
          </button>
        ) : (
          <button type="button" onClick={capturePhoto} style={{ width: "100%", padding: "12px", background: "#22c55e", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
            🛑 ፎቶ ቅረጽ
          </button>
        )}
      </div>

      <p style={{ fontSize: "13px", margin: "10px 0", color: "#64748b" }}>{scanStatus}</p>

      <input 
        value={faydaNumber} 
        onChange={(e) => setFaydaNumber(e.target.value.replace(/\D/g, ""))} 
        placeholder="የፋይዳ ቁጥር (16 ዲጂት)" 
        maxLength="16" 
        style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box" }} 
      />

      <button 
        onClick={handleSubmit} 
        disabled={verifyingInDB} 
        style={{ width: "100%", padding: "14px", marginTop: "15px", background: "#162447", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" }}
      >
        {verifyingInDB ? "⏳ በመፈተሽ ላይ..." : "ቀጥል →"}
      </button>
    </div>
  );
}

export default CaptureIDCard;
