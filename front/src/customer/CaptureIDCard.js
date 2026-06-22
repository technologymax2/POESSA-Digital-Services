Import React, { useState, useRef } from "react";
import axios from "axios";

// 🔗 ያንተ የቤክኤንድ API አድራሻ
const API_BASE_URL = "Https://poessa-digital-services-1.onrender.com";
// 🔑 ያንተ የ ImgBB API ቁልፍ
const IMGBB_API_KEY = "ebd592608f4dba1e8271bec8e920c408";

function CaptureIDCard({ onSuccess }) {
  const [faydaNumber, setFaydaNumber] = useState("");
  const [image, setImage] = useState(null); // 🔗 እዚህ ላይ የመጨረሻው የ ImgBB URL ይቀመጣል
  const [cameraActive, setCameraActive] = useState(false);
  const [scanStatus, setScanStatus] = useState(""); 
  const [scanning, setScanning] = useState(false); 
  const [verifyingInDB, setVerifyingInDB] = useState(false);
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
      alert("እባክዎ የካሜራ ፈቃድ (Permission) ይፍቀዱ!");
    }
  };

  /* ==========================================================================
     📸 ፎቶን ወደ ImgBB ሰቅሎ እውነተኛ ሊንክ (URL) ማምጫ ተግባር
  ========================================================================== */
  // 1. የ uploadIdToImgBB ፈንክሽንን በዚህ አስተካክል
const uploadIdToImgBB = async (base64Image) => {
  try {
    const cleanBase64 = base64Image.split(",")[1];
    const formData = new FormData(); // FormData መጠቀማችንን እናረጋግጥ
    formData.append("image", cleanBase64);

    const response = await axios.post(
      `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
      formData
    );

    return response.data?.data?.url || null;
  } catch (error) {
    console.error("❌ ImgBB Upload Error:", error);
    return null;
  }
};

// 2. capturePhoto ውስጥ ምስሉን ከመላክህ በፊት አሳንሰው
const capturePhoto = async () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    // ጥራቱን በመቀነስ ምስሉን ያሳንሱት (ይህ ፎቶው በፍጥነት እንዲሰቀል ያደርጋል)
    canvas.width = 600; 
    canvas.height = 400;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // በ 0.6 ጥራት JPEG አድርገን እንላከው
    const base64Image = canvas.toDataURL("image/jpeg", 0.6);

    // ... ቀሪው ኮድህ እዚህ ይቀጥላል ...
    setScanning(true);
    setScanStatus("⏳ ምስሉ በመጫን ላይ ነው...");
    
    const uploadedUrl = await uploadIdToImgBB(base64Image);
    // ...
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

    const stream = video.srcObject;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setCameraActive(false);

    setScanning(true);
    setScanStatus("⏳ ከመታወቂያው ላይ መረጃ እያነበብን እና ፎቶውን ወደ ImgBB እየሰቀልን ነው...");

    // 1. መጀመሪያ ፎቶውን ወደ ImgBB መጫን
    const uploadedUrl = await uploadIdToImgBB(base64Image);
    if (uploadedUrl) {
      setImage(uploadedUrl); // 🌟 አሁን ስቴቱ ላይ የሚቀመጠው ረጅም ፅሁፍ ሳይሆን የ ImgBB ሊንክ ነው!
    } else {
      setScanStatus("⚠️ ፎቶውን ደመና (ImgBB) ላይ መጫን አልተቻለም። እባክዎ ድጋሚ ይሞክሩ።");
      setScanning(false);
      return;
    }

    // 2. የ QR ኮድ እና የ OCR ጽሑፍ መፈተሽ
    try {
      let foundFayda = "";

      if (window.jsQR) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const qrCode = window.jsQR(imageData.data, imageData.width, imageData.height);
        if (qrCode && qrCode.data) {
          const qrMatch = qrCode.data.match(/\d{16}/);
          if (qrMatch) foundFayda = qrMatch[0];
        }
      }

      if (!foundFayda && window.Tesseract) {
        const result = await window.Tesseract.recognize(base64Image, "eng");
        const cleanText = result.data.text.replace(/[\s-]/g, "");
        const matched = cleanText.match(/\d{16}/);
        if (matched) foundFayda = matched[0];
      }

      if (foundFayda) {
        setFaydaNumber(foundFayda);
        setScanStatus("🟢 መታወቂያው በተሳካ ሁኔታ ተሰቅሏል፤ የፋይዳ ቁጥርም ተገኝቷል!");
      } else {
        setScanStatus("⚠️ ፎቶው ተሰቅሏል ነገር ግን AI ቁጥሩን አላነበበውም። እባክዎ ከታች በእጅዎ ይሙሉ::");
      }
    } catch (error) {
      console.error(error);
      setScanStatus("⚠️ እባክዎ የፋይዳ ቁጥሩን ከታች በእጅዎ ይሙሉ::");
    } finally {
      setScanning(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (faydaNumber.length !== 16) {
      alert("⚠️ እባክዎ መጀመሪያ ባለ 16 ዲጂት የፋይዳ ቁጥር በትክክል መሙላቱን ያረጋግጡ!");
      return;
    }
    if (!image) {
      alert("⚠️ እባክዎ የመታወቂያውን ፎቶ ያንሱ!");
      return;
    }

    try {
      setVerifyingInDB(true);
      setScanStatus("⏳ የፋይዳ ቁጥሩን ከዳታቤዝ ጋር እያመሳከርን ነው...");

      const response = await axios.get(`${API_BASE_URL}/pensioners`);
      
      if (response.data.success) {
        const foundInDB = response.data.data.find(p => p.faydaNumber === faydaNumber);
        
        if (foundInDB) {
          const name = foundInDB.nameAmh || foundInDB.name || "ጡረተኛ";
          alert(`🟢 እንኳን ደህና መጡ ${name}! መረጃዎ ተረጋግጧል። ወደ ባዮሜትሪክስ ፈተና መሻገር ይችላሉ።`);
          
          // 💡 ወደሚቀጥለው ገጽ የሚተላለፈው 'image' አሁን ንጹህ የ ImgBB URL ነው!
          onSuccess({ faydaNumber, idPhotoUrl: image });
        } else {
          setScanStatus("❌ ይህ የፋይዳ ቁጥር በሲስተሙ ላይ አልተመዘገበም!");
          alert("❌ ስህተት፦ ይህ የፋይዳ ቁጥር በጡረታ ባለስልጣን ሲስተም ላይ አልተገኘም!");
        }
      }
    } catch (error) {
      console.error("DB Verification Error:", error);
      // ሰርቨር መድረስ ባይቻል እንኳ መረጃውን ይዞ እንዲያልፍ ይደረጋል
      onSuccess({ faydaNumber, idPhotoUrl: image });
    } finally {
      setVerifyingInDB(false);
    }
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
          <button type="button" onClick={startCamera} disabled={scanning || verifyingInDB} style={{ background: "#475569", color: "#fff", padding: "10px", border: "none", borderRadius: "8px", cursor: "pointer" }}>
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
            onChange={(e) => setFaydaNumber(e.target.value.replace(/\D/g, ""))}
            placeholder="እዚህ ጋር ይጻፉ..." 
            required
            disabled={verifyingInDB}
            style={{ 
              width: "100%", padding: "12px", marginTop: "5px", borderRadius: "8px", 
              border: faydaNumber.length === 16 ? "2px solid #22c55e" : "2px solid #dc2626", 
              backgroundColor: faydaNumber.length === 16 ? "#f0fdf4" : "#fff",
              fontWeight: "bold", fontSize: "18px", letterSpacing: "1px", textAlign: "center", boxSizing: "border-box" 
            }}
          />
        </div>

        <button 
          type="submit" 
          disabled={scanning || verifyingInDB || faydaNumber.length !== 16} 
          style={{ 
            background: faydaNumber.length === 16 ? "#162447" : "#cbd5e1", 
            color: "#fff", padding: "14px", border: "none", borderRadius: "8px", 
            cursor: (faydaNumber.length === 16 && !verifyingInDB) ? "pointer" : "not-allowed", fontWeight: "bold", marginTop: "10px" 
          }}
        >
          {verifyingInDB ? "⏳ መረጃ በመፈተሽ ላይ..." : "ቀጥል (ከዳታቤዝ ጋር አመሳስል) →"}
        </button>
      </form>
    </div>
  );
}

export default CaptureIDCard;
