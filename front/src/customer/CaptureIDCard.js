import React, { useState, useRef } from "react";
import axios from "axios";

const IMGBB_API_KEY = "YOUR_IMGBB_KEY";

function CaptureIDCard({ onSuccess }) {
  const [faydaNumber, setFaydaNumber] = useState("");
  const [image, setImage] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [uploading, setUploading] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    setCameraActive(false);
  };

  // start camera
  const startCamera = async () => {
    try {
      setImage("");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setCameraActive(true);
    } catch (err) {
      alert("❌ ካሜራ አልተከፈተም");
    }
  };

  // upload
  const uploadToImgBB = async (base64) => {
    try {
      const formData = new FormData();
      formData.append("image", base64.split(",")[1]);

      const res = await axios.post(
        `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
        formData
      );

      return res.data?.data?.url || null;
    } catch (err) {
      return null;
    }
  };

  // capture
  const capturePhoto = async () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    const base64 = canvas.toDataURL("image/jpeg", 0.8);

    stopCamera();
    setUploading(true);

    const url = await uploadToImgBB(base64);

    setUploading(false);

    if (url) {
      setImage(url);
    } else {
      alert("❌ Upload failed");
    }
  };

  const handleContinue = () => {
    if (!image) return alert("Take ID photo first");
    if (faydaNumber.length !== 16)
      return alert("Fayda must be 16 digits");

    onSuccess({ faydaNumber, image });
  };

  return (
    <div style={{ maxWidth: 450, margin: "auto" }}>
      <h3>ID Capture</h3>

      <div style={{ height: 250, background: "#000" }}>
        {cameraActive ? (
          <video ref={videoRef} autoPlay playsInline />
        ) : image ? (
          <img src={image} style={{ width: "100%" }} />
        ) : (
          <p style={{ color: "#fff" }}>Camera ready</p>
        )}
      </div>

      <button onClick={cameraActive ? capturePhoto : startCamera}>
        {cameraActive ? "Capture" : "Open Camera"}
      </button>

      <input
        value={faydaNumber}
        onChange={(e) =>
          setFaydaNumber(e.target.value.replace(/\D/g, ""))
        }
        maxLength={16}
        placeholder="Fayda Number"
      />

      <button onClick={handleContinue}>Continue</button>
    </div>
  );
}

export default CaptureIDCard;
