import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

const IMGBB_API_KEY = "ebd592608f4dba1e8271bec8e920c408";

function CaptureIDCard({ onSuccess }) {
  const [faydaNumber, setFaydaNumber] = useState("");
  const [image, setImage] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [scanStatus, setScanStatus] = useState("");
  const [uploading, setUploading] = useState(false);

  const videoRef = useRef(null);

  // ==========================
  // CLEANUP CAMERA ON UNMOUNT
  // ==========================
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // ==========================
  // STOP CAMERA
  // ==========================
  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraActive(false);
  };

  // ==========================
  // START CAMERA
  // ==========================
  const startCamera = async () => {
    try {
      setImage("");
      setScanStatus("");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setCameraActive(true);
    } catch (err) {
      console.error(err);
      alert("❌ ካሜራ መክፈት አልተቻለም");
    }
  };

  // ==========================
  // UPLOAD IMAGE TO IMGBB
  // ==========================
  const uploadIdToImgBB = async (base64Image) => {
    try {
      const formData = new FormData();

      // FIXED: proper base64 cleanup
      const cleanBase64 = base64Image.replace(
        /^data:image\/\w+;base64,/,
        ""
      );

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

  // ==========================
  // CAPTURE PHOTO
  // ==========================
  const capturePhoto = async () => {
    const video = videoRef.current;

    if (!video || video.videoWidth === 0) {
      alert("⏳ ካሜራ እስካሁን አልተዘጋጀም");
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
    setScanStatus("⏳ ፎቶ በመላክ ላይ...");

    const uploadedUrl = await uploadIdToImgBB(base64Image);

    setUploading(false);

    if (uploadedUrl) {
      setImage(uploadedUrl);
      setScanStatus("✅ ፎቶ ተሳክቷል");
    } else {
      setScanStatus("❌ Upload failed");
    }
  };

  // ==========================
  // CONTINUE
  // ==========================
  const handleContinue = () => {
    const cleanFayda = faydaNumber.replace(/\D/g, "");

    if (!image) {
      return alert("⚠️ መጀመሪያ ፎቶ ያንሱ");
    }

    if (cleanFayda.length !== 16) {
      return alert("⚠️ 16 ዲጂት የፋይዳ ቁጥር ያስገቡ");
    }

    setScanStatus("🎉 ተሳክቷል");

    onSuccess({
      faydaNumber: cleanFayda,
      idPhotoUrl: image,
      capturedAt: new Date().toISOString(),
    });
  };

  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "450px",
        margin: "auto",
        textAlign: "center",
      }}
    >
      <h3>🆔 የጡረተኛ መታወቂያ ካሜራ</h3>

      {/* CAMERA VIEW */}
      <div
        style={{
          width: "100%",
          aspectRatio: "1.6",
          background: "#000",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        {cameraActive ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : image ? (
          <img
            src={image}
            alt="ID"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <div style={{ color: "#fff", paddingTop: "80px" }}>
            ካሜራ ዝግጁ
          </div>
        )}
      </div>

      {/* CAMERA BUTTON */}
      <button
        onClick={cameraActive ? capturePhoto : startCamera}
        disabled={uploading}
        style={{
          width: "100%",
          padding: "14px",
          marginTop: "10px",
          background: "#162447",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
        }}
      >
        {cameraActive
          ? "📸 ቅረጽ"
          : image
          ? "🔄 እንደገና አንሳ"
          : "📷 ካሜራ ክፈት"}
      </button>

      {/* FAYDA INPUT */}
      <input
        type="text"
        maxLength="16"
        value={faydaNumber}
        onChange={(e) =>
          setFaydaNumber(e.target.value.replace(/\D/g, ""))
        }
        placeholder="16 ዲጂት የፋይዳ ቁጥር"
        style={{
          width: "100%",
          padding: "12px",
          marginTop: "15px",
        }}
      />

      {/* CONTINUE */}
      <button
        onClick={handleContinue}
        disabled={uploading || !image}
        style={{
          width: "100%",
          padding: "15px",
          marginTop: "15px",
          background: "#22c55e",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
        }}
      >
        ቀጥል
      </button>

      {/* STATUS */}
      <p style={{ marginTop: "10px", fontSize: "13px" }}>
        {scanStatus}
      </p>
    </div>
  );
}

export default CaptureIDCard;
