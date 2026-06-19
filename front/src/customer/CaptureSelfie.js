import React, { useState, useRef } from "react";

function CaptureSelfie({ onSuccess }) {
  const [image, setImage] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);

  const startSelfieCamera = async () => {
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user" } // የፊት ለፊት (Selfie) ካሜራን ይከፍታል
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error("ሴልፊ ካሜራ መክፈት አልተቻለም፦", err);
      alert("እባክዎ የካሜራ ፌርሚሽን ይፍቀዱ!");
    }
  };

  const captureSelfie = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const base64Image = canvas.toDataURL("image/jpeg");
    setImage(base64Image);

    const stream = video.srcObject;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setCameraActive(false);
  };

  const handleNext = () => {
    if (!image) {
      alert("⚠️ እባክዎ የጡረተኛውን የራስ ፎቶ (Selfie) ያንሱ!");
      return;
    }
    onSuccess(image);
  };

  return (
    <div style={{ padding: "20px", maxWidth: "450px", margin: "0 auto", textAlign: "center", fontFamily: "sans-serif" }}>
      <h3 style={{ color: "#162447" }}>👤 ደረጃ 2፡ የጡረተኛው የራስ ፎቶ (Selfie)</h3>
      <p style={{ color: "#64748b", fontSize: "14px" }}>እባክዎ የጡረተኛውን ቀጥተኛ የፊት ገጽታ ፎቶ ያንሱ</p>

      <div style={{ background: "#f1f5f9", borderRadius: "50%", width: "200px", height: "200px", margin: "25px auto", overflow: "hidden", position: "relative", border: "4px solid #162447", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }}>
        {cameraActive && <video ref={videoRef} autoPlay playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
        {image && !cameraActive && <img src={image} alt="Selfie Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
        {!cameraActive && !image && <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#94a3b8", fontSize: "40px" }}>👤</div>}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {!cameraActive ? (
          <button type="button" onClick={startSelfieCamera} style={{ background: "#475569", color: "#fff", padding: "12px", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
            {image ? "🔄 እንደገና በትክክል አንሳ" : "🤳 የራስ ፎቶ ካሜራ ክፈት"}
          </button>
        ) : (
          <button type="button" onClick={captureSelfie} style={{ background: "#22c55e", color: "#fff", padding: "12px", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
            📸 ፎቶ አንሳ
          </button>
        )}

        {image && (
          <button type="button" onClick={handleNext} style={{ background: "#162447", color: "#fff", padding: "14px", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", marginTop: "15px" }}>
            ወደ ፊት ማነፃፀሪያ ደረጃ እለፍ (Face Match) →
          </button>
        )}
      </div>
    </div>
  );
}

export default CaptureSelfie;
