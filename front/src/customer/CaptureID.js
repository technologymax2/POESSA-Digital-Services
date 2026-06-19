import React, { useState, useRef } from 'react';
import { QrReader } from 'react-qr-reader';
import Webcam from 'react-webcam';

function CaptureID({ faydaNum, onComplete }) {
  const [step, setStep] = useState('SCAN');
  const webcamRef = useRef(null);

  const handleScan = async (result, error) => {
    if (result) {
      try {
        const response = await fetch(`https://poessa-digital-services-1.onrender.com/api/pensioners/validate-qr/${faydaNum}`);
        const data = await response.json();
        
        if (data.isValid) {
          setStep('CAPTURE');
        } else {
          alert("የመታወቂያው QR ኮድ ከፋይዳ ቁጥር ጋር አይዛመድም!");
        }
      } catch (err) {
        alert("ከሲስተም ጋር መገናኘት አልተቻለም፣ እንደገና ይሞክሩ።");
      }
    }
  };

  const capturePhoto = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) onComplete(imageSrc);
  };

  return (
    <div className="capture-wrapper" style={{ padding: '20px' }}>
      {step === 'SCAN' ? (
        <div style={{ width: '100%', maxWidth: '400px', margin: 'auto' }}>
          <h3>ደረጃ 1፡ የመታወቂያውን QR ይቃኙ</h3>
          <QrReader 
            onResult={handleScan}
            constraints={{ facingMode: 'environment' }} 
            scanDelay={500}
          />
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <h3>ደረጃ 2፡ የጡረተኛውን ፊት ይቅረጹ</h3>
          <Webcam 
            ref={webcamRef} 
            screenshotFormat="image/jpeg" 
            videoConstraints={{ facingMode: 'user' }} 
            style={{ width: '100%', borderRadius: '10px' }}
          />
          <button 
            onClick={capturePhoto} 
            style={{ marginTop: '20px', padding: '10px 20px' }}
          >
            ፎቶውን አረጋግጥ
          </button>
        </div>
      )}
    </div>
  );
}
export default CaptureID;
