import React, { useState } from "react";
import axios from "axios";
import "./Verification.css";

// የደረጃ ክፍሎቹን ማስገባት
import CaptureIDCard from "./CaptureIDCard";
import CaptureSelfie from "./CaptureSelfie";
import FaceMatch from "./FaceMatch";
import LivenessTest from "./LivenessTest";
import VerificationSuccess from "./VerificationSuccess";

// 🔥 ምስሎችን አሳንሶ የሚልክ ፈንክሽን
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

      resolve(canvas.toDataURL("image/jpeg", 0.65));
    };
    img.onerror = (e) => reject(e);
  });
};

function VerificationWizard() {
  const [step, setStep] = useState(1);
  const [faydaNumber, setFaydaNumber] = useState("");
  const [dbPensionerData, setDbPensionerData] = useState(null); 
  const [selfiePhoto, setSelfiePhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // ደረጃ 1፡ የፋይዳ ቁጥሩን ከዳታቤዝ ጋር ማመሳሰል
  const verifyIdWithDatabase = async (scannedData) => {
    setLoading(true);
    setErrorMessage("");
    try {
      // እዚህ ጋር የራስህን ትክክለኛ የቤክኤንድ ሊንክ አስገባ
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
      setErrorMessage("❌ መረጃውን ከዳታቤዝ ጋር ማመሳሰል አልተቻለም።");
    } finally {
      setLoading(false);
    }
  };

  // 🔥 የመጨረሻ ማረጋገጫ እና
  const handleFinalSuccess = async (livenessResults) => {
    setLoading(true);
    try {
      const exactFayda = faydaNumber || livenessResults.faydaNumber || dbPensionerData?.faydaNumber;
      const compressedSelfie = selfiePhoto ? await compressImage(selfiePhoto) : "";
      
      const payload = {
        faydaNumber: exactFayda,
        dbPhotoUrl: dbPensionerData?.photoUrl || dbPensionerData?.photo || "", 
        selfiePhoto: compressedSelfie,
        faceMatched: true,
        smilePassed: livenessResults.smilePassed || false, 
        nodPassed: livenessResults.nodPassed || false,
        turnPassed: livenessResults.turnPassed || false,
        verificationStatus: "Verified",
        verifiedAt: new Date().toISOString()
      };

      const response = await axios.post("https://poessa-digital-services-1.onrender.com/api/liveness/verify-success", payload);

      if (response.data && response.data.success) {
        setStep(5);
      } else {
        alert(`⚠️ ሰርቨር ምላሽ አልሰጠም፦ ${response.data?.message || "ያልታወቀ ስህተት"}`);
      }
    } catch (err) {
      console.error("Verification Save Error:", err);
      if (err.response?.status === 413) {
        alert("⚠️ ምስሉ በጣም ትልቅ ነው፣ ካሜራውን አርቀው እንደገና ይሞክሩ።");
      } else {
        alert(`የማረጋገጫ መረጃን ለማስቀመጥ ስህተት ተፈጥሯል`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="verification-wizard-container">
      {errorMessage && <div className="verification-error-banner">{errorMessage}</div>}
      {loading && <div className="verification-loading-spinner">⏳ ሂደቱን በመፈጸም ላይ...</div>}

      {step === 1 && <CaptureIDCard onSuccess={(data) => verifyIdWithDatabase(data)} />}
      
      {step === 2 && <CaptureSelfie onSuccess={(image) => { setSelfiePhoto(image); setStep(3); }} />}
      
      {step === 3 && dbPensionerData && (
        <FaceMatch 
          idPhoto={dbPensionerData.photoUrl || dbPensionerData.photo} 
          selfiePhoto={selfiePhoto} 
          onSuccess={() => setStep(4)} 
        />
      )}

      {step === 4 && (
        <LivenessTest 
          faydaNumber={faydaNumber}
          onSuccess={(results) => handleFinalSuccess(results)} 
        />
      )}

      {step === 5 && <VerificationSuccess pensionerData={dbPensionerData} />}
      
      {step < 5 && (
        <div className="verification-wizard-step-info">ደረጃ {step} ከ 5 | እባክዎ መመሪያዎችን ይከተሉ</div>
      )}
    </div>
  );
}

export default VerificationWizard;
