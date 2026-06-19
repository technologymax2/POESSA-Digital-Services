// VerificationWizard.js
import React, { useState } from "react";
import axios from "axios";
import './Verification.css'; // ከላይ ያለውን CSS አስገባ

function VerificationWizard() {
  const [step, setStep] = useState(1);
  const [faydaNumber, setFaydaNumber] = useState("");
  const [idPhoto, setIdPhoto] = useState(null);
  const [selfiePhoto, setSelfiePhoto] = useState(null);

  const finishVerification = async () => {
    try {
      await axios.post("https://poessa-digital-services-1.onrender.com/api/verify-success", {
        faydaNumber, idPhoto, selfiePhoto, faceMatched: true, smilePassed: true, nodPassed: true, turnPassed: true
      });
      setStep(5);
    } catch (err) { alert("የመረጃ ማስቀመጫ ስህተት ተፈጥሯል"); }
  };

  return (
    <div className="wizard-container">
      {step === 1 && <CaptureIDCard onSuccess={(data) => { setFaydaNumber(data.faydaNumber); setIdPhoto(data.image); setStep(2); }} />}
      {step === 2 && <CaptureSelfie onSuccess={(image) => { setSelfiePhoto(image); setStep(3); }} />}
      {step === 3 && <FaceMatch idPhoto={idPhoto} selfiePhoto={selfiePhoto} onSuccess={() => setStep(4)} />}
      {step === 4 && <LivenessTest onSuccess={finishVerification} />}
      {step === 5 && <VerificationSuccess />}
    </div>
  );
}
export default VerificationWizard;
