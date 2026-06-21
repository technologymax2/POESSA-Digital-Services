import React, { useState, useRef } from "react";
import axios from "axios"; // 💡 ፎቶውን ወደ ImgBB ለመስቀል ተጨምሯል

// 🔑 ያንተ የ ImgBB API ቁልፍ
const IMGBB_API_KEY = "ebd592608f4dba1e8271bec8e920c408";

function CaptureSelfie({ onSuccess }) {
  const [image, setImage] = useState(null); // 🔗 እዚህ ላይ የመጨረሻው የ ImgBB URL ይቀመጣል
  const [cameraActive, setCameraActive] = useState(false);
  const [uploading, setUploading] = useState(false); // ⏳ የጭነት ሁኔታን ለማሳየት
  const videoRef = useRef(null);

  const startSelfieCamera = async () => {
    setImage(null);
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user" } // የፊት ለፊት (Selfie) ካሜራን ይከፍታል
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error("💡 ሴልፊ ካሜራ መክፈት አልተቻለም፦", err);
      alert("እባክዎ የካሜራ ፈቃድ (Permission) ይፍቀዱ!");
    }
  };

  /* ==========================================================================
     📸 ፎቶን ወደ ImgBB ሰቅሎ እውነተኛ ሊንክ (URL) ማምጫ ተግባር
  ========================================================================== */
  const uploadSelfieToImgBB = async (base64Image) => {
    try {
      let cleanBase64 = base64Image;
      if (base64Image.includes("base64,")) {
        cleanBase64 = base64Image.split("base64,")[1];
      }

      const formData = new URLSearchParams();
      formData.append("image", cleanBase64);

      const response = await axios.post(
        `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
        formData
      );

      if (response.data && response.data.data && response.data.data.url) {
        return response.data.data.url; // 🔗 የተፈጠረው የፎቶ ሊንክ
      }
      return null;
    } catch (error) {
      console.error("❌ ImgBB Selfie Upload Error:", error);
      return null;
    }
  };

  const captureSelfie = async () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const base64Image = canvas.toDataURL("image/jpeg");

    // ካሜራውን መዝጋት
    const stream = video.srcObject;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setCameraActive(false);
    
    // ⏳ ፎቶውን ወደ ImgBB መጫን መጀመር
    setUploading(true);
    const uploadedUrl = await uploadSelfieToImgBB(base64Image);
    setUploading(false);

    if (uploadedUrl) {
      setImage(uploadedUrl); // 🌟 አሁን ስቴቱ ላይ የሚቀመጠው ንጹህ የ ImgBB ሊንክ ነው!
    } else {
      alert("⚠️ ፎቶውን ወደ ደመና (ImgBB) መጫን አልተቻለም። እባክዎ እንደገና ይሞክሩ።");
    }
  };

  const handleNext = () => {
    if (!image) {
      alert("⚠️ እባክዎ መጀመሪያ የጡረተኛውን የራስ ፎቶ (Selfie) ያንሱ!");
      return;
    }
    // 💡 ወደሚቀጥለው ገጽ የሚተላለፈው 'image' አሁን ንጹህ የ ImgBB URL ነው!
    onSuccess(image);
  };

  return (
    <div style={{ padding: "20px", maxWidth: "450px", margin: "0 auto", textAlign: "center", fontFamily: "sans-serif" }}>
      <h3 style={{ color: "#162447" }}>👤 ደረጃ 2፡ የጡረተኛው የራስ ፎቶ (Selfie)</h3>
      <p style={{ color: "#64748b", fontSize: "14px" }}>እባክዎ የጡረተኛውን ቀጥተኛ የፊት ገጽታ ፎቶ ያንሱ</p>

      {/* 📸 ክብ የፎቶ ማሳያ ክፈፍ */}
      <div style={{ background: "#f1f5f9", borderRadius: "50%", width: "200px", height: "200px", margin: "25px auto", overflow: "hidden", position: "relative", border: "4px solid #162447", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }}>
        {cameraActive && <video ref={videoRef} autoPlay playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
        {image && !cameraActive && <img src={image} alt="Selfie Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
        {!cameraActive && !image && !uploading && <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#94a3b8", fontSize: "40px" }}>👤</div>}
        {uploading && <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#162447", fontSize: "14px", fontWeight: "bold", background: "#e2e8f0" }}>⏳ ImgBB ላይ...</div>}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {!cameraActive ? (
          <button type="button" onClick={startSelfieCamera} disabled={uploading} style={{ background: "#475569", color: "#fff", padding: "12px", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
            {image ? "🔄 እንደገና በትክክል አንሳ" : "🤳 የራስ ፎቶ ካሜራ ክፈት"}
          </button>
        ) : (
          <button type="button" onClick={captureSelfie} style={{ background: "#22c55e", color: "#fff", padding: "12px", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
            📸 ፎቶ አንሳ
          </button>
        )}

        {image && !uploading && (
          <button type="button" onClick={handleNext} style={{ background: "#162447", color: "#fff", padding: "14px", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", marginTop: "15px" }}>
            ወደ ፊት ማነፃፀሪያ ደረጃ እለፍ (Face Match) →
          </button>
        )}
      </div>
    </div>
  );
}

export default CaptureSelfie;
