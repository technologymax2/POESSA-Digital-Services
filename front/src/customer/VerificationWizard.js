import React, { useState } from 'react';
import CaptureID from './CaptureID'; 
import LivenessTest from './LivenessTest'; 

function VerificationWizard() {
  const [step, setStep] = useState(1); 
  const [faydaNum, setFaydaNum] = useState(null); 
  const [idPhoto, setIdPhoto] = useState(null);

  // 1. QR ከ CaptureID ሲገኝ ፋይዳ ቁጥሩን እና ምስሉን ይይዛል
  const handleCaptureComplete = (data) => {
    setFaydaNum(data.faydaNum);
    setIdPhoto(data.imageSrc);
    setStep(2); // ቀጥታ ወደ LivenessTest ይቀይራል
  };

  return (
    <div className="wizard-container" style={{ padding: '20px', textAlign: 'center' }}>
      
      {/* ደረጃ 1፡ QR መቃኘት እና ፎቶ ማንሳት */}
      {step === 1 && (
        <div className="step-content">
          <h2>መታወቂያ እና ፎቶ ማረጋገጫ</h2>
          <CaptureID onComplete={handleCaptureComplete} />
        </div>
      )}

      {/* ደረጃ 2፡ የህይወት ማረጋገጫ */}
      {step === 2 && (
        <div className="step-content">
          <h2>የህይወት ማረጋገጫ (Liveness Test)</h2>
          <LivenessTest 
            faydaNumber={faydaNum} 
            idPhoto={idPhoto} 
          />
        </div>
      )}
    </div>
  );
}

export default VerificationWizard;
