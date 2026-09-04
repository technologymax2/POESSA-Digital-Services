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
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error("ካሜራ መክፈት አልተቻለም፦", err);
      alert("እባክዎ የካሜራ ፈቃድ (Permission) ይፍቀዱ!");
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
    } catch (error) {
      console.error("❌ ImgBB Upload Error:", error);
      return null;
    }
  };

  const capturePhoto = async () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.filter = "contrast(1.3) brightness(1.1)";
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const base64Image = canvas.toDataURL("image/jpeg", 0.6);

    const stream = video.srcObject;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setCameraActive(false);

    setScanning(true);
    setScanStatus("⏳ ከመታወቂያው ላይ መረጃ እያነበብን እና ፎቶውን ወደ ደመናው እየሰቀልን ነው...");

    const uploadedUrl = await uploadIdToImgBB(base64Image);
    if (uploadedUrl) {
      setImage(uploadedUrl); 
    } else {
      setScanStatus("⚠️ ፎቶውን መጫን አልተቻለም። እባክዎ ድጋሚ ይሞክሩ።");
      setScanning(false);
      return;
    }

    try {
      let foundFayda = "";
      if (window.jsQR) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const qrCode = window.jsQR(imageData.data, imageData.width, imageData.height);
        if (qrCode && qrCode.data) {
          const qrMatch = qrCode.data.match(/\d{16}/);
          if (qrMatch) foundFayda = qrMatch[0];
        }
      }

      if (!foundFayda && window.Tesseract) {
        const result = await window.Tesseract.recognize(base64Image, "eng");
        const cleanText = result.data.text.replace(/[\s-]/g, "");
        const matched = cleanText.match(/\d{16}/);
        if (matched) foundFayda = matched[0];
      }

      if (foundFayda) {
        setFaydaNumber(foundFayda);
        setScanStatus("🟢 መታወቂያው በተሳካ ሁኔታ ተሰቅሏል፤ የፋይዳ ቁጥርም ተገኝቷል!");
      } else {
        setScanStatus("⚠️ ፎቶው ተሰቅሏል ነገር ግን ቁጥሩን በራስ-ሰር ማንበብ አልተቻለም። እባክዎ ከታች በእጅዎ ይሙሉ::");
      }
    } catch (error) {
      console.error(error);
      setScanStatus("⚠️ እባክዎ የፋይዳ ቁጥሩን ከታች በእጅዎ ይሙሉ::");
    } finally {
      setScanning(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (faydaNumber.length !== 16) {
      alert("⚠️ እባክዎ መጀመሪያ ባለ 16 ዲጂት የፋይዳ ቁጥር በትክክል መሙላቱን ያረጋግጡ!");
      return;
    }
    if (!image) {
      alert("⚠️ እባክዎ የመታወቂያውን ፎቶ ያንሱ!");
      return;
    }

    try {
      setVerifyingInDB(true);
      setScanStatus("⏳ የፋይዳ ቁጥሩን ከዳታቤዝ ጋር እያመሳከርን ነው...");
      
      const response = await axios.get(`${API_BASE_URL}/api/pensioners`);
      const pensionersList = response.data?.data || response.data;

      if (Array.isArray(pensionersList)) {
        const foundInDB = pensionersList.find(p => String(p.faydaNumber).trim() === String(faydaNumber).trim());
        
        if (foundInDB) {
          const name = foundInDB.nameAmh || foundInDB.nameEng || "ጡረተኛ";
          alert(`🟢 እንኳን ደህና መጡ ${name}! መረጃዎ ተረጋግጧል።`);
          onSuccess({ faydaNumber, idPhotoUrl: image, pensioner: foundInDB });
        } else {
          setScanStatus("❌ ይህ የፋይዳ ቁጥር በሲስተሙ ላይ አልተመዘገበም!");
          alert("❌ ስህተት፦ ይህ የፋይዳ ቁጥር በጡረታ ባለስልጣን ሲስተም ላይ አልተገኘም!");
        }
      } else {
        onSuccess({ faydaNumber, idPhotoUrl: image });
      }
    } catch (error) {
      console.error("DB Verification Error:", error);
      setScanStatus("⚠️ ሰርቨሩ ምላሽ አልሰጠም፤ ነገር ግን ወደ ቀጣዩ ደረጃ ማለፍ ይችላሉ።");
      onSuccess({ faydaNumber, idPhotoUrl: image });
    } finally {
      setVerifyingInDB(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg font-sans text-center">
      <h3 className="text-xl font-bold text-[#162447]">🆔 ደረጃ 1፡ የጡረተኛ መታወቂያ መረጃ</h3>
      <p className="text-gray-500 text-sm mt-1 mb-4">የ QR ኮዱን ወይም የፋይዳ ቁጥሩን በራስ-ሰር ለማንበብ ፎቶ ያንሱ</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="bg-gray-50 rounded-xl h-56 flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300">
          {cameraActive && <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />}
          {image && !cameraActive && <img src={image} alt="ID" className="w-full h-full object-cover" />}
          {!cameraActive && !image && <span className="text-gray-400 font-medium">📷 ካሜራው አልተከፈተም</span>}
        </div>

        {!cameraActive ? (
          <button 
            type="button" 
            onClick={startCamera} 
            disabled={scanning || verifyingInDB} 
            className="bg-gray-600 hover:bg-gray-700 text-white p-3 rounded-lg font-medium transition duration-200 shadow cursor-pointer"
          >
            {image ? "🔄 እንደገና አንሳ" : "📸 ካሜራ ክፈት"}
          </button>
        ) : (
          <button 
            type="button" 
            onClick={capturePhoto} 
            className="bg-green-600 hover:bg-green-700 text-white p-3 rounded-lg font-bold transition duration-200 shadow cursor-pointer"
          >
            🛑 ፎቶ ቅረጽ እና ስካን አድርግ
          </button>
        )}

        {scanStatus && (
          <p className={`text-xs font-semibold p-3 rounded-lg ${faydaNumber.length === 16 ? "text-green-700 bg-green-50 border border-green-200" : "text-amber-700 bg-amber-50 border border-amber-200"}`}>
            {scanStatus}
          </p>
        )}

        <div className="text-left">
          <label className="text-xs font-bold text-[#162447] uppercase tracking-wider">የፋይዳ ቁጥር / FAYDA Number (16 Digits)</label>
          <input 
            type="text" 
            maxLength="16"
            value={faydaNumber} 
            onChange={(e) => setFaydaNumber(e.target.value.replace(/\D/g, ""))}
            placeholder="እዚህ ጋር ይጻፉ..." 
            required
            disabled={verifyingInDB}
            className={`w-full p-3 mt-1 rounded-lg border-2 font-bold text-lg tracking-wider text-center transition outline-none ${
              faydaNumber.length === 16 
                ? "border-green-500 bg-green-50 text-green-900" 
                : "border-red-300 bg-white focus:border-[#162447]"
            }`}
          />
        </div>

        <button 
          type="submit" 
          disabled={scanning || verifyingInDB || faydaNumber.length !== 16} 
          className={`w-full p-3.5 rounded-lg text-white font-bold transition shadow-md ${
            faydaNumber.length === 16 && !verifyingInDB 
              ? "bg-[#162447] hover:bg-[#101b36] cursor-pointer" 
              : "bg-gray-300 cursor-not-allowed"
          }`}
        >
          {verifyingInDB ? "⏳ መረጃ በመፈተሽ ላይ..." : "ቀጥል (ከዳታቤዝ ጋር አመሳስል) →"}
        </button>
      </form>
    </div>
  );
}

export default CaptureIDCard;
