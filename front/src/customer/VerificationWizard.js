import React, { useState } from "react";
import CaptureIDCard from "./CaptureIDCard";
import CaptureSelfie from "./CaptureSelfie";
import FaceMatch from "./FaceMatch";
import LivenessTest from "./LivenessTest";
import VerificationSuccess from "./VerificationSuccess";

function VerificationWizard() {

  const [step, setStep] = useState(1);

  const [idData, setIdData] = useState(null);
  const [selfie, setSelfie] = useState(null);

  return (
    <div>

      {step === 1 && (
        <CaptureIDCard
          onSuccess={(data) => {
            setIdData(data);
            setStep(2);
          }}
        />
      )}

      {step === 2 && (
        <CaptureSelfie
          onSuccess={(image) => {
            setSelfie(image);
            setStep(3);
          }}
        />
      )}

      {step === 3 && (
        <FaceMatch
          idPhoto={idData.image}
          selfiePhoto={selfie}
          onSuccess={() => setStep(4)}
        />
      )}

      {step === 4 && (
        <LivenessTest
          onSuccess={() => setStep(5)}
        />
      )}

      {step === 5 && (
        <VerificationSuccess />
      )}

    </div>
  );
}

export default VerificationWizard;
