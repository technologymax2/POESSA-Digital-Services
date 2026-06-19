import React, { useState } from "react";
import axios from "axios";
import "./Verification.css";

// እባክዎን እነዚህን ፋይሎች በፕሮጀክትዎ ውስጥ መኖራቸውን ያረጋግጡ
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

  // የመጨረሻውን መረጃ ወደ ሰርቨር የሚልክ ተግባር
  const handleFinalSuccess = async () => {
    try {
      await axios.post("https://poessa-digital-services-1.onrender.com/api/verify-success", {
        faydaNumber,
        idPhoto,
        selfiePhoto,
        faceMatched: true,
        smilePassed: true,
        nodPassed: true,
        turnPassed: true
      });
      setStep(5);
    } catch (err) {
      console.error("Verification Save Error:", err);
      alert("መረጃውን ለማስቀመጥ ተሞከረ ነገር ግን ስህተት ተፈጥሯል።");
    }
  };

  return (
    <div className="wizard-container">
      {step === 1 && (
        <CaptureIDCard onSuccess={(data) => {
          setFaydaNumber(data.faydaNumber);
          setIdPhoto(data.image);
          setStep(2);
        }} />
      )}

      {step === 2 && (
        <CaptureSelfie onSuccess={(image) => {
          setSelfiePhoto(image);
          setStep(3);
        }} />
      )}

      {step === 3 && (
        <FaceMatch 
          idPhoto={idPhoto} 
          selfiePhoto={selfiePhoto} 
          onSuccess={() => setStep(4)} 
        />
      )}

      {step === 4 && (
        <LivenessTest onSuccess={handleFinalSuccess} />
      )}

      {step === 5 && <VerificationSuccess />}
      
      {/* የሂደት ማሳያ (Progress Indicator) */}
      <div style={{ marginTop: '20px', fontSize: '12px', color: '#94a3b8' }}>
        Step {step} of 5
      </div>
    </div>
  );
}

export default VerificationWizard;
