import React, { useState, useRef } from 'react';
import { QrReader } from 'react-qr-reader';
import Webcam from 'react-webcam';

function CaptureID({ onComplete }) {
  const [step, setStep] = useState('SCAN');
  const [faydaNum, setFaydaNum] = useState(null);
  const webcamRef = useRef(null);

  // QR ሲቃኝ የሚከናወን
  const handleScan = (result) => {
    if (result) {
      // ከ QR የተገኘውን ቁጥር እንይዛለን
      setFaydaNum(result.text || result); 
      setStep('CAPTURE');
    }
  };

  // ፎቶ ሲነሳ የሚከናወን
  const capturePhoto = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      // ፋይዳ ቁጥር እና ፎቶውን ወደ VerificationWizard እንልካለን
      onComplete({ faydaNum, imageSrc });
    }
  };

  return (
    <div className="capture-wrapper" style={{ padding: '20px', textAlign: 'center' }}>
      {step === 'SCAN' ? (
        <div style={{ width: '100%', maxWidth: '400px', margin: 'auto' }}>
          <h3>ደረጃ 1፡ የጡረተኛውን መታወቂያ QR ይቃኙ</h3>
          <QrReader 
            onResult={(result, error) => {
              if (result) handleScan(result);
            }}
            constraints={{ facingMode: 'environment' }}
            scanDelay={500}
          />
        </div>
      ) : (
        <div>
          <h3>ደረጃ 2፡ የጡረተኛውን ፎቶ ያንሱ</h3>
          <Webcam 
            ref={webcamRef} 
            screenshotFormat="image/jpeg" 
            videoConstraints={{ facingMode: 'user' }}
            style={{ width: '100%', maxWidth: '400px', borderRadius: '10px' }}
          />
          <br />
          <button 
            onClick={capturePhoto} 
            style={{ marginTop: '20px', padding: '10px 30px', fontSize: '16px' }}
          >
            ፎቶውን አረጋግጥ
          </button>
        </div>
      )}
    </div>
  );
}

export default CaptureID;
