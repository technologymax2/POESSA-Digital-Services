import React, { useState } from "react";
import axios from "axios";
import "./Verification.css";

// የደረጃ ክፍሎቹን ማስገባት
import CaptureIDCard from "./CaptureIDCard";
import CaptureSelfie from "./CaptureSelfie";
import FaceMatch from "./FaceMatch";
import LivenessTest from "./LivenessTest";
import VerificationSuccess from "./VerificationSuccess";

// 📸 ምስሎችን አሳንሶ ጥራት ሳይቀንስ የሚልክ ፈንክሽን
const compressImage = (base64Str, maxWidth = 400, maxHeight = 400) => {
  return new Promise((resolve, reject) => {
    if (!base64Str || typeof base64Str !== "string") {
      resolve(""); 
      return;
    }
    
    if (base64Str.length > 5 * 1024 * 1024) { 
       maxWidth = 300; maxHeight = 300; 
    }

    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = Math.round((width * maxHeight) / height);
        height = maxHeight;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      // በ 0.60 ጥራት (Quality) ወደ JPEG መቀየር
      resolve(canvas.toDataURL("image/jpeg", 0.60));
    };
    img.onerror = (e) => reject(e);
  });
};

function VerificationWizard() {
  const [step, setStep] = useState(1);
  const [faydaNumber, setFaydaNumber] = useState("");
  const [dbPensionerData, setDbPensionerData] = useState(null); 
  const [selfiePhoto, setSelfiePhoto] = useState(null); // 📸 ደረጃ 2 ላይ የተነሳው መደበኛ ንጹህ ሴልፊ ማከማቻ
  const [matchPercentage, setMatchPercentage] = useState(0); // 📊 የፊት መመሳሰል መጠን ማከማቻ
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // ደረጃ 1፡ የፋይዳ ቁጥሩን ከዳታቤዝ ጋር ማመሳሰል
  const verifyIdWithDatabase = async (scannedData) => {
    setLoading(true);
    setErrorMessage("");
    try {
      const response = await axios.get(`https://poessa-digital-services-1.onrender.com/api/pensioners/search?query=${scannedData.faydaNumber}`);
      
      if (response.data && response.data.success) {
        setFaydaNumber(scannedData.faydaNumber);
        setDbPensionerData(response.data.data); 
        setStep(2);
      } else {
        setErrorMessage("❌ ይህ የፋይዳ ቁጥር በስርዓቱ ላይ አልተመዘገበም!");
      }
    } catch (err) {
      console.error("DB Verification Error:", err);
      setErrorMessage("❌ መረጃውን ከዳታቤዝ ጋር ማመሳሰል አልተቻለም። እባክዎ ኢንተርኔት ይፈትሹ።");
    } finally {
      setLoading(false);
    }
  };

  // 🚀 የመጨረሻ ማስተካከያ፡ ደረጃ 2 ላይ የተነሳውን መደበኛ ሴልፊ እና የ AI ውጤቶችን ወደ ሰርቨር መላክ
  const handleFinalSuccess = async (livenessResults) => {
    setLoading(true);
    try {
      const exactFayda = faydaNumber || livenessResults.faydaNumber || dbPensionerData?.fayda || dbPensionerData?.faydaNumber;
      
      // 🌟 ደረጃ 2 ላይ የተነሳውን መደበኛ ንጹህ ሴልፊ (selfiePhoto) እዚህ ጋር እናሳንሰዋለን
      const compressedSelfie = selfiePhoto ? await compressImage(selfiePhoto) : "";
      
      const payload = {
        faydaNumber: exactFayda,
        idPhotoUrl: dbPensionerData?.photoUrl || dbPensionerData?.photo || "", 
        selfiePhotoUrl: compressedSelfie, // 📸 የLiveness እንቅስቃሴው ሳይሆን መደበኛው ንጹህ ሴልፊ ብቻ ይላካል!
        faceMatched: true,
        matchPercentage: matchPercentage,   // 📊 የፊት ማች ፐርሰንት ቁጥር
        smilePassed: livenessResults.smilePassed || false, 
        nodPassed: livenessResults.nodPassed || false,
        turnPassed: livenessResults.turnPassed || false
      };

      console.log(`🚀 ወደ ሰርቨር የሚላከው Payload መጠን: ${Math.round(JSON.stringify(payload).length / 1024)} KB`);

      // 🌟 [ዋና ማስተካከያ] ወደ ትክክለኛው የባዮሜትሪክስ ማስቀመጫ ማስተላለፊያ ራውት መላክ
      const response = await axios.post("https://poessa-digital-services-1.onrender.com/api/liveness/verify-success", payload);

      if (response.data && response.data.success) {
        setStep(5);
      } else {
        alert(`⚠️ ሰርቨር ምላሽ አልሰጠም፦ ${response.data?.message || "ያልታወቀ ስህተት"}`);
      }
    } catch (err) {
      console.error("Verification Save Error:", err.response?.data || err.message);
      alert(`የማረጋገጫ መረጃን ለማስቀመጥ ስህተት ተፈጥሯል፦ ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="verification-wizard-container">
      
      {errorMessage && <div className="verification-error-banner">{errorMessage}</div>}
      {loading && <div className="verification-loading-spinner">⏳ ሂደቱን በመፈጸም ላይ...</div>}

      {/* ደረጃ 1፡ መታወቂያ ማንበቢያ */}
      {step === 1 && (
        <CaptureIDCard 
          onSuccess={(data) => {
            verifyIdWithDatabase(data); 
          }} 
        />
      )}

      {/* ደረጃ 2፡ መደበኛ ንጹህ የራስ ፎቶ (Selfie) ማንሻ */}
      {step === 2 && (
        <CaptureSelfie 
          onSuccess={(image) => {
            setSelfiePhoto(image); // 📸 መደበኛው ንጹህ ሴልፊ እዚህ ላይ ይቀመጣል
            setStep(3);
          }} 
        />
      )}

      {/* ደረጃ 3፡ የፊት ባዮሜትሪክስ ማነፃፀሪያ (Face Match) */}
      {step === 3 && dbPensionerData && (
        <FaceMatch 
          idPhoto={dbPensionerData.photoUrl || dbPensionerData.photo} 
          selfiePhoto={selfiePhoto} 
          onSuccess={(percentage) => {
            setMatchPercentage(percentage); // 🌟 የፐርሰንት ውጤቱን ይቀበላል
            setStep(4);
          }} 
        />
      )}

      {/* ደረጃ 4፡ የህያውነት ፈተና (Liveness Test) */}
      {step === 4 && (
        <LivenessTest 
          faydaNumber={faydaNumber}
          matchPercentage={matchPercentage} // 🌟 ፐርሰንቱን ወደ ውስጥ ያሳልፋል
          onSuccess={(results) => handleFinalSuccess(results)} // 🛑 እዚህ ምንም አዲስ ፎቶ አይነሳም
        />
      )}

      {/* ደረጃ 5፡ ስኬት ማሳያ ገጽ */}
      {step === 5 && <VerificationSuccess pensionerData={dbPensionerData} />}
      
      {step < 5 && (
        <div className="verification-wizard-step-info">
          ደረጃ {step} ከ 5 | እባክዎ መመሪያዎችን ይከተሉ
        </div>
      )}
    </div>
  );
}

export default VerificationWizard;
