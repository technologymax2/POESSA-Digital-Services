import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

const IMGBB_API_KEY = "ebd592608f4dba1e8271bec8e920c408";

function CaptureSelfie({ onSuccess }) {
  const [image, setImage] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [uploading, setUploading] = useState(false);

  const videoRef = useRef(null);

  // ======================
  // CLEANUP CAMERA ON EXIT
  // ======================
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // ======================
  // STOP CAMERA (FIXED)
  // ======================
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

  // ======================
  // START CAMERA
  // ======================
  const startSelfieCamera = async () => {
    try {
      setImage("");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
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

  // ======================
  // UPLOAD TO IMGBB (FIXED)
  // ======================
  const uploadSelfieToImgBB = async (base64Image) => {
    try {
      const formData = new FormData();

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
      console.error("ImgBB Error:", err);
      return null;
    }
  };

  // ======================
  // CAPTURE SELFIE
  // ======================
  const captureSelfie = async () => {
    const video = videoRef.current;

    if (!video || video.videoWidth === 0) {
      alert("⏳ Camera not ready yet");
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

    const uploadedUrl = await uploadSelfieToImgBB(base64Image);

    setUploading(false);

    if (uploadedUrl) {
      setImage(uploadedUrl);
    } else {
      alert("❌ ImgBB upload failed");
    }
  };

  // ======================
  // NEXT STEP
  // ======================
  const handleNext = () => {
    if (!image) {
      alert("⚠️ መጀመሪያ selfie ያንሱ");
      return;
    }

    onSuccess(image);
  };

  return (
    <div
      style={{
        maxWidth: "450px",
        margin: "0 auto",
        padding: "20px",
        textAlign: "center",
      }}
    >
      <h3>👤 ደረጃ 2 - Selfie Capture</h3>

      {/* CAMERA UI */}
      <div
        style={{
          width: "200px",
          height: "200px",
          margin: "20px auto",
          borderRadius: "50%",
          overflow: "hidden",
          border: "4px solid #162447",
          background: "#f1f5f9",
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
            alt="Selfie"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : uploading ? (
          <div style={{ marginTop: "85px" }}>⏳ Uploading...</div>
        ) : (
          <div style={{ marginTop: "80px", fontSize: "40px" }}>👤</div>
        )}
      </div>

      {/* CAMERA BUTTON */}
      {!cameraActive ? (
        <button
          onClick={startSelfieCamera}
          disabled={uploading}
          style={{
            width: "100%",
            padding: "14px",
            background: "#475569",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
          }}
        >
          {image ? "🔄 እንደገና አንሳ" : "🤳 Selfie Camera"}
        </button>
      ) : (
        <button
          onClick={captureSelfie}
          disabled={uploading}
          style={{
            width: "100%",
            padding: "14px",
            background: "#22c55e",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
          }}
        >
          📸 Capture
        </button>
      )}

      {/* NEXT BUTTON */}
      {image && !uploading && (
        <button
          onClick={handleNext}
          style={{
            width: "100%",
            marginTop: "15px",
            padding: "15px",
            background: "#162447",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
          }}
        >
          Face Match →
        </button>
      )}
    </div>
  );
}

export default CaptureSelfie;
