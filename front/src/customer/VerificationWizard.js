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
  const [idPhoto, setIdPhoto] = useState(null);
  const [selfiePhoto, setSelfiePhoto] = useState(null);

  // የመጨረሻውን የደህንነት ማረጋገጫ ወደ ሰርቨር መላክ
  const handleFinalSuccess = async () => {
    try {
      await axios.post("https://poessa-digital-services-1.onrender.com/api/verify-success", {
        faydaNumber,
        idPhoto,
        selfiePhoto,
        faceMatched: true,
        smilePassed: true,
        nodPassed: true,
        turnPassed: true,
        verificationStatus: "Verified"
      });
      setStep(5);
    } catch (err) {
      console.error("Verification Save Error:", err);
      alert("የማረጋገጫ መረጃን ለማስቀመጥ ስህተት ተፈጥሯል፤ እባክዎ እንደገና ይሞክሩ።");
    }
  };

  return (
    <div className="verification-wizard-container">
      {/* ደረጃ 1: መታወቂያ መቃኘት */}
      {step === 1 && (
        <CaptureIDCard 
          onSuccess={(data) => {
            setFaydaNumber(data.faydaNumber);
            setIdPhoto(data.image);
            setStep(2);
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

      {/* ደረጃ 3: የፊት ማነፃፀሪያ (Face Matching) */}
      {step === 3 && (
        <FaceMatch 
          idPhoto={idPhoto} 
          selfiePhoto={selfiePhoto} 
          onSuccess={() => setStep(4)} 
        />
      )}

      {/* ደረጃ 4: የህያውነት ፈተና (Liveness Detection) */}
      {step === 4 && (
        <LivenessTest onSuccess={handleFinalSuccess} />
      )}

      {/* ደረጃ 5: ስኬታማ ማረጋገጫ */}
      {step === 5 && <VerificationSuccess />}
      
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
