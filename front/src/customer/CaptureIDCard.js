import React, { useState, useRef } from "react";

function CaptureIDCard({ onSuccess }) {
  const [faydaNumber, setFaydaNumber] = useState("");
  const [image, setImage] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [scanStatus, setScanStatus] = useState(""); // ⏳ የስካን ሁኔታ መከታተያ
  const [scanning, setScanning] = useState(false); // 🔥 ስካን እያደረገ መሆኑን ማሳያ
  const videoRef = useRef(null);

  // የስልክን ካሜራ ለመክፈት
  const startCamera = async () => {
    setCameraActive(true);
    setScanStatus("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } // የጀርባ ካሜራን ቅድሚያ ይሰጣል
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error("ካሜራ መክፈት አልተቻለም፦", err);
      alert("እባክዎ የካሜራ ፌርሚሽን ይፍቀዱ!");
    }
  };

  // 📸 ፎቶ ለመቅረጽ እና በውስጡ የፋይዳ ቁጥር በ AI ለመፈለግ (OCR)
  const capturePhoto = async () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const base64Image = canvas.toDataURL("image/jpeg");
    setImage(base64Image);

    // ካሜራውን መዝጋት
    const stream = video.srcObject;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setCameraActive(false);

    // 🔥 [አዲስ የ AI ሎጂክ] ከመታወቂያው ላይ ጽሑፍ ማንበብ መጀመር
    const Tesseract = window.Tesseract;
    if (!Tesseract) {
      console.error("Tesseract.js አልተጫነም! index.html ላይ የ CDN መስመሩ መኖሩን ያረጋግጡ።");
      return;
    }

    setScanning(true);
    setScanStatus("⏳ ከመታወቂያው ላይ የፋይዳ ቁጥርን በAI በማንበብ ላይ...");

    try {
      const result = await Tesseract.recognize(base64Image, "eng");
      const extractedText = result.data.text;
      console.log("ከመታወቂያው የተነበበ ሙሉ ጽሑፍ፦", extractedText);

      // 16 ተከታታይ አሃዞችን ወይም በሰረዝ የተገነጠሉትን መፈለጊያ (Regex)
      const faydaRegex = /\b\d{16}\b|\b\d{4}-\d{4}-\d{4}-\d{4}\b/;
      const matched = extractedText.match(faydaRegex);

      if (matched) {
        const cleanNumber = matched[0].replace(/-/g, ""); // ሰረዞች ካሉ ማጽዳት
        setFaydaNumber(cleanNumber); // 🟢 ቁጥሩን በቀጥታ ወደ ማስገቢያው ሳጥን (Input) መላክ!
        setScanStatus("🟢 የፋይዳ ቁጥር በተሳካ ሁኔታ ተገኝቷል! እባክዎ ከታች ትክክለኛነቱን ያረጋግጡ።");
      } else {
        setScanStatus("⚠️ AI ቁጥሩን ማግኘት አልተቻለም። እባክዎ በእጅዎ ይሙሉ ወይም በብርሃን ቦታ ድጋሚ ያንሱ።");
      }
    } catch (error) {
      console.error("OCR Scan Error:", error);
      setScanStatus("❌ ምስሉን ማንበብ አልተቻለም።");
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
    // መረጃውን ወደ ዋናው ዊዛርድ ማሳለፍ
    onSuccess({ faydaNumber, image });
  };

  return (
    <div style={{ padding: "20px", maxWidth: "450px", margin: "0 auto", textAlign: "center", fontFamily: "sans-serif" }}>
      <h3 style={{ color: "#162447" }}>🆔 ደረጃ 1፡ የጡረተኛ መታወቂያ መረጃ</h3>
      <p style={{ color: "#64748b", fontSize: "14px" }}>የፋይዳ ቁጥርዎን በራስ-ሰር ለማንበብ መታወቂያውን ፎቶ ያንሱ</p>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px", marginTop: "20px" }}>
        
        {/* የካሜራ ቪውፖርት */}
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

        {/* 💡 የስካን ሁኔታ መልዕክት ማሳያ */}
        {scanStatus && (
          <p style={{ fontSize: "13px", fontWeight: "500", color: faydaNumber ? "#16a34a" : "#475569", margin: "5px 0" }}>
            {scanStatus}
          </p>
        )}

        {/* የፋይዳ ቁጥር ማስገቢያ ሳጥን (AI ሲያነበው በራስ-ሰር ይሞላል) */}
        <div style={{ textAlign: "left" }}>
          <label style={{ fontSize: "13px", fontWeight: "bold", color: "#162447" }}>የፋይዳ ቁጥር / FAYDA Number (16 Digits)</label>
          <input 
            type="text" 
            maxLength="16"
            value={faydaNumber}
            onChange={(e) => setFaydaNumber(e.target.value.replace(/\D/g, ""))}
            placeholder={scanning ? "AI እያነበበው ነው..." : "ለምሳሌ፡ 1234567887654321"} 
            required
            style={{ width: "100%", padding: "12px", marginTop: "5px", borderRadius: "8px", border: faydaNumber ? "2px solid #22c55e" : "1px solid #cbd5e1", fontWeight: "bold", letterSpacing: "1px", textAlign: "center", boxSizing: "border-box" }}
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
