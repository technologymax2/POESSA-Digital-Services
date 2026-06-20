import React, { useState, useRef } from "react";

function CaptureIDCard({ onSuccess }) {
  const [faydaNumber, setFaydaNumber] = useState("");
  const [image, setImage] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [scanStatus, setScanStatus] = useState(""); 
  const [scanning, setScanning] = useState(false); 
  const videoRef = useRef(null);

  // 📸 የጀርባ ካሜራን በከፍተኛ ጥራት (High Resolution) መክፈት
  const startCamera = async () => {
    setCameraActive(true);
    setScanStatus("");
    setFaydaNumber(""); // አዲስ ሲጀመር የድሮውን ማጽዳት
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: "environment",
          width: { ideal: 1280 }, // የፎቶውን ጥራት ከፍ ለማድረግ
          height: { ideal: 720 }
        } 
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error("ካሜራ መክፈት አልተቻለም፦", err);
      alert("እባክዎ የካሜራ ፌርሚሽን ይፍቀዱ!");
    }
  };

  // ፎቶ የመቅረጽ፣ የ QR ኮድ እና የጽሑፍ ንባብ ሂደት
  const capturePhoto = async () => {
    const video = videoRef.current;
    if (!video) return;

    // የካሜራውን ትክክለኛ የቪዲዮ ስፋትና ቁመት መውሰድ
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const base64Image = canvas.toDataURL("image/jpeg");
    setImage(base64Image);

    // ካሜራውን ወዲያው መዝጋት
    const stream = video.srcObject;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setCameraActive(false);

    setScanning(true);
    setScanStatus("⏳ ከመታወቂያው ላይ የ QR ኮድ እና የፋይዳ ቁጥርን በማንበብ ላይ...");

    try {
      let foundFayda = "";

      // 1️⃣ [ደረጃ 1] የ QR ኮድ መፈተሽ (jsQR)
      const jsQR = window.jsQR;
      if (jsQR) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const qrCode = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (qrCode && qrCode.data) {
          console.log("🎯 QR ኮድ ተገኝቷል፦", qrCode.data);
          const qrMatch = qrCode.data.match(/\d{16}/);
          if (qrMatch) {
            foundFayda = qrMatch[0];
            setScanStatus("🎉 የ QR ኮዱ በተሳካ ሁኔታ ተነቧል!");
          }
        }
      }

      // 2️⃣ [ደረጃ 2] QR ኮዱ ካልተነበበ ወደ ጽሑፍ ንባብ (Tesseract) መሻገር
      if (!foundFayda && window.Tesseract) {
        console.log("🔄 QR አልተነበበም፣ ወደ OCR ንባብ እየተቀየረ ነው...");
        const result = await window.Tesseract.recognize(base64Image, "eng");
        const cleanTextOnlyDigits = result.data.text.replace(/[\s-]/g, ""); // ክፍተቶችን ማጥፋት
        
        const faydaRegex = /\d{16}/; // በማንኛውም ቦታ 16 ተከታታይ ቁጥር መፈለግ
        const matched = cleanTextOnlyDigits.match(faydaRegex);
        if (matched) {
          foundFayda = matched[0];
          setScanStatus("🟢 የፋይዳ ቁጥር ከጽሑፉ ላይ በ AI ተገኝቷል!");
        }
      }

      // 3️⃣ [ደረጃ 3] ውጤቱን ወደ ስቴት መላክ
      if (foundFayda) {
        setFaydaNumber(foundFayda); // 🔥 እዚህ ጋር ነው ቁጥሩን በራስ-ሰር የሚሞላው!
      } else {
        setScanStatus("⚠️ ቁጥሩን በራስ-ሰር ማግኘት አልተቻለም። እባክዎ በእጅዎ ይሙሉ ወይም በደህና ብርሃን ድጋሚ ያንሱ።");
      }

    } catch (error) {
      console.error("Scanning Error:", error);
      setScanStatus("❌ መታወቂያውን ማቀነባበር አልተቻለም።");
    } finally {
      setScanning(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (faydaNumber.length !== 16) {
      alert("⚠️ የፋይዳ ቁጥር ልክ 16 ዲጂት መሆን አለበት!");
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
        
        {/* የካሜራ ሳጥን */}
        <div style={{ background: "#f1f5f9", borderRadius: "12px", height: "220px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative", border: "2px dashed #cbd5e1" }}>
          {cameraActive && <video ref={videoRef} autoPlay playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
          {image && !cameraActive && <img src={image} alt="ID Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
          {!cameraActive && !image && <span style={{ color: "#94a3b8" }}>📷 ካሜራው አልተከፈተም</span>}
        </div>

        {/* የካሜራ ቁልፎች */}
        {!cameraActive ? (
          <button type="button" onClick={startCamera} disabled={scanning} style={{ background: "#475569", color: "#fff", padding: "10px", border: "none", borderRadius: "8px", cursor: scanning ? "not-allowed" : "pointer" }}>
            {image ? "🔄 እንደገና አንሳ" : "📸 ካሜራ ክፈት"}
          </button>
        ) : (
          <button type="button" onClick={capturePhoto} style={{ background: "#22c55e", color: "#fff", padding: "10px", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
            🛑 ፎቶ ቅረጽ እና ስካን አድርግ
          </button>
        )}

        {/* የማንበብ ሁኔታ መልዕክት */}
        {scanStatus && (
          <p style={{ fontSize: "13px", fontWeight: "500", color: faydaNumber ? "#16a34a" : "#dc2626", margin: "5px 0" }}>
            {scanStatus}
          </p>
        )}

        {/* የፋይዳ ቁጥር ማስገቢያ ሳጥን */}
        <div style={{ textAlign: "left" }}>
          <label style={{ fontSize: "13px", fontWeight: "bold", color: "#162447" }}>የፋይዳ ቁጥር / FAYDA Number (16 Digits)</label>
          <input 
            type="text" 
            maxLength="16"
            value={faydaNumber} // 🔥 ቁጥሩ ሲገኝ እዚህ ጋር ይቀመጣል
            onChange={(e) => setFaydaNumber(e.target.value.replace(/\D/g, ""))}
            placeholder="ለምሳሌ፡ 1234567887654321" 
            required
            style={{ 
              width: "100%", 
              padding: "12px", 
              marginTop: "5px", 
              borderRadius: "8px", 
              border: faydaNumber.length === 16 ? "2px solid #22c55e" : "1px solid #cbd5e1", 
              backgroundColor: faydaNumber.length === 16 ? "#f0fdf4" : "#fff",
              fontWeight: "bold", 
              letterSpacing: "1px", 
              textAlign: "center", 
              boxSizing: "border-box" 
            }}
          />
        </div>

        <button type="submit" disabled={scanning} style={{ background: scanning ? "#cbd5e1" : "#162447", color: "#fff", padding: "14px", border: "none", borderRadius: "8px", cursor: scanning ? "not-allowed" : "pointer", fontWeight: "bold", marginTop: "10px" }}>
          ቀጥል (ከዳታቤዝ ጋር አመሳስል) →
        </button>
      </form>
    </div>
  );
}

export default CaptureIDCard;
