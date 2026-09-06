import React, { useState, useRef } from "react";
import axios from "axios";

const API_BASE_URL = "https://poessa-digital-services-1.onrender.com";
const IMGBB_API_KEY = "ebd592608f4dba1e8271bec8e920c408";

function CaptureIDCard({ onSuccess }) {
  const [faydaNumber, setFaydaNumber] = useState("");
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [currentSide, setCurrentSide] = useState("front");

  const [cameraActive, setCameraActive] = useState(false);
  const [scanStatus, setScanStatus] = useState("");
  const [scanning, setScanning] = useState(false);
  const [verifyingInDB, setVerifyingInDB] = useState(false);

  const videoRef = useRef(null);

  const stopCamera = () => {
    const video = videoRef.current;

    if (video && video.srcObject) {
      video.srcObject.getTracks().forEach((track) => track.stop());
      video.srcObject = null;
    }

    setCameraActive(false);
  };

  const startCamera = async (side) => {
    try {
      stopCamera();

      setCurrentSide(side);
      setScanStatus("");
      setCameraActive(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        await videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.error("Camera Error:", err);

      setCameraActive(false);

      alert(
        "እባክዎ የካሜራ ፈቃድ (Camera Permission) ይፍቀዱ።"
      );
    }
  };

  const uploadIdToImgBB = async (base64Image) => {
    try {
      if (!base64Image) return null;

      const cleanBase64 = base64Image.includes(",")
        ? base64Image.split(",")[1]
        : base64Image;

      const formData = new FormData();
      formData.append("image", cleanBase64);

      const response = await axios.post(
        `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
        formData
      );

      return response.data?.data?.url || null;
    } catch (error) {
      console.error("ImgBB Upload Error:", error);
      return null;
    }
  };

  const detectFaydaNumber = async (base64Image, ctx, canvas) => {
    let foundFayda = "";

    /*
     * =========================
     * 1. QR CODE
     * =========================
     */
    try {
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
          const qrMatch = qrCode.data.match(/\d{16}/);

          if (qrMatch) {
            foundFayda = qrMatch[0];
          }
        }
      }
    } catch (qrError) {
      console.warn("QR scan failed:", qrError);
    }

    /*
     * =========================
     * 2. OCR
     * =========================
     */
    if (!foundFayda) {
      try {
        if (window.Tesseract) {
          const result = await window.Tesseract.recognize(
            base64Image,
            "eng"
          );

          const cleanText = (result?.data?.text || "").replace(
            /[\s-]/g,
            ""
          );

          const matched = cleanText.match(/\d{16}/);

          if (matched) {
            foundFayda = matched[0];
          }
        }
      } catch (ocrError) {
        console.warn("OCR failed:", ocrError);
      }
    }

    return foundFayda;
  };

  const capturePhoto = async () => {
    if (scanning || verifyingInDB) return;

    const video = videoRef.current;

    if (!video || !video.videoWidth || !video.videoHeight) {
      alert("ካሜራው ገና ዝግጁ አይደለም።");
      return;
    }

    try {
      setScanning(true);

      const canvas = document.createElement("canvas");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");

      ctx.filter = "contrast(1.3) brightness(1.1)";
      ctx.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height
      );

      const base64Image = canvas.toDataURL(
        "image/jpeg",
        0.8
      );

      stopCamera();

      const sideName =
        currentSide === "front"
          ? "የፊት"
          : "የኋላ";

      setScanStatus(
        `⏳ ${sideName} የመታወቂያ ፎቶ ወደ ደመናው እየተሰቀለ ነው...`
      );

      const uploadedUrl = await uploadIdToImgBB(base64Image);

      if (!uploadedUrl) {
        setScanStatus(
          "❌ ፎቶውን መስቀል አልተቻለም። እባክዎ ድጋሚ ይሞክሩ።"
        );

        return;
      }

      /*
       * =========================
       * FRONT SIDE
       * =========================
       */
      if (currentSide === "front") {
        setFrontImage(uploadedUrl);

        setScanStatus(
          "⏳ ከየፊት መታወቂያው ላይ የFAYDA ቁጥር እየተነበበ ነው..."
        );

        const foundFayda = await detectFaydaNumber(
          base64Image,
          ctx,
          canvas
        );

        if (foundFayda) {
          setFaydaNumber(foundFayda);

          setScanStatus(
            "🟢 የፊት ገጽ ተሰቅሏል። FAYDA ቁጥሩም ተነቧል። አሁን የኋላውን ገጽ ያንሱ።"
          );
        } else {
          setScanStatus(
            "🟡 የፊት ገጽ ተሰቅሏል፤ FAYDA ቁጥሩ በራስ-ሰር ሊነበብ አልተቻለም። እባክዎ ከታች በእጅ ያስገቡ።"
          );
        }
      }

      /*
       * =========================
       * BACK SIDE
       * =========================
       */
      else {
        setBackImage(uploadedUrl);

        setScanStatus(
          "🟢 የኋላ ገጽ በተሳካ ሁኔታ ተሰቅሏል።"
        );
      }
    } catch (error) {
      console.error("Capture Error:", error);

      setScanStatus(
        "❌ ፎቶ ማንሳት ላይ ስህተት ተፈጥሯል።"
      );
    } finally {
      setScanning(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (faydaNumber.length !== 16) {
      alert(
        "⚠️ እባክዎ ትክክለኛ 16 ዲጂት FAYDA ቁጥር ያስገቡ።"
      );
      return;
    }

    if (!frontImage) {
      alert("⚠️ የመታወቂያውን የፊት ገጽ ያንሱ።");
      return;
    }

    if (!backImage) {
      alert("⚠️ የመታወቂያውን የኋላ ገጽ ያንሱ።");
      return;
    }

    try {
      setVerifyingInDB(true);

      setScanStatus(
        "⏳ FAYDA ቁጥሩ ከዳታቤዝ ጋር እየተመሳከረ ነው..."
      );

      const response = await axios.get(
        `${API_BASE_URL}/api/pensioners`
      );

      const pensionersList =
        response.data?.data || response.data;

      if (!Array.isArray(pensionersList)) {
        throw new Error("Invalid pensioner response");
      }

      const foundPensioner = pensionersList.find(
        (p) =>
          String(p.faydaNumber || "").trim() ===
          String(faydaNumber).trim()
      );

      if (!foundPensioner) {
        setScanStatus(
          "❌ ይህ FAYDA ቁጥር በዳታቤዝ ላይ አልተገኘም።"
        );

        alert(
          "❌ ይህ የFAYDA ቁጥር በሲስተሙ ላይ አልተመዘገበም።"
        );

        return;
      }

      const name =
        foundPensioner.nameAmh ||
        foundPensioner.nameEng ||
        foundPensioner.name ||
        "ጡረተኛ";

      setScanStatus(
        "🟢 FAYDA ቁጥሩ ከዳታቤዝ ጋር ተመሳክሯል።"
      );

      /*
       * IMPORTANT:
       * Send BOTH ID URLs to Verify.js.
       */
      onSuccess({
        faydaNumber,
        frontIdUrl: frontImage,
        backIdUrl: backImage,
        pensioner: foundPensioner,
      });

      alert(
        `🟢 እንኳን ደህና መጡ ${name}! መረጃዎ ተገኝቷል።`
      );
    } catch (error) {
      console.error("DB Verification Error:", error);

      setScanStatus(
        "⚠️ ከሰርቨሩ ጋር ለመመሳከር ስህተት ተፈጥሯል።"
      );

      alert(
        "⚠️ ከዳታቤዝ ጋር መረጃውን ማመሳከር አልተቻለም።"
      );
    } finally {
      setVerifyingInDB(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg font-sans text-center">

      <h3 className="text-xl font-bold text-[#162447]">
        🆔 ደረጃ 1፦ የመታወቂያ ፎቶ
      </h3>

      <p className="text-gray-500 text-sm mt-1 mb-4">
        የፊት እና የኋላ ገጽ ፎቶዎችን በቅደም ተከተል ያንሱ
      </p>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
      >

        {/* CAMERA */}
        <div className="bg-gray-50 rounded-xl h-52 flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 relative">

          {cameraActive && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          )}

          {!cameraActive &&
            currentSide === "front" &&
            frontImage && (
              <img
                src={frontImage}
                alt="ID Front"
                className="w-full h-full object-cover"
              />
            )}

          {!cameraActive &&
            currentSide === "back" &&
            backImage && (
              <img
                src={backImage}
                alt="ID Back"
                className="w-full h-full object-cover"
              />
            )}

          {!cameraActive &&
            !frontImage &&
            !backImage && (
              <span className="text-gray-400 font-medium">
                📷 ካሜራው አልተከፈተም
              </span>
            )}

          <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
            {currentSide === "front"
              ? "የፊት ገጽ (Front)"
              : "የኋላ ገጽ (Back)"}
          </div>
        </div>

        {/* CAMERA BUTTONS */}
        {!cameraActive ? (
          <div className="flex gap-2">

            <button
              type="button"
              onClick={() => startCamera("front")}
              disabled={scanning || verifyingInDB}
              className={`flex-1 p-2.5 rounded-lg font-medium text-sm text-white shadow ${
                frontImage
                  ? "bg-green-700 hover:bg-green-800"
                  : "bg-gray-700 hover:bg-gray-800"
              }`}
            >
              {frontImage
                ? "🔄 የፊት ፎቶ ቀይር"
                : "📸 የፊት ፎቶ አንሳ"}
            </button>

            <button
              type="button"
              onClick={() => startCamera("back")}
              disabled={
                scanning ||
                verifyingInDB ||
                !frontImage
              }
              className={`flex-1 p-2.5 rounded-lg font-medium text-sm text-white shadow ${
                !frontImage
                  ? "bg-gray-300 cursor-not-allowed"
                  : backImage
                  ? "bg-green-700 hover:bg-green-800"
                  : "bg-gray-700 hover:bg-gray-800"
              }`}
            >
              {backImage
                ? "🔄 የኋላ ፎቶ ቀይር"
                : "📸 የኋላ ፎቶ አንሳ"}
            </button>

          </div>
        ) : (
          <button
            type="button"
            onClick={capturePhoto}
            disabled={scanning}
            className="w-full bg-green-600 hover:bg-green-700 text-white p-3 rounded-lg font-bold shadow"
          >
            📸{" "}
            {currentSide === "front"
              ? "የፊት ፎቶ ቅረጽ"
              : "የኋላ ፎቶ ቅረጽ"}
          </button>
        )}

        {/* STATUS */}
        {scanStatus && (
          <p
            className={`text-xs font-semibold p-3 rounded-lg ${
              faydaNumber.length === 16
                ? "text-green-700 bg-green-50 border border-green-200"
                : "text-amber-700 bg-amber-50 border border-amber-200"
            }`}
          >
            {scanStatus}
          </p>
        )}

        {/* FAYDA */}
        <div className="text-left">

          <label className="text-xs font-bold text-[#162447]">
            FAYDA Number (16 Digits)
          </label>

          <input
            type="text"
            maxLength={16}
            inputMode="numeric"
            value={faydaNumber}
            onChange={(e) =>
              setFaydaNumber(
                e.target.value.replace(/\D/g, "")
              )
            }
            placeholder="16 ዲጂት FAYDA ቁጥር..."
            required
            disabled={verifyingInDB}
            className={`w-full p-3 mt-1 rounded-lg border-2 font-bold text-lg tracking-wider text-center outline-none ${
              faydaNumber.length === 16
                ? "border-green-500 bg-green-50 text-green-900"
                : "border-red-300"
            }`}
          />

        </div>

        {/* SUBMIT */}
        <button
          type="submit"
          disabled={
            scanning ||
            verifyingInDB ||
            faydaNumber.length !== 16 ||
            !frontImage ||
            !backImage
          }
          className={`w-full p-3.5 rounded-lg text-white font-bold shadow-md ${
            faydaNumber.length === 16 &&
            frontImage &&
            backImage &&
            !verifyingInDB
              ? "bg-[#162447] hover:bg-[#101b36]"
              : "bg-gray-300 cursor-not-allowed"
          }`}
        >
          {verifyingInDB
            ? "⏳ ከDB ጋር በማመሳከር ላይ..."
            : "ቀጥል →"}
        </button>

      </form>
    </div>
  );
}

export default CaptureIDCard;
