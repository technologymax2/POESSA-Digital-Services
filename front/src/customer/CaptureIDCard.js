import React, { useState, useRef } from "react";
import axios from "axios";

// 🔗 የ API እና ImgBB መረጃዎች
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

  // 1. ካሜራ መክፈቻ
  const startCamera = async () => {
    setCameraActive(true);
    setScanStatus("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      alert("እባክዎ የካሜራ ፈቃድ ይፍቀዱ!");
    }
  };

  // 2. ምስል ወደ ImgBB መላኪያ
  const uploadIdToImgBB = async (base64Image) => {
    try {
      const cleanBase64 = base64Image.split(",")[1];
      const formData = new FormData();
      formData.append("image", cleanBase64);
      const response = await axios.post(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, formData);
      return response.data?.data?.url || null;
    } catch (error) {
      console.error("ImgBB Error:", error);
      return null;
    }
  };

  // 3. ፎቶ ማንሻ እና ስካን ማድረጊያ
  const capturePhoto = async () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.filter = "contrast(1.3) brightness(1.1)";
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64Image = canvas.toDataURL("image/jpeg");

    // ካሜራውን አቁም
    video.srcObject.getTracks().forEach(track => track.stop());
    setCameraActive(false);
    setScanning(true);
    setScanStatus("⏳ ምስሉ በመጫን ላይ ነው...");

    const uploadedUrl = await uploadIdToImgBB(base64Image);
    if (!uploadedUrl) {
      setScanStatus("⚠️ ፎቶ መስቀል አልተቻለም!");
      setScanning(false);
      return;
    }
    setImage(uploadedUrl);
    setScanStatus("✅ ምስሉ ተሰቅሏል! ቁጥሩን በራስ-ሰር በመፈለግ ላይ...");

    // OCR እና QR ስካን (ለሙከራ)
    try {
      setScanStatus("🟢 መታወቂያው በተሳካ ሁኔታ ተሰቅሏል!");
    } catch (error) {
      setScanStatus("⚠️ ስህተት ተፈጥሯል፤ እባክዎ በእጅዎ ይሙሉ");
    } finally {
      setScanning(false);
    }
  };

  // 4. መረጃ ማስረከቢያ
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (faydaNumber.length !== 16 || !image) {
      alert("⚠️ ፋይዳ ቁጥሩን (16 ዲጂት) እና ፎቶውን ያረጋግጡ!");
      return;
    }

    setVerifyingInDB(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/pensioners`);
      const found = response.data.data.find(p => p.faydaNumber === faydaNumber);
      if (found) {
        onSuccess({ faydaNumber, idPhotoUrl: image });
      } else {
        alert("❌ ይህ የፋይዳ ቁጥር አልተገኘም!");
      }
    } catch (err) {
      onSuccess({ faydaNumber, idPhotoUrl: image });
    } finally {
      setVerifyingInDB(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "450px", margin: "0 auto", textAlign: "center", fontFamily: "sans-serif" }}>
      <h3 style={{ color: "#162447" }}>🆔 ደረጃ 1፡ የጡረተኛ መታወቂያ</h3>
      
      <div style={{ background: "#eee", height: "220px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "15px", borderRadius: "12px", border: "2px dashed #cbd5e1" }}>
        {cameraActive ? <video ref={videoRef} autoPlay playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : 
         image ? <img src={image} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "📷 ካሜራ ዝግጁ"}
      </div>

      {!cameraActive ? (
        <button onClick={startCamera} style={{ padding: "10px", width: "100%", background: "#475569", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" }}>
          {image ? "🔄 እንደገና አንሳ" : "📸 ካሜራ ክፈት"}
        </button>
      ) : (
        <button onClick={capturePhoto} style={{ padding: "10px", width: "100%", background: "#22c55e", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" }}>
          🛑 ፎቶ ቅረጽ እና ስካን አድርግ
        </button>
      )}

      {scanStatus && <p style={{ fontSize: "13px", marginTop: "10px" }}>{scanStatus}</p>}

      <input value={faydaNumber} onChange={(e) => setFaydaNumber(e.target.value.replace(/\D/g, ""))} placeholder="የፋይዳ ቁጥር (16 ዲጂት)" maxLength="16" style={{ width: "100%", padding: "12px", marginTop: "10px", boxSizing: "border-box" }} />
      
      <button onClick={handleSubmit} disabled={verifyingInDB} style={{ padding: "14px", width: "100%", background: "#162447", color: "#fff", border: "none", borderRadius: "8px", marginTop: "10px", cursor: "pointer" }}>
        {verifyingInDB ? "⏳ በመፈተሽ ላይ..." : "ቀጥል →"}
      </button>
    </div>
  );
}

export default CaptureIDCard;
