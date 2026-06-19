import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import CaptureID from './CaptureID'; // የካርድ ፎቶ ማንሻ
import LivenessTest from './LivenessTest'; // የህይወት ማረጋገጫ

function VerificationWizard() {
  const { faydaNum } = useParams();
  const [step, setStep] = useState(1); // 1: Capture ID, 2: Liveness

  return (
    <div className="wizard-container">
      {step === 1 && (
        <CaptureID 
          faydaNum={faydaNum} 
          onComplete={() => setStep(2)} 
        />
      )}
      {step === 2 && (
        <LivenessTest faydaNumber={faydaNum} />
      )}
    </div>
  );
}

export default VerificationWizard;
