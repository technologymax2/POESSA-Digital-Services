import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

const API_BASE_URL = "https://poessa-digital-services-1.onrender.com";
const IMGBB_API_KEY = "ebd592608f4dba1e8271bec8e920c408";

function CaptureIDCard({ onSuccess }) {
  const [faydaNumber, setFaydaNumber] = useState("");
  const [image, setImage] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [scanStatus, setScanStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const videoRef = useRef(null);

  // 1. ካሜራን በአስተማማኝ ሁኔታ የሚዘጋ ፈንክሽን (Resource Release)
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => {
        track.stop(); // ካሜራውን ያጠፋል
      });
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // 2. ካሜራ መክፈቻ (Mobile Optimized)
  const startCamera = async () => {
    try {
      setScanStatus("⏳ ካሜራው እየተዘጋጀ ነው...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      
      setCameraActive(true);
      // ትንሽ መዘግየት ካሜራው በስልክ ላይ ለስላሳ እንዲሆን ይረዳል
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 300);
    } catch (err) {
      console.error(err);
      setScanStatus("❌ ካሜራ ፈቃድ አልተገኘም!");
    }
  };

  // 3. ፎቶ ማንሻ እና ImgBB መላኪያ
  const capturePhoto = async () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64Image = canvas.toDataURL("image/jpeg", 0.85);

    // 💡 መፍትሔ፦ ፎቶ እንደተነሳ ወዲያውኑ ካሜራውን እናጥፋለን
    stopCamera();
    setLoading(true);
    setScanStatus("⏳ ምስሉ ወደ ሰርቨር እየተጫነ ነው...");

    try {
      const cleanBase64 = base64Image.split(",")[1];
      const formData = new FormData();
      formData.append("image", cleanBase64);

      const response = await axios.post(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, formData);
      setImage(response.data.data.url);
      setScanStatus("✅ ምስሉ ተሰቅሏል!");
    } catch (error) {
      setScanStatus("❌ ምስል መስቀል አልተቻለም፣ ድጋሚ ይሞክሩ።");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (faydaNumber.length !== 16 || !image) {
      alert("⚠️ ፋይዳ ቁጥሩን እና ፎቶውን ያረጋግጡ!");
      return;
    }
    onSuccess({ faydaNumber, idPhotoUrl: image });
  };

  return (
    <div style={{ padding: "20px", maxWidth: "450px", margin: "0 auto", textAlign: "center", fontFamily: "sans-serif" }}>
      <h3 style={{ color: "#162447" }}>🆔 ደረጃ 1፡ የጡረተኛ መታወቂያ</h3>
      
      {/* ካሜራ ማሳያ */}
      <div style={{ background: "#000", height: "250px", borderRadius: "12px", overflow: "hidden", marginBottom: "15px", position: "relative" }}>
        {cameraActive ? (
          <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : image ? (
          <img src={image} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ color: "#fff", paddingTop: "100px" }}>📷 ካሜራ ዝግጁ</div>
        )}
      </div>

      {!cameraActive && !image && (
        <button onClick={startCamera} style={{ padding: "12px", width: "100%", background: "#475569", color: "#fff", border: "none", borderRadius: "8px" }}>
          📸 ካሜራ ክፈት
        </button>
      )}

      {cameraActive && (
        <button onClick={capturePhoto} style={{ padding: "12px", width: "100%", background: "#22c55e", color: "#fff", border: "none", borderRadius: "8px" }}>
          🛑 ፎቶ ቅረጽ
        </button>
      )}

      {scanStatus && <p style={{ fontSize: "12px", color: "#555" }}>{scanStatus}</p>}

      <input 
        value={faydaNumber} 
        onChange={(e) => setFaydaNumber(e.target.value.replace(/\D/g, ""))} 
        placeholder="የፋይዳ ቁጥር (16 ዲጂት)" 
        maxLength="16"
        style={{ width: "100%", padding: "12px", marginTop: "10px", boxSizing: "border-box" }} 
      />
      
      <button 
        onClick={handleSubmit} 
        disabled={loading} 
        style={{ padding: "14px", width: "100%", background: "#162447", color: "#fff", marginTop: "10px", border: "none", borderRadius: "8px" }}
      >
        {loading ? "⏳ በመጠባበቅ ላይ..." : "ቀጥል →"}
      </button>
    </div>
  );
}

export default CaptureIDCard;
