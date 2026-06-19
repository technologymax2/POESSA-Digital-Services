import React, { useState } from 'react';
import CaptureID from './CaptureID'; 
import LivenessTest from './LivenessTest'; 
import { QrReader } from 'react-qr-reader';

function VerificationWizard() {
  const [step, setStep] = useState(1); 
  const [faydaNum, setFaydaNum] = useState(null); 
  const [idPhoto, setIdPhoto] = useState(null);

  // 1. QR ሲቃኝ የሚከናወን (ፋይዳ ቁጥርን ከQR ያወጣል)
  const handleScan = (result) => {
    if (result) {
      setFaydaNum(result?.text); // ከQR ኮድ የተገኘው መረጃ
      setStep(2); // ቀጥታ ወደ ፎቶ ማንሻ
    }
  };

  // 2. ፎቶ ሲነሳ የሚከናወን
  const handleCaptureComplete = (photo) => {
    setIdPhoto(photo);
    setStep(3); // ቀጥታ ወደ Liveness Test
  };

  return (
    <div className="wizard-container" style={{ padding: '20px', textAlign: 'center' }}>
      
      {/* ደረጃ 1፡ QR መቃኘት */}
      {step === 1 && (
        <div>
          <h3>ደረጃ 1፡ የጡረተኛውን መታወቂያ QR ይቃኙ</h3>
          <QrReader onResult={handleScan} constraints={{ facingMode: 'environment' }} />
        </div>
      )}

      {/* ደረጃ 2፡ ፎቶ ማንሳት */}
      {step === 2 && (
        <CaptureID 
          faydaNum={faydaNum} 
          onComplete={handleCaptureComplete} 
        />
      )}

      {/* ደረጃ 3፡ የህይወት ማረጋገጫ */}
      {step === 3 && (
        <LivenessTest 
          faydaNumber={faydaNum} 
          idPhoto={idPhoto} 
        />
      )}
    </div>
  );
}

export default VerificationWizard;
