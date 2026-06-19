import React, { useRef, useState } from "react";
import Webcam from "react-webcam";
import "./Verification.css";

function CaptureSelfie({ onSuccess }) {
  const webcamRef = useRef(null);
  const [selfie, setSelfie] = useState(null);

  const captureSelfie = () => {
    const imageSrc = webcamRef.current.getScreenshot({
      width: 400,
      height: 400
    });
    if (!imageSrc) {
      alert("ፎቶውን ማንሳት አልተቻለም");
      return;
    }
    setSelfie(imageSrc);
  };

  return (
    <div className="verification-wizard-container">
      <h2>የራስዎን ፎቶ (Selfie) ያንሱ</h2>
      <p className="verification-wizard-status">እባክዎን ፊትዎን በክፈፉ መሃል ያድርጉ</p>

      {!selfie ? (
        <>
          <Webcam
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{
              facingMode: "user",
              aspectRatio: 1 // የሰልፊ ፎቶ አደራረግ ለፊት እንዲመች
            }}
            className="verification-wizard-webcam"
            style={{
              width: "100%",
              maxWidth: "350px",
              aspectRatio: "1/1",
              objectFit: "cover",
              borderRadius: "50%", // ክብ ቅርጽ ለሰልፊ
              border: "4px solid #162447"
            }}
          />

          <button className="verification-wizard-btn" onClick={captureSelfie}>
            Selfie ያንሱ
          </button>
        </>
      ) : (
        <>
          <img
            src={selfie}
            alt="Selfie"
            style={{
              width: "100%",
              maxWidth: "350px",
              aspectRatio: "1/1",
              objectFit: "cover",
              borderRadius: "50%",
              border: "4px solid #162447",
              marginTop: "15px"
            }}
          />

          <button className="verification-wizard-btn" onClick={() => onSuccess(selfie)}>
            ወደ ቀጣዩ ደረጃ ይሂዱ
          </button>
          
          <button 
            className="verification-wizard-btn" 
            style={{ background: '#64748b' }} 
            onClick={() => setSelfie(null)}
          >
            እንደገና ያንሱ
          </button>
        </>
      )}
    </div>
  );
}

export default CaptureSelfie;
