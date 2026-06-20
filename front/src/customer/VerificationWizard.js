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
  const [dbPensionerData, setDbPensionerData] = useState(null); 
  const [selfiePhoto, setSelfiePhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // 🔥 ደረጃ 1፡ የፋይዳ ቁጥሩን ከዳታቤዝ ጋር ማመሳሰል
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

  // 🔥 ደረጃ 4፡ የመጨረሻውን የደህንነት ማረጋገጫ ወደ ሰርቨር መላክ
  const handleFinalSuccess = async (livenessResults) => {
    setLoading(true);
    try {
      // 💡 [ዋና ማስተካከያ 1] የፋይዳ ቁጥር ከስቴት ካልተገኘ ከ livenessResults ወይም ከ dbPensionerData መውሰድ (ባዶ እንዳይሆን)
      const exactFayda = faydaNumber || livenessResults.faydaNumber || dbPensionerData?.fayda || dbPensionerData?.faydaNumber;
      
      // 💡 [ዋና ማስተካከያ 2] የዳታቤዝ ፎቶ ኪይ (photoUrl ወይም photo) ሁለቱንም አማራጭ ማካተት
      const dbPhotoUrl = dbPensionerData?.photoUrl || dbPensionerData?.photo || "";

      const payload = {
        faydaNumber: exactFayda,
        dbPhotoUrl: dbPhotoUrl, 
        selfiePhoto: selfiePhoto,
        faceMatched: true,
        smilePassed: livenessResults.smilePassed || false, 
        nodPassed: livenessResults.nodPassed || false,
        turnPassed: livenessResults.turnPassed || false,
        verificationStatus: "Verified",
        verifiedAt: new Date().toISOString()
      };

      console.log("🚀 ወደ ሰርቨር የሚላከው ዳታ (Payload)፦", payload);

      const response = await axios.post("https://poessa-digital-services-1.onrender.com/api/liveness/verify-success", payload);

      if (response.data && response.data.success) {
        setStep(5);
      } else {
        // ሰርቨሩ ምላሽ ሰጥቶ ግን success ካልሆነ የመጣውን መልዕክት ማሳየት
        alert(`⚠️ ሰርቨር ምላሽ አልሰጠም፦ ${response.data?.message || "ያልታወቀ ስህተት"}`);
      }
    } catch (err) {
      console.error("Verification Save Error Details:", err.response?.data || err.message);
      alert(`የማረጋገጫ መረጃን ለማስቀመጥ ስህተት ተፈጥሯል፦ ${err.response?.data?.message || err.message}`);
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
