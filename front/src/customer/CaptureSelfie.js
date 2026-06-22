import React, { useState, useRef } from "react";
import axios from "axios";

const IMGBB_API_KEY = "ebd592608f4dba1e8271bec8e920c408";

function CaptureSelfie({ onSuccess }) {
  const [image, setImage] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [uploading, setUploading] = useState(false);

  const videoRef = useRef(null);

  // ======================
  // Open Selfie Camera
  // ======================
  const startSelfieCamera = async () => {
    try {
      setImage("");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user"
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

  // ======================
  // Upload Image to ImgBB
  // ======================
  const uploadSelfieToImgBB = async (base64Image) => {
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
      console.error("ImgBB Error:", err);
      return null;
    }
  };

  // ======================
  // Capture Selfie
  // ======================
  const captureSelfie = async () => {
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

    // stop camera
    if (video.srcObject) {
      video.srcObject
        .getTracks()
        .forEach((track) => track.stop());
    }

    setCameraActive(false);

    // upload
    setUploading(true);

    const uploadedUrl =
      await uploadSelfieToImgBB(base64Image);

    setUploading(false);

    if (uploadedUrl) {
      setImage(uploadedUrl);
    } else {
      alert("❌ ImgBB upload failed");
    }
  };

  // ======================
  // Next Step
  // ======================
  const handleNext = () => {
    if (!image) {
      alert("⚠️ እባክዎ መጀመሪያ selfie ያንሱ");
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
        textAlign: "center"
      }}
    >
      <h3>👤 ደረጃ 2 - Selfie</h3>

      <div
        style={{
          width: "200px",
          height: "200px",
          margin: "20px auto",
          borderRadius: "50%",
          overflow: "hidden",
          border: "4px solid #162447",
          background: "#f1f5f9"
        }}
      >
        {cameraActive && (
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
        )}

        {!cameraActive && image && (
          <img
            src={image}
            alt="Selfie"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover"
            }}
          />
        )}

        {!cameraActive && !image && !uploading && (
          <div
            style={{
              marginTop: "80px",
              fontSize: "40px"
            }}
          >
            👤
          </div>
        )}

        {uploading && (
          <div
            style={{
              marginTop: "85px"
            }}
          >
            ⏳ Uploading...
          </div>
        )}
      </div>

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
            borderRadius: "8px"
          }}
        >
          {image
            ? "🔄 እንደገና አንሳ"
            : "🤳 Selfie Camera"}
        </button>
      ) : (
        <button
          onClick={captureSelfie}
          style={{
            width: "100%",
            padding: "14px",
            background: "#22c55e",
            color: "#fff",
            border: "none",
            borderRadius: "8px"
          }}
        >
          📸 Capture
        </button>
      )}

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
            borderRadius: "8px"
          }}
        >
          Face Match →
        </button>
      )}
    </div>
  );
}

export default CaptureSelfie;
