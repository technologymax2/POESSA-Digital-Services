import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

const IMGBB_API_KEY = "YOUR_KEY_HERE";

function CaptureIDCard({ onSuccess }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [faydaNumber, setFaydaNumber] = useState("");
  const [image, setImage] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [isStreamReady, setIsStreamReady] = useState(false);
  const [scanStatus, setScanStatus] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setIsStreamReady(false);
  };

  const startCamera = async () => {
    try {
      setImage("");
      setScanStatus("");
      setIsStreamReady(false);

      const constraints = {
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setTimeout(async () => {
          try {
            if (videoRef.current) {
              await videoRef.current.play();
              setIsStreamReady(true);
            }
          } catch (e) {
            console.error("Video play error:", e);
          }
        }, 300);
      }

      setCameraActive(true);
    } catch (err) {
      console.error("Camera Access Error Details:", err);
      
      // 🔴 የፈቃድ መከልከል ችግርን በግልጽ ለይቶ ለማሳወቅ ማስተካከያ
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        alert(
          "🔒 የካሜራ ፈቃድ ተከልክሏል!\n\n" +
          "ችግሩን ለመፍታት፦\n" +
          "1. ከባርያው በላይ (አድራሻ መጻፊያው አጠገብ) ያለውን የቁልፍ 🔒 ወይም የቅንብር ምልክት ይጫኑ።\n" +
          "2. 'Site Settings' ወይም 'Permissions' ውስጥ በመግባት ካሜራውን 'Allow' (ፍቀድ) ያድርጉ።\n" +
          "3. ገጹን Refresh (ድጋሚ መጫን) አድርገው ይሞክሩ።"
        );
        setScanStatus("❌ የካሜራ ፈቃድ አልተሰጠም");
      } else {
        // ሌሎች የሃርድዌር ስህተቶች ካሉ በቀላሉ ለመክፈት መሞከር
        try {
          const basicStream = await navigator.mediaDevices.getUserMedia({ video: true });
          streamRef.current = basicStream;
          if (videoRef.current) {
            videoRef.current.srcObject = basicStream;
            setTimeout(() => { videoRef.current?.play(); setIsStreamReady(true); }, 300);
          }
          setCameraActive(true);
        } catch (fallbackErr) {
          alert("❌ ካሜራውን ማግኘት አልተቻለም። እባክዎ ስልክዎን ያረጋግጡ።");
        }
      }
    }
  };

  const uploadIdToImgBB = async (base64Image) => {
    try {
      const cleanBase64 = base64Image.split(",")[1];
      const formData = new FormData();
      formData.append("image", cleanBase64);

      const response = await axios.post(
        `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
        formData
      );

      return response.data?.data?.url || null;
    } catch (err) {
      console.error("Upload Error:", err);
      return null;
    }
  };

  const capturePhoto = async () => {
    const video = videoRef.current;

    if (!video || !isStreamReady || video.videoWidth === 0) {
      alert("⏳ ካሜራው ዝግጁ አይደለም። እባክዎ ስክሪኑ እስኪበራ ይጠብቁ።");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    const base64Image = canvas.toDataURL("image/jpeg", 0.85);

    stopCamera();
    setUploading(true);
    setScanStatus("⏳ መታወቂያው ወደ ሰርቨር እየተላከ ነው...");

    const uploadedUrl = await uploadIdToImgBB(base64Image);
    setUploading(false);

    if (uploadedUrl) {
      setImage(uploadedUrl);
      setScanStatus("✅ መታወቂያው በትክክል ተጭኗል");
    } else {
      setScanStatus("❌ መታወቂያውን መጫን አልተቻለም። ድጋሚ ይሞክሩ።");
    }
  };

  const handleContinue = () => {
    const cleanFayda = faydaNumber.replace(/\D/g, "");

    if (!image) return alert("⚠️ እባክዎ መጀመሪያ የመታወቂያዎን ፎቶ ያንሱ");
    if (cleanFayda.length !== 16) {
      return alert("⚠️ እባክዎ ትክክለኛ 16 ድጅት የፋይዳ ቁጥር ያስገቡ");
    }

    onSuccess({
      faydaNumber: cleanFayda,
      idPhotoUrl: image,
      capturedAt: new Date().toISOString(),
    });
  };

  return (
    <div style={{ padding: "20px 15px", maxWidth: 450, margin: "auto", fontFamily: "sans-serif", boxSizing: "border-box" }}>
      
      {/* ID Capture ርዕስ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 15 }}>
        <span style={{ background: '#162447', color: '#fff', padding: '4px 8px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold' }}>ID</span>
        <h3 style={{ margin: 0, color: '#162447', fontSize: '18px', fontWeight: 'bold' }}>ID Capture</h3>
      </div>

      {/* CAMERA SCREEN */}
      <div
        style={{
          width: "100%",
          aspectRatio: "1.58",
          background: "#050505",
          borderRadius: 14,
          overflow: "hidden",
          position: "relative",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          border: "1px solid #e2e8f0"
        }}
      >
        {cameraActive ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            onPlaying={() => setIsStreamReady(true)}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : image ? (
          <img
            src={image}
            alt="Captured ID"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div style={{ color: "#94a3b8", textAlign: "center", position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", fontSize: "15px", fontWeight: "500" }}>
            Camera Ready
          </div>
        )}
      </div>

      {/* BUTTONS */}
      <button
        onClick={cameraActive ? capturePhoto : startCamera}
        disabled={uploading || (cameraActive && !isStreamReady)}
        style={{
          width: "100%",
          padding: "14px",
          marginTop: 12,
          background: cameraActive ? (isStreamReady ? "#1e293b" : "#475569") : "#162447",
          color: "#fff",
          border: "none",
          borderRadius: 10,
          fontSize: "14px",
          fontWeight: "600",
          cursor: "pointer"
        }}
      >
        {cameraActive ? (isStreamReady ? "📸 Capture" : "⏳ Loading Camera...") : image ? "🔄 Retake Photo" : "📷 Open Camera"}
      </button>

      {/* INPUT FIELD */}
      <div style={{ marginTop: 20 }}>
        <input
          type="text"
          maxLength={16}
          value={faydaNumber}
          onChange={(e) => setFaydaNumber(e.target.value.replace(/\D/g, ""))}
          placeholder="16-digit Fayda number"
          style={{
            width: "100%",
            padding: "14px 12px",
            border: "1.5px solid #cbd5e1",
            borderRadius: 10,
            fontSize: "15px",
            boxSizing: "border-box",
            outline: "none"
          }}
        />
      </div>

      {/* CONTINUE BUTTON */}
      <button
        onClick={handleContinue}
        disabled={uploading || !image}
        style={{
          width: "100%",
          padding: "15px",
          marginTop: 15,
          background: (uploading || !image) ? "#94a3b8" : "#22c55e",
          color: "#fff",
          border: "none",
          borderRadius: 10,
          fontSize: "15px",
          fontWeight: "bold",
          cursor: (uploading || !image) ? "not-allowed" : "pointer",
          boxShadow: "0 4px 10px rgba(34, 197, 94, 0.2)",
        }}
      >
        Continue →
      </button>

      {/* STATUS MESSAGE */}
      {scanStatus && (
        <p style={{ 
          fontSize: "13px", 
          marginTop: 12, 
          textAlign: "center", 
          fontWeight: "500",
          color: scanStatus.includes("❌") ? "#dc2626" : scanStatus.includes("✅") ? "#16a34a" : "#475569"
        }}>
          {scanStatus}
        </p>
      )}
      
      <div style={{ textAlign: 'left', marginTop: 15, fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
        Step 1 / 5
      </div>
    </div>
  );
}

export default CaptureIDCard;
