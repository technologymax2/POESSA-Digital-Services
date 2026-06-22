import React, { useState, useRef } from "react";
import axios from "axios";

const API_BASE_URL = "https://poessa-digital-services-1.onrender.com";
const IMGBB_API_KEY = "ebd592608f4dba1e8271bec8e920c408";

function CaptureIDCard({ onSuccess }) {
  const [faydaNumber, setFaydaNumber] = useState("");
  const [image, setImage] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [scanStatus, setScanStatus] = useState("");
  const [verifyingInDB, setVerifyingInDB] = useState(false);
  const videoRef = useRef(null);

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setCameraActive(false);
  };

  const startCamera = async () => {
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        // ለሞባይል የተመቻቸ የካሜራ አቅጣጫ እና መጠን
        video: { facingMode: "environment", aspectRatio: 1.586 } 
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      alert("እባክዎ ለካሜራ ፈቃድ ይስጡ!");
      setCameraActive(false);
    }
  };

  const uploadIdToImgBB = async (base64Image) => {
    const formData = new FormData();
    // ImgBB ከ base64 ጋር ለመስራት በቀጥታ መቀበል አለበት
    formData.append("image", base64Image.split(",")[1]); 

    try {
      const response = await axios.post(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, formData);
      return response.data?.data?.url;
    } catch (error) {
      console.error("Upload Error:", error);
      return null;
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = 1280;
    canvas.height = 807; // 1280 / 1.586
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64Image = canvas.toDataURL("image/jpeg", 0.8);

    stopCamera();
    setScanStatus("⏳ በመሰቀል ላይ...");
    
    uploadIdToImgBB(base64Image).then(url => {
      if (url) {
        setImage(url);
        setScanStatus("✅ ምስሉ ተሰቅሏል!");
      } else {
        setScanStatus("⚠️ ስህተት፡ እንደገና ይሞክሩ።");
      }
    });
  };

  return (
    <div style={{ padding: "20px", maxWidth: "450px", margin: "0 auto", textAlign: "center" }}>
      <h3>🆔 የጡረተኛ መታወቂያ</h3>
      
      {/* የካሜራ መመልከቻ */}
      <div style={{ position: "relative", width: "100%", aspectRatio: "1.586", background: "#000", borderRadius: "15px", overflow: "hidden" }}>
        {cameraActive ? (
          <video ref={videoRef} autoPlay playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : image ? (
          <img src={image} alt="ID" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ color: "#fff", paddingTop: "50%" }}>ካሜራ ዝግጁ</div>
        )}
      </div>

      <button onClick={cameraActive ? capturePhoto : startCamera} style={{ width: "100%", padding: "15px", marginTop: "10px", background: "#162447", color: "#fff", border: "none", borderRadius: "8px" }}>
        {cameraActive ? "📸 ቅረጽ" : (image ? "🔄 እንደገና አንሳ" : "📸 ካሜራ ክፈት")}
      </button>

      <input 
        value={faydaNumber} 
        onChange={(e) => setFaydaNumber(e.target.value.replace(/\D/g, ""))} 
        placeholder="የፋይዳ ቁጥር (16 ዲጂት)" 
        maxLength="16"
        style={{ width: "100%", padding: "12px", margin: "15px 0", boxSizing: "border-box" }} 
      />

      <button onClick={async () => {
        setVerifyingInDB(true);
        onSuccess({ faydaNumber, idPhotoUrl: image });
      }} style={{ width: "100%", padding: "15px", background: "#22c55e", color: "#fff", border: "none", borderRadius: "8px" }}>
        ቀጥል
      </button>
      
      <p style={{ color: "#64748b" }}>{scanStatus}</p>
    </div>
  );
}

export default CaptureIDCard;
