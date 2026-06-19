import React, { useState, useRef } from 'react';
import { QrReader } from 'react-qr-reader';
import Webcam from 'react-webcam';

function CaptureID({ onCapture }) {
  const [step, setStep] = useState('SCAN'); // SCAN -> CAPTURE
  const [faydaNumber, setFaydaNumber] = useState('');
  const webcamRef = useRef(null);

  const handleScan = async (result) => {
    if (result) {
      // ፋይዳ ቁጥርን ከQR አግኝተን ከDB ጋር እናወዳድራለን
      const response = await fetch('/api/pensioners/validate-qr', {
        method: 'POST',
        body: JSON.stringify({ faydaNumber: result.text })
      });
      if (response.ok) {
        setFaydaNumber(result.text);
        setStep('CAPTURE');
      }
    }
  };

  return (
    <div className="capture-box">
      {step === 'SCAN' ? (
        <QrReader onResult={(res) => res && handleScan(res)} />
      ) : (
        <div>
          <Webcam ref={webcamRef} />
          <button onClick={() => onCapture(webcamRef.current.getScreenshot(), faydaNumber)}>
            ካርዱን ፎቶ አንሳ
          </button>
        </div>
      )}
    </div>
  );
}
export default CaptureID;
