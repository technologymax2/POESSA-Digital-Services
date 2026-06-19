import React, { useState } from "react";

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

  return (
    <div>

      {/* STEP 1 */}
      {step === 1 && (
        <CaptureIDCard
          onSuccess={(data) => {
            setFaydaNumber(data.faydaNumber);
            setIdPhoto(data.image);
            setStep(2);
          }}
        />
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <CaptureSelfie
          onSuccess={(image) => {
            setSelfiePhoto(image);
            setStep(3);
          }}
        />
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <FaceMatch
          idPhoto={idPhoto}
          selfiePhoto={selfiePhoto}
          onSuccess={() => setStep(4)}
        />
      )}

      {/* STEP 4 */}
      {step === 4 && (
        <LivenessTest
          faydaNumber={faydaNumber}
          idPhoto={idPhoto}
          selfiePhoto={selfiePhoto}
          onSuccess={() => setStep(5)}
        />
      )}

      {/* STEP 5 */}
      {step === 5 && (
        <VerificationSuccess />
      )}

    </div>
  );
}

export default VerificationWizard;
