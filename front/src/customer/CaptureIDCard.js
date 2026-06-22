import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

const IMGBB_API_KEY = "ebd592608f4dba1e8271bec8e920c408"; 

function CaptureIDCard({ onSuccess }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [faydaNumber, setFaydaNumber] = useState("");
  const [image, setImage] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [scanStatus, setScanStatus] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const stopCamera = () => {
    // 💡 ወሳኝ ማስተካከያ፦ ትራኮችን ማቆም ብቻ ሳይሆን ሙሉ በሙሉ ማጥፋት
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach((track) => {
        track.stop();
        streamRef.current.removeTrack(track); // ብሮውዘሩ ሃርድዌሩን እንዲለቅ ማገዝ
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.load(); // ቪዲዮውን ፍሬሽ ማድረግ
    }
    setCameraActive(false);
  };

  const startCamera = async () => {
    try {
      setImage("");
      setScanStatus("⏳ ካሜራው እየተነሳ ነው...");

      // መጀመሪያ ነፃ መሆኑን ማረጋገጥ
      stopCamera();

      // 💡 ለ ID ካርድ የጀርባ ካሜራ (environment) መጠቀም ከተፈለገ ideal ሳይሆን exact ወይም ቀጥታ መጻፍ
      const constraints = {
        video: {
          facingMode: "environment", // የጀርባ ካሜራ
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        videoRef.current.setAttribute("autoplay", "true");
        
        // ስማርት ስልኮች ላይ በተረጋጋ ሁኔታ እንዲነሳ መጠበቅ
        await new Promise((resolve) => setTimeout(resolve, 200));
        await videoRef.current.play();
      }

      setCameraActive(true);
      setScanStatus("✅ ካሜራው ዝግጁ ነው");
    } catch (err) {
      console.error("Camera access error:", err);
      // Fallback: የጀርባው እምቢ ካለ የፊት ካሜራውን እንዲሞክር
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = fallbackStream;
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
          await videoRef.current.play();
        }
        setCameraActive(true);
        setScanStatus("✅ ካሜራው በዲፎልት ተከፍቷል");
      } catch (e) {
        setScanStatus("❌ ካሜራውን መክፈት አልተቻለም። ፈቃድ መኖሩን ያረጋግጡ።");
      }
    }
  };

  const uploadIdToImgBB = async (base64Image) => {
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
      return response.data?.data?.url || null;
    } catch (err) {
      return null;
    }
  };

  const capturePhoto = async () => {
    const video = videoRef.current;
    if (!video || !cameraActive) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64Image = canvas.toDataURL("image/jpeg", 0.85);

    // 💡 ካሜራውን አቁሞ ለቀጣዩ ሴልፊ ደረጃ ነፃ ማድረግ
    stopCamera();
    setUploading(true);
    setScanStatus("⏳ መታወቂያው ወደ ሰርቨር እየተጫነ ነው...");

    const uploadedUrl = await uploadIdToImgBB(base64Image);
    setUploading(false);

    if (uploadedUrl) {
      setImage(uploadedUrl);
      setScanStatus("✅ መታወቂያው በትክክል ተጭኗል");
    } else {
      setScanStatus("❌ ፎቶውን መጫን አልተቻለም።");
    }
  };

  const handleContinue = () => {
    const cleanFayda = faydaNumber.replace(/\D/g, "");
    if (!image || cleanFayda.length !== 16) {
      setScanStatus("⚠️ እባክዎ መጀመሪያ ፎቶ አንስተው ባለ 16 አሃዝ ቁጥር ያስገቡ");
      return;
    }
    onSuccess({ faydaNumber: cleanFayda, idPhotoUrl: image });
  };

  return (
    <div style={{ padding: "20px 15px", maxWidth: 450, margin: "auto", fontFamily: "sans-serif" }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 15 }}>
        <span style={{ background: '#162447', color: '#fff', padding: '4px 8px', borderRadius: '6px', fontSize: '13px' }}>ID</span>
        <h3 style={{ margin: 0, color: '#162447' }}>ID Capture</h3>
      </div>

      <div style={{ width: "100%", aspectRatio: "1.58", background: "#000", borderRadius: 14, overflow: "hidden", position: "relative" }}>
        {cameraActive ? (
          <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : image ? (
          <img src={image} alt="ID" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ color: "#94a3b8", position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>ካሜራው አልተከፈተም</div>
        )}
      </div>

      <button onClick={cameraActive ? capturePhoto : startCamera} disabled={uploading} style={{ width: "100%", padding: "14px", marginTop: 12, background: cameraActive ? "#e11d48" : "#162447", color: "#fff", border: "none", borderRadius: 10, fontWeight: "600" }}>
        {cameraActive ? "📸 ፎቶ አንሳ" : image ? "🔄 ድጋሚ አንሳ" : "📷 ካሜራ ክፈት"}
      </button>

      <div style={{ marginTop: 20 }}>
        <input type="text" maxLength={16} value={faydaNumber} onChange={(e) => setFaydaNumber(e.target.value.replace(/\D/g, ""))} placeholder="ባለ 16 አሃዝ የፋይዳ ቁጥር ያስገቡ" style={{ width: "100%", padding: "14px 12px", border: "1.5px solid #cbd5e1", borderRadius: 10, outline: "none" }} />
      </div>

      <button onClick={handleContinue} disabled={uploading || !image} style={{ width: "100%", padding: "15px", marginTop: 15, background: (uploading || !image) ? "#94a3b8" : "#22c55e", color: "#fff", border: "none", borderRadius: 10, fontWeight: "bold" }}>
        ቀጥል →
      </button>

      {scanStatus && <p style={{ fontSize: "13px", marginTop: 12, textAlign: "center", color: scanStatus.includes("❌") ? "#dc2626" : "#16a34a" }}>{scanStatus}</p>}
    </div>
  );
}

export default CaptureIDCard;
