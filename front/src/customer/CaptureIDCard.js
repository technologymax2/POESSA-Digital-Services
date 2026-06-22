import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

const IMGBB_API_KEY = "YOUR_KEY_HERE";

function CaptureIDCard({ onSuccess }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null); // ✅ FIX: store stream safely

  const [faydaNumber, setFaydaNumber] = useState("");
  const [image, setImage] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [scanStatus, setScanStatus] = useState("");
  const [uploading, setUploading] = useState(false);

  // ==========================
  // CLEANUP
  // ==========================
  useEffect(() => {
    return () => stopCamera();
  }, []);

  // ==========================
  // STOP CAMERA (FIXED)
  // ==========================
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
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

      streamRef.current = stream; // ✅ FIX

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
  // UPLOAD TO IMGBB (FIXED)
  // ==========================
  const uploadIdToImgBB = async (base64Image) => {
    try {
      const cleanBase64 = base64Image.split(",")[1]; // ✅ FIX

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

  // ==========================
  // CAPTURE PHOTO
  // ==========================
  const capturePhoto = async () => {
    const video = videoRef.current;

    if (!video || video.videoWidth === 0) {
      alert("⏳ Camera not ready");
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
    setScanStatus("⏳ Uploading...");

    const uploadedUrl = await uploadIdToImgBB(base64Image);

    setUploading(false);

    if (uploadedUrl) {
      setImage(uploadedUrl);
      setScanStatus("✅ Upload successful");
    } else {
      setScanStatus("❌ Upload failed");
    }
  };

  // ==========================
  // CONTINUE
  // ==========================
  const handleContinue = () => {
    const cleanFayda = faydaNumber.replace(/\D/g, "");

    if (!image) return alert("⚠️ Take ID photo first");

    if (cleanFayda.length !== 16) {
      return alert("⚠️ Invalid 16-digit Fayda number");
    }

    onSuccess({
      faydaNumber: cleanFayda,
      idPhotoUrl: image,
      capturedAt: new Date().toISOString(),
    });
  };

  return (
    <div style={{ padding: 20, maxWidth: 450, margin: "auto" }}>
      <h3>🆔 ID Capture</h3>

      {/* CAMERA */}
      <div
        style={{
          width: "100%",
          aspectRatio: "1.6",
          background: "#000",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {cameraActive ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : image ? (
          <img
            src={image}
            alt="ID"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div style={{ color: "#fff", textAlign: "center", paddingTop: 80 }}>
            Camera Ready
          </div>
        )}
      </div>

      {/* BUTTON */}
      <button
        onClick={cameraActive ? capturePhoto : startCamera}
        disabled={uploading}
        style={{
          width: "100%",
          padding: 14,
          marginTop: 10,
          background: "#162447",
          color: "#fff",
          border: "none",
          borderRadius: 8,
        }}
      >
        {cameraActive
          ? "📸 Capture"
          : image
          ? "🔄 Retake"
          : "📷 Open Camera"}
      </button>

      {/* INPUT */}
      <input
        type="text"
        maxLength={16}
        value={faydaNumber}
        onChange={(e) =>
          setFaydaNumber(e.target.value.replace(/\D/g, ""))
        }
        placeholder="16-digit Fayda number"
        style={{
          width: "100%",
          padding: 12,
          marginTop: 15,
        }}
      />

      {/* CONTINUE */}
      <button
        onClick={handleContinue}
        disabled={uploading || !image}
        style={{
          width: "100%",
          padding: 15,
          marginTop: 15,
          background: "#22c55e",
          color: "#fff",
          border: "none",
          borderRadius: 8,
        }}
      >
        Continue →
      </button>

      <p style={{ fontSize: 12, marginTop: 10 }}>{scanStatus}</p>
    </div>
  );
}

export default CaptureIDCard;
