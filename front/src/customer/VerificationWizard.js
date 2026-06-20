import React, { useState } from "react";
import axios from "axios";
import "./Verification.css";

// የደረጃ ክፍሎቹን ማስገባት
import CaptureIDCard from "./CaptureIDCard";
import CaptureSelfie from "./CaptureSelfie";
import FaceMatch from "./FaceMatch";
import LivenessTest from "./LivenessTest";
import VerificationSuccess from "./VerificationSuccess";

function VerificationWizard() {
  const [step, setStep] = useState(1);
  const [faydaNumber, setFaydaNumber] = useState("");
  const [dbPensionerData, setDbPensionerData] = useState(null); // 🔥 አዲስ፡ ከዳታቤዝ የመጣ የጡረተኛ መረጃ
  const [selfiePhoto, setSelfiePhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // 🔥 ደረጃ 1፡ የፋይዳ ቁጥሩን ከዳታቤዝ ጋር በባክኤንድ ማረጋገጫ ፈንክሽን
  const verifyIdWithDatabase = async (scannedData) => {
    setLoading(true);
    setErrorMessage("");
    try {
      // 1. መጀመሪያ ይህ የፋይዳ ቁጥር በሲስተሙ ላይ መኖሩን ከሰርቨር መፈለግ
      const response = await axios.get(`https://poessa-digital-services-1.onrender.com/api/pensioners/search?query=${scannedData.faydaNumber}`);
      
      if (response.data && response.data.success) {
        // 2. መረጃው ከተገኘ የዳታቤዙን መረጃ አስቀምጥና ወደ ደረጃ 2 እለፍ
        setFaydaNumber(scannedData.faydaNumber);
        setDbPensionerData(response.data.data); // የዳታቤዝ መረጃ (ፎቶውን ጨምሮ)
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

  // 🔥 ደረጃ 4፡ የህያውነት ፈተናው ሲያልፍ የመጨረሻውን የደህንነት ማረጋገጫ ወደ ሰርቨር መላክ
  const handleFinalSuccess = async (livenessResults) => {
    setLoading(true);
    try {
      // ከ LivenessTest የመጡትን ትክክለኛ የፈገግታና የእንቅስቃሴ ውጤቶች ለሰርቨር መላክ
      const response = await axios.post("https://poessa-digital-services-1.onrender.com/api/liveness/verify-success", {
        faydaNumber,
        dbPhotoUrl: dbPensionerData.photoUrl, // ከዳታቤዝ የነበረው ፎቶ ዩአርኤል
        selfiePhoto,
        faceMatched: true,
        smilePassed: livenessResults.smilePassed || false, // በእጅ True የተደረገው ተቀይሯል
        nodPassed: livenessResults.nodPassed || false,
        turnPassed: livenessResults.turnPassed || false,
        verificationStatus: "Verified",
        verifiedAt: new Date().toISOString()
      });

      if (response.data.success) {
        setStep(5);
      }
    } catch (err) {
      console.error("Verification Save Error:", err);
      alert("የማረጋገጫ መረጃን ለማስቀመጥ ስህተት ተፈጥሯል፤ እባክዎ እንደገና ይሞክሩ።");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="verification-wizard-container">
      
      {/* የስህተት መልእክት ማሳያ */}
      {errorMessage && <div className="verification-error-banner">{errorMessage}</div>}
      {loading && <div className="verification-loading-spinner">⏳ ሂደቱን በመፈጸም ላይ...</div>}

      {/* ደረጃ 1: መታወቂያ መቃኘት እና ወዲያውኑ ከDB ጋር ማመሳሰል */}
      {step === 1 && (
        <CaptureIDCard 
          onSuccess={(data) => {
            verifyIdWithDatabase(data); // 🔥 እዚህ ጋር ነው መጀመሪያ DB ቼክ የሚደረገው
          }} 
        />
      )}

      {/* ደረጃ 2: የራስ ፎቶ (Selfie) ማንሳት */}
      {step === 2 && (
        <CaptureSelfie 
          onSuccess={(image) => {
            setSelfiePhoto(image);
            setStep(3);
          }} 
        />
      )}

      {/* ደረጃ 3: የፊት ማነፃፀሪያ (Face Matching) - ከዳታቤዝ ፎቶ ጋር ነው የሚነጻጸረው */}
      {step === 3 && dbPensionerData && (
        <FaceMatch 
          idPhoto={dbPensionerData.photoUrl} // 🔥 ከመታወቂያው ፎቶ ይልቅ የዳታቤዙን ዋና ፎቶ አስተላልፈናል
          selfiePhoto={selfiePhoto} 
          onSuccess={() => setStep(4)} 
        />
      )}

      {/* ደረጃ 4: የህያውነት ፈተና (Liveness Detection) */}
      {step === 4 && (
        <LivenessTest 
          faydaNumber={faydaNumber}
          idPhoto={dbPensionerData?.photoUrl}
          selfiePhoto={selfiePhoto}
          onSuccess={(results) => handleFinalSuccess(results)} // የፈተናውን ውጤት ይዞ ይሄዳል
        />
      )}

      {/* ደረጃ 5: ስኬታማ ማረጋገጫ እና ከተረጋገጡት ጋር መመደብ */}
      {step === 5 && <VerificationSuccess pensionerData={dbPensionerData} />}
      
      {/* የሂደት ማሳያ (Progress Indicator) */}
      {step < 5 && (
        <div className="verification-wizard-step-info">
          ደረጃ {step} ከ 5 | እባክዎ መመሪያዎችን ይከተሉ
        </div>
      )}
    </div>
  );
}

export default VerificationWizard;
