import React, { useState } from "react";
import axios from "axios";
import "./Verification.css";

// የደረጃ ክፍሎቹን ማስገባት
import CaptureIDCard from "./CaptureIDCard";
import CaptureSelfie from "./CaptureSelfie";
import FaceMatch from "./FaceMatch";
import LivenessTest from "./LivenessTest";
import VerificationSuccess from "./VerificationSuccess";

// 🔥 🔥 [አዲስ እና ዋና ማስተካከያ] ምስሎችን አሳንሶ የሚልክ ፈንክሽን
const compressImage = (base64Str, maxWidth = 400, maxHeight = 400) => {
  return new Promise((resolve, reject) => {
    if (!base64Str || typeof base64Str !== "string") {
      resolve(""); 
      return;
    }
    
    // በ Vercel ላይ ያለውን የ 413 ስህተት ለመከላከል ከመጠን በላይ ትላልቅ ዳታዎችን አስቀድሞ መለየት
    if (base64Str.length > 5 * 1024 * 1024) { // 5MB በላይ ከሆነ
       maxWidth = 300; maxHeight = 300; 
    }

    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // ተስማሚ መጠንን ማስላት
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

      // በ 0.65 ጥራት (Quality) ወደ JPEG መቀየር
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

  // 🔥 🔥 [የመጨረሻ ማስተካከያ] የመጨረሻውን የደህንነት ማረጋገጫ ምስሎችን አሳንሶ ወደ ሰርቨር መላክ
  const handleFinalSuccess = async (livenessResults) => {
    setLoading(true);
    try {
      const exactFayda = faydaNumber || livenessResults.faydaNumber || dbPensionerData?.fayda || dbPensionerData?.faydaNumber;
      
      // 💡 [ዋና ማስተካከያ] ምስሎቹን ለሰርቨር ከመላክ በፊት አሳንሶ ማዘጋጀት
      const compressedSelfie = selfiePhoto ? await compressImage(selfiePhoto) : "";
      
      const payload = {
        faydaNumber: exactFayda,
        dbPhotoUrl: dbPensionerData?.photoUrl || dbPensionerData?.photo || "", 
        selfiePhoto: compressedSelfie, // 🔥 አሁን ያነሰው ምስል ነው የሚላከው
        faceMatched: true,
        smilePassed: livenessResults.smilePassed || false, 
        nodPassed: livenessResults.nodPassed || false,
        turnPassed: livenessResults.turnPassed || false,
        verificationStatus: "Verified",
        verifiedAt: new Date().toISOString()
      };

      // ዳታው ምን ያህል እንደቀነሰ ለመፈተሽ
      console.log(`🚀 ምስሉ ከቀነሰ በኋላ Payload መጠን: ${Math.round(JSON.stringify(payload).length / 1024)} KB`);

      const response = await axios.post("https://poessa-digital-services-1.onrender.com/api/liveness/verify-success", payload);

      if (response.data && response.data.success) {
        setStep(5);
      } else {
        alert(`⚠️ ሰርቨር ምላሽ አልሰጠም፦ ${response.data?.message || "ያልታወቀ ስህተት"}`);
      }
    } catch (err) {
      console.error("Verification Save Error Details:", err.response?.data || err.message);
      
      // የ 413 ስህተትን በተለየ መልኩ ማሳየት
      if (err.response?.status === 413) {
        alert("⚠️ ስህተት 413 (Payload Too Large): ምስሎቹን ማሳነስ አልተቻለም። እባክዎ ካሜራውን አርቀው እንደገና ሞክሩ።");
      } else {
        alert(`የማረጋገጫ መረጃን ለማስቀመጥ ስህተት ተፈጥሯል፦ ${err.response?.data?.message || err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="verification-wizard-container">
      
      {errorMessage && <div className="verification-error-banner">{errorMessage}</div>}
      {loading && <div className="verification-loading-spinner">⏳ ሂደቱን በመፈጸም ላይ...</div>}

      {/* ደረጃ 1 */}
      {step === 1 && (
        <CaptureIDCard 
          onSuccess={(data) => {
            verifyIdWithDatabase(data); 
          }} 
        />
      )}

      {/* ደረጃ 2 */}
      {step === 2 && (
        <CaptureSelfie 
          onSuccess={(image) => {
            setSelfiePhoto(image);
            setStep(3);
          }} 
        />
      )}

      {/* ደረጃ 3 */}
      {step === 3 && dbPensionerData && (
        <FaceMatch 
          idPhoto={dbPensionerData.photoUrl || dbPensionerData.photo} 
          selfiePhoto={selfiePhoto} 
          onSuccess={() => setStep(4)} 
        />
      )}

      {/* ደረጃ 4 */}
      {step === 4 && (
        <LivenessTest 
          faydaNumber={faydaNumber}
          idPhoto={dbPensionerData?.photoUrl || dbPensionerData?.photo}
          selfiePhoto={selfiePhoto}
          onSuccess={(results) => handleFinalSuccess(results)} 
        />
      )}

      {/* ደረጃ 5 */}
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
