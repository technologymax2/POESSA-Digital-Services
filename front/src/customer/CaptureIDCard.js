import React, { useState, useRef } from "react";
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
  // Stop camera
  // ==========================
  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject
        .getTracks()
        .forEach((track) => track.stop());
    }

    setCameraActive(false);
  };

  // ==========================
  // Open camera
  // ==========================
  const startCamera = async () => {
    try {
      setImage("");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment"
        }
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
  // Upload to ImgBB
  // ==========================
  const uploadIdToImgBB = async (base64Image) => {
    try {
      const formData = new FormData();

      formData.append(
        "image",
        base64Image.split(",")[1]
      );

      const response = await axios.post(
        `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
        formData
      );

      return response.data?.data?.url;
    } catch (err) {
      console.error("Upload Error:", err);
      return null;
    }
  };

  // ==========================
  // Capture photo
  // ==========================
  const capturePhoto = async () => {
    const video = videoRef.current;

    if (!video) return;

    const canvas = document.createElement("canvas");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");

    ctx.drawImage(video, 0, 0);

    const base64Image = canvas.toDataURL(
      "image/jpeg",
      0.8
    );

    stopCamera();

    setUploading(true);
    setScanStatus("⏳ ፎቶ በመላክ ላይ...");

    const uploadedUrl = await uploadIdToImgBB(
      base64Image
    );

    setUploading(false);

    if (uploadedUrl) {
      setImage(uploadedUrl);
      setScanStatus("✅ ፎቶ ተሰቅሏል");
    } else {
      setScanStatus("❌ Upload failed");
    }
  };

  // ==========================
  // Continue
  // ==========================
  const handleContinue = () => {
    if (!image) {
      return alert("⚠️ መጀመሪያ የመታወቂያ ፎቶ ያንሱ");
    }

    if (faydaNumber.length !== 16) {
      return alert("⚠️ 16 ዲጂት የፋይዳ ቁጥር ያስገቡ");
    }

    onSuccess({
      faydaNumber,
      idPhotoUrl: image
    });
  };

  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "450px",
        margin: "auto",
        textAlign: "center"
      }}
    >
      <h3>🆔 የጡረተኛ መታወቂያ</h3>

      <div
        style={{
          width: "100%",
          aspectRatio: "1.6",
          background: "#000",
          borderRadius: "12px",
          overflow: "hidden"
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
              objectFit: "cover"
            }}
          />
        ) : image ? (
          <img
            src={image}
            alt="ID"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover"
            }}
          />
        ) : (
          <div
            style={{
              color: "#fff",
              paddingTop: "80px"
            }}
          >
            ካሜራ ዝግጁ
          </div>
        )}
      </div>

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
          borderRadius: "8px"
        }}
      >
        {cameraActive
          ? "📸 ቅረጽ"
          : image
          ? "🔄 እንደገና አንሳ"
          : "📷 ካሜራ ክፈት"}
      </button>

      <input
        type="text"
        maxLength="16"
        value={faydaNumber}
        onChange={(e) =>
          setFaydaNumber(
            e.target.value.replace(/\D/g, "")
          )
        }
        placeholder="16 ዲጂት የፋይዳ ቁጥር"
        style={{
          width: "100%",
          padding: "12px",
          marginTop: "15px"
        }}
      />

      <button
        onClick={handleContinue}
        disabled={uploading}
        style={{
          width: "100%",
          padding: "15px",
          marginTop: "15px",
          background: "#22c55e",
          color: "#fff",
          border: "none",
          borderRadius: "8px"
        }}
      >
        ቀጥል
      </button>

      <p>{scanStatus}</p>
    </div>
  );
}

export default CaptureIDCard;
