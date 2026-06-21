import React, { useState, useRef } from "react";
import axios from "axios";

const API_BASE_URL = "https://poessa-digital-services-1.onrender.com";
const IMGBB_API_KEY = "ebd592608f4dba1e8271bec8e920c408";

function CaptureIDCard({ onSuccess }) {
const [faydaNumber, setFaydaNumber] = useState("");
const [image, setImage] = useState(null);
const [cameraActive, setCameraActive] = useState(false);
const [scanStatus, setScanStatus] = useState("");
const [scanning, setScanning] = useState(false);
const [verifyingInDB, setVerifyingInDB] = useState(false);

const videoRef = useRef(null);

const startCamera = async () => {
setCameraActive(true);
setScanStatus("");

```
try {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: "environment",
      width: { ideal: 1280 },
      height: { ideal: 720 }
    }
  });

  if (videoRef.current) {
    videoRef.current.srcObject = stream;
  }
} catch (err) {
  console.error(err);
  alert("እባክዎ የካሜራ ፈቃድ ይፍቀዱ!");
}
```

};

const uploadIdToImgBB = async (base64Image) => {
try {
const cleanBase64 = base64Image.split(",")[1];

```
  const formData = new FormData();
  formData.append("image", cleanBase64);

  const response = await axios.post(
    `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
    formData
  );

  return response.data?.data?.display_url || null;
} catch (error) {
  console.error("ImgBB Error:", error);
  return null;
}
```

};

const capturePhoto = async () => {
const video = videoRef.current;

```
if (!video) return;

const canvas = document.createElement("canvas");
canvas.width = 600;
canvas.height = 400;

const ctx = canvas.getContext("2d");
ctx.filter = "contrast(1.3) brightness(1.1)";
ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

const base64Image = canvas.toDataURL("image/jpeg", 0.6);

const stream = video.srcObject;

if (stream) {
  stream.getTracks().forEach((track) => track.stop());
}

setCameraActive(false);
setScanning(true);

setScanStatus(
  "⏳ ከመታወቂያው ላይ መረጃ እያነበብን እና ፎቶውን ወደ ImgBB እየሰቀልን ነው..."
);

const uploadedUrl = await uploadIdToImgBB(base64Image);

if (!uploadedUrl) {
  setScanStatus(
    "⚠️ ፎቶውን ወደ ImgBB መጫን አልተቻለም!"
  );
  setScanning(false);
  return;
}

setImage(uploadedUrl);

try {
  let foundFayda = "";

  if (window.jsQR) {
    const imageData = ctx.getImageData(
      0,
      0,
      canvas.width,
      canvas.height
    );

    const qrCode = window.jsQR(
      imageData.data,
      imageData.width,
      imageData.height
    );

    if (qrCode?.data) {
      const match = qrCode.data.match(/\d{16}/);

      if (match) {
        foundFayda = match[0];
      }
    }
  }

  if (!foundFayda && window.Tesseract) {
    const result = await window.Tesseract.recognize(
      base64Image,
      "eng"
    );

    const cleanText = result.data.text.replace(/[\s-]/g, "");

    const match = cleanText.match(/\d{16}/);

    if (match) {
      foundFayda = match[0];
    }
  }

  if (foundFayda) {
    setFaydaNumber(foundFayda);

    setScanStatus(
      "🟢 መታወቂያው ተሰቅሏል፤ የፋይዳ ቁጥሩም ተገኝቷል!"
    );
  } else {
    setScanStatus(
      "⚠️ AI የፋይዳ ቁጥሩን አላነበበውም፤ በእጅዎ ይሙሉ።"
    );
  }
} catch (error) {
  console.error(error);

  setScanStatus(
    "⚠️ እባክዎ የፋይዳ ቁጥሩን በእጅዎ ይሙሉ።"
  );
} finally {
  setScanning(false);
}
```

};
const handleSubmit = async (e) => {
e.preventDefault();

```
if (faydaNumber.length !== 16) {
  alert(
    "⚠️ እባክዎ 16 ዲጂት የፋይዳ ቁጥር ያስገቡ!"
  );
  return;
}

if (!image) {
  alert("⚠️ እባክዎ የመታወቂያውን ፎቶ ያንሱ!");
  return;
}

try {
  setVerifyingInDB(true);

  setScanStatus(
    "⏳ የፋይዳ ቁጥሩን ከዳታቤዝ ጋር እያመሳከርን ነው..."
  );

  const response = await axios.get(
    `${API_BASE_URL}/pensioners`
  );

  if (response.data.success) {
    const foundInDB = response.data.data.find(
      (p) => p.faydaNumber === faydaNumber
    );

    if (foundInDB) {
      const name =
        foundInDB.nameAmh ||
        foundInDB.name ||
        "ጡረተኛ";

      alert(
        `🟢 እንኳን ደህና መጡ ${name}!`
      );

      onSuccess({
        faydaNumber,
        idPhotoUrl: image
      });
    } else {
      setScanStatus(
        "❌ ይህ የፋይዳ ቁጥር በሲስተሙ ላይ አልተገኘም!"
      );

      alert(
        "❌ ይህ የፋይዳ ቁጥር በሲስተሙ ላይ አልተገኘም!"
      );
    }
  }
} catch (error) {
  console.error("DB Verification Error:", error);

  onSuccess({
    faydaNumber,
    idPhotoUrl: image
  });
} finally {
  setVerifyingInDB(false);
}

return (
<div
style={{
padding: "20px",
maxWidth: "450px",
margin: "0 auto",
textAlign: "center",
fontFamily: "sans-serif"
}}
>
<h3 style={{ color: "#162447" }}>
🆔 ደረጃ 1፡ የጡረተኛ መታወቂያ </h3>
  <form
    onSubmit={handleSubmit}
    style={{
      display: "flex",
      flexDirection: "column",
      gap: "15px"
    }}
  >
    <div
      style={{
        background: "#f1f5f9",
        borderRadius: "12px",
        height: "220px",
        overflow: "hidden",
        border: "2px dashed #cbd5e1"
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

      {image && !cameraActive && (
        <img
          src={image}
          alt="ID"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover"
          }}
        />
      )}
    </div>

    {!cameraActive ? (
      <button
        type="button"
        onClick={startCamera}
      >
        {image
          ? "🔄 እንደገና አንሳ"
          : "📸 ካሜራ ክፈት"}
      </button>
    ) : (
      <button
        type="button"
        onClick={capturePhoto}
      >
        🛑 ፎቶ ቅረጽ
      </button>
    )}

    {scanStatus && (
      <p>{scanStatus}</p>
    )}

    <input
      type="text"
      maxLength="16"
      value={faydaNumber}
      onChange={(e) =>
        setFaydaNumber(
          e.target.value.replace(/\D/g, "")
        )
      }
      placeholder="FAYDA Number"
      required
    />

    <button
      type="submit"
      disabled={
        scanning ||
        verifyingInDB ||
        faydaNumber.length !== 16
      }
    >
      {verifyingInDB
        ? "⏳ በመፈተሽ ላይ..."
        : "ቀጥል →"}
    </button>
  </form>
</div>

);
}

export default CaptureIDCard;
