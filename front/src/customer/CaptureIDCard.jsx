import React, { useState, useRef } from "react";
import axios from "axios";

const API_BASE_URL = "https://poessa-digital-services-1.onrender.com";
const IMGBB_API_KEY = "ebd592608f4dba1e8271bec8e920c408";

function CaptureIDCard({ onSuccess }) {
  const [faydaNumber, setFaydaNumber] = useState("");
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [currentSide, setCurrentSide] = useState("front"); // "front" or "back"
  const [cameraActive, setCameraActive] = useState(false);
  const [scanStatus, setScanStatus] = useState(""); 
  const [scanning, setScanning] = useState(false); 
  const [verifyingInDB, setVerifyingInDB] = useState(false);
  const videoRef = useRef(null);

  const startCamera = (side) => {
    setCurrentSide(side);
    setCameraActive(true);
    setScanStatus("");
    navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } } 
    })
    .then((stream) => {
      if (videoRef.current) videoRef.current.srcObject = stream;
    })
    .catch((err) => {
      console.error("ካሜራ መክፈት አልተቻለም፦", err);
      alert("እባክዎ የካሜራ ፈቃድ (Permission) ይፍቀዱ!");
      setCameraActive(false);
    });
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
    setScanStatus(`⏳ የመታወቂያውን ${currentSide === "front" ? "የፊት" : "የኋላ"} ፎቶ ወደ ደመናው እየሰቀልን ነው...`);

    const uploadedUrl = await uploadIdToImgBB(base64Image);
    if (!uploadedUrl) {
      setScanStatus("⚠️ ፎቶውን መጫን አልተቻለም። እባክዎ ድጋሚ ይሞክሩ።");
      setScanning(false);
      return;
    }

    if (currentSide === "front") {
      setFrontImage(uploadedUrl);
      setScanStatus("⏳ ከመታወቂያው ላይ የፋይዳ ቁጥር እያነበብን ነው...");

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
          setScanStatus("🟢 የፊት ገጽ ተሰቅሏል! አሁን የኋላውን ገጽ ፎቶ ያንሱ።");
        } else {
          setScanStatus("⚠️ የፊት ገጽ ተሰቅሏል ነገር ግን ቁጥሩን በራስ-ሰር ማንበብ አልተቻለም። እባክዎ ከታች በእጅዎ ይሙሉ ወይም ያስገቡ።");
        }
      } catch (error) {
        console.error(error);
        setScanStatus("⚠️ የፊት ገጽ ተሰቅሏል፤ የፋይዳ ቁጥሩን እባክዎ ከታች ይሙሉ::");
      } finally {
        setScanning(false);
      }
    } else {
      setBackImage(uploadedUrl);
      setScanStatus("🟢 የኋላ መታወቂያው በተሳካ ሁኔታ ተሰቅሏል!");
      setScanning(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (faydaNumber.length !== 16) {
      alert("⚠️ እባክዎ መጀመሪያ ባለ 16 ዲጂት የፋይዳ ቁጥር በትክክል መሙላቱን ያረጋግጡ!");
      return;
    }
    if (!frontImage || !backImage) {
      alert("⚠️ እባክዎ የመታወቂያውን ሁለቱንም (የፊት እና የኋላ) ፎቶዎች ያንሱ!");
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
          onSuccess({ 
            faydaNumber, 
            frontIdUrl: frontImage, 
            backIdUrl: backImage, 
            pensioner: foundInDB 
          });
        } else {
          setScanStatus("❌ ይህ የፋይዳ ቁጥር በሲስተሙ ላይ አልተመዘገበም!");
          alert("❌ ስህተት፦ ይህ የፋይዳ ቁጥር በጡረታ ባለስልጣን ሲስተም ላይ አልተገኘም!");
        }
      } else {
        onSuccess({ faydaNumber, frontIdUrl: frontImage, backIdUrl: backImage });
      }
    } catch (error) {
      console.error("DB Verification Error:", error);
      setScanStatus("⚠️ ሰርቨሩ ምላሽ አልሰጠም፤ ነገር ግን ወደ ቀጣዩ ደረጃ ማለፍ ይችላሉ።");
      onSuccess({ faydaNumber, frontIdUrl: frontImage, backIdUrl: backImage });
    } finally {
      setVerifyingInDB(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg font-sans text-center">
      <h3 className="text-xl font-bold text-[#162447]">🆔 ደረጃ 1፡ የመታወቂያ ፎቶዎች (የፊት እና የኋላ)</h3>
      <p className="text-gray-500 text-sm mt-1 mb-4">እባክዎ የመታወቂያውን የፊት እና የኋላ ገጽ በቅደም ተከተል ያንሱ</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="bg-gray-50 rounded-xl h-52 flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 relative">
          {cameraActive && <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />}
          
          {!cameraActive && currentSide === "front" && frontImage && (
            <img src={frontImage} alt="ID Front" className="w-full h-full object-cover" />
          )}
          {!cameraActive && currentSide === "back" && backImage && (
            <img src={backImage} alt="ID Back" className="w-full h-full object-cover" />
          )}

          {!cameraActive && !frontImage && !backImage && (
            <span className="text-gray-400 font-medium">📷 ካሜራው አልተከፈተም</span>
          )}
          
          <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
            {currentSide === "front" ? "የፊት ገጽ (Front)" : "የኋላ ገጽ (Back)"}
          </div>
        </div>

        <div className="flex gap-2">
          {!cameraActive ? (
            <>
              <button 
                type="button" 
                onClick={() => startCamera("front")} 
                disabled={scanning || verifyingInDB} 
                className={`flex-1 p-2.5 rounded-lg font-medium text-sm transition shadow text-white ${frontImage ? "bg-green-700 hover:bg-green-800" : "bg-gray-700 hover:bg-gray-800"}`}
              >
                {frontImage ? "🔄 የፊት ፎቶ ቀይር" : "📸 የፊት ፎቶ አንሳ"}
              </button>
              
              <button 
                type="button" 
                onClick={() => startCamera("back")} 
                disabled={scanning || verifyingInDB || !frontImage} 
                className={`flex-1 p-2.5 rounded-lg font-medium text-sm transition shadow text-white ${!frontImage ? "bg-gray-300 cursor-not-allowed" : backImage ? "bg-green-700 hover:bg-green-800" : "bg-gray-700 hover:bg-gray-800"}`}
              >
                {backImage ? "🔄 የኋላ ፎቶ ቀይር" : "📸 የኋላ ፎቶ አንሳ"}
              </button>
            </>
          ) : (
            <button 
              type="button" 
              onClick={capturePhoto} 
              className="w-full bg-green-600 hover:bg-green-700 text-white p-3 rounded-lg font-bold transition duration-200 shadow cursor-pointer"
            >
              🛑 {currentSide === "front" ? "የፊት ፎቶ ቅረጽ እና ስካን አድርግ" : "የኋላ ፎቶ ቅረጽ"}
            </button>
          )}
        </div>

        {/* Status display */}
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
          disabled={scanning || verifyingInDB || faydaNumber.length !== 16 || !frontImage || !backImage} 
          className={`w-full p-3.5 rounded-lg text-white font-bold transition shadow-md ${
            faydaNumber.length === 16 && frontImage && backImage && !verifyingInDB 
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
