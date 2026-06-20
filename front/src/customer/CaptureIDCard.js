import React, { useState, useRef } from "react";

function CaptureIDCard({ onSuccess }) {
  const [faydaNumber, setFaydaNumber] = useState("");
  const [image, setImage] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [scanStatus, setScanStatus] = useState(""); 
  const [scanning, setScanning] = useState(false); 
  const videoRef = useRef(null);

  const startCamera = async () => {
    setCameraActive(true);
    setScanStatus("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error("ካሜራ መክፈት አልተቻለም፦", err);
      alert("እባክዎ የካሜራ ፌርሚሽን ይፍቀዱ!");
    }
  };

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
    setImage(base64Image);

    const stream = video.srcObject;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setCameraActive(false);

    setScanning(true);
    setScanStatus("⏳ ከመታወቂያው ላይ የ QR ኮድ እና ቁጥር በማንበብ ላይ...");

    setTimeout(async () => {
      try {
        let foundFayda = "";

        // 1. QR ኮድ መፈተሽ
        if (window.jsQR) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const qrCode = window.jsQR(imageData.data, imageData.width, imageData.height);
          if (qrCode && qrCode.data) {
            const qrMatch = qrCode.data.match(/\d{16}/);
            if (qrMatch) foundFayda = qrMatch[0];
          }
        }

        // 2. OCR ጽሑፍ መፈተሽ
        if (!foundFayda && window.Tesseract) {
          const result = await window.Tesseract.recognize(base64Image, "eng");
          const cleanText = result.data.text.replace(/[\s-]/g, "");
          const matched = cleanText.match(/\d{16}/);
          if (matched) foundFayda = matched[0];
        }

        if (foundFayda) {
          setFaydaNumber(foundFayda);
          setScanStatus("🟢 የፋይዳ ቁጥር በራስ-ሰር ተገኝቶ ተሞልቷል!");
        } else {
          setScanStatus("⚠️ AI ቁጥሩን ማግኘት አልተቻለም። እባክዎ ከመታወቂያው ላይ አይተው ከታች በእጅዎ ይሙሉ::");
        }
      } catch (error) {
        console.error(error);
        setScanStatus("⚠️ እባክዎ የፋይዳ ቁጥሩን ከታች በእጅዎ ይሙሉ::");
      } finally {
        setScanning(false);
      }
    }, 400);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // 🚨 ዋናው ጥብቅ መቆለፊያ - ቁጥሩ ልክ 16 አሃዝ ካልሆነ በፍጹም አያሳልፍም!
    if (faydaNumber.length !== 16) {
      alert("⚠️ እባክዎ መጀመሪያ ባለ 16 ዲጂት የፋይዳ ቁጥር በትክክል መሙላቱን ያረጋግጡ!");
      return;
    }
    if (!image) {
      alert("⚠️ እባክዎ የመታወቂያውን ፎቶ ያንሱ!");
      return;
    }
    onSuccess({ faydaNumber, image });
  };

  return (
    <div style={{ padding: "20px", maxWidth: "450px", margin: "0 auto", textAlign: "center", fontFamily: "sans-serif" }}>
      <h3 style={{ color: "#162447" }}>🆔 ደረጃ 1፡ የጡረተኛ መታወቂያ መረጃ</h3>
      <p style={{ color: "#64748b", fontSize: "14px" }}>የ QR ኮዱን ወይም የፋይዳ ቁጥሩን በራስ-ሰር ለማንበብ ፎቶ ያንሱ</p>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px", marginTop: "20px" }}>
        
        <div style={{ background: "#f1f5f9", borderRadius: "12px", height: "220px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", border: "2px dashed #cbd5e1" }}>
          {cameraActive && <video ref={videoRef} autoPlay playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
          {image && !cameraActive && <img src={image} alt="ID" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
          {!cameraActive && !image && <span style={{ color: "#94a3b8" }}>📷 ካሜራው አልተከፈተም</span>}
        </div>

        {!cameraActive ? (
          <button type="button" onClick={startCamera} disabled={scanning} style={{ background: "#475569", color: "#fff", padding: "10px", border: "none", borderRadius: "8px", cursor: "pointer" }}>
            {image ? "🔄 እንደገና አንሳ" : "📸 ካሜራ ክፈት"}
          </button>
        ) : (
          <button type="button" onClick={capturePhoto} style={{ background: "#22c55e", color: "#fff", padding: "10px", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
            🛑 ፎቶ ቅረጽ እና ስካን አድርግ
          </button>
        )}

        {scanStatus && (
          <p style={{ fontSize: "13px", fontWeight: "500", color: faydaNumber.length === 16 ? "#16a34a" : "#b45309", backgroundColor: faydaNumber.length === 16 ? "#f0fdf4" : "#fff8e6", padding: "8px", borderRadius: "6px" }}>
            {scanStatus}
          </p>
        )}

        <div style={{ textAlign: "left" }}>
          <label style={{ fontSize: "13px", fontWeight: "bold", color: "#162447" }}>የፋይዳ ቁጥር / FAYDA Number (16 Digits)</label>
          <input 
            type="text" 
            maxLength="16"
            value={faydaNumber} 
            onChange={(e) => setFaydaNumber(e.target.value.replace(/\D/g, ""))} // ቁጥር ብቻ እንዲቀበል
            placeholder="እዚህ ጋር ይጻፉ..." 
            required
            style={{ 
              width: "100%", padding: "12px", marginTop: "5px", borderRadius: "8px", 
              border: faydaNumber.length === 16 ? "2px solid #22c55e" : "2px solid #dc2626", 
              backgroundColor: faydaNumber.length === 16 ? "#f0fdf4" : "#fff",
              fontWeight: "bold", fontSize: "18px", letterSpacing: "1px", textAlign: "center", boxSizing: "border-box" 
            }}
          />
        </div>

        {/* 🔒 ቁጥሩ 16 ካልሞላ በተኑ አይሰራም ወይም ፎርሙን አያሳልፍም */}
        <button 
          type="submit" 
          disabled={scanning || faydaNumber.length !== 16} 
          style={{ 
            background: faydaNumber.length === 16 ? "#162447" : "#cbd5e1", 
            color: "#fff", padding: "14px", border: "none", borderRadius: "8px", 
            cursor: faydaNumber.length === 16 ? "pointer" : "not-allowed", fontWeight: "bold", marginTop: "10px" 
          }}
        >
          ቀጥል (ከዳታቤዝ ጋር አመሳስል) →
        </button>
      </form>
    </div>
  );
}

export default CaptureIDCard;
