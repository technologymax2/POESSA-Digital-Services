import React, { useState, useRef } from 'react';
import { QrReader } from 'react-qr-reader';
import Webcam from 'react-webcam';

function CaptureID({ faydaNum, onComplete }) {
  const [step, setStep] = useState('SCAN'); // SCAN -> CAPTURE
  const [isVerified, setIsVerified] = useState(false);
  const webcamRef = useRef(null);

  const handleScan = async (result) => {
    if (result) {
      // ከ Backend ጋር መዛመዱን ማረጋገጥ
      const response = await fetch(`https://poessa-digital-services-1.onrender.com/api/pensioners/validate-qr/${faydaNum}`);
      const data = await response.json();
      
      if (data.isValid) {
        setIsVerified(true);
        setStep('CAPTURE');
      } else {
        alert("የመታወቂያው QR ኮድ ከፋይዳ ቁጥር ጋር አይዛመድም!");
      }
    }
  };

  const capturePhoto = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    // ምስሉን ወደ Backend ለFace Matching መላክ
    onComplete(imageSrc); 
  };

  return (
    <div className="capture-wrapper">
      {step === 'SCAN' ? (
        <>
          <h3>ደረጃ 1፡ የመታወቂያውን QR ይቃኙ</h3>
          <QrReader onResult={(res) => res && handleScan(res)} />
        </>
      ) : (
        <>
          <h3>ደረጃ 2፡ የጡረተኛውን ፎቶ ያንሱ</h3>
          <Webcam ref={webcamRef} screenshotFormat="image/jpeg" />
          <button onClick={capturePhoto}>ፎቶውን አረጋግጥ</button>
        </>
      )}
    </div>
  );
}
export default CaptureID;
