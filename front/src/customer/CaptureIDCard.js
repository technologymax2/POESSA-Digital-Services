import React, { useRef, useState } from "react";
import Webcam from "react-webcam";
import "./Verification.css"; // ቅድም የፈጠርነውን CSS ተጠቀም

function CaptureIDCard({ onSuccess }) {
  const webcamRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);

  const captureImage = () => {
    // ካሜራው ከፍሬም ውጭ እንዳይሆን ማረጋገጥ
    const imageSrc = webcamRef.current.getScreenshot({
      width: 1280,
      height: 720
    });

    if (!imageSrc) {
      alert("ፎቶውን ማንሳት አልተቻለም፤ እባክዎ እንደገና ይሞክሩ።");
      return;
    }
    setCapturedImage(imageSrc);
  };

  const continueVerification = () => {
    // ለጊዜው ፋይዳ ቁጥሩን በሃርድኮድ ተይዟል፣ ወደፊት ከQR ይመጣል
    const faydaNumber = "123456789"; 
    onSuccess({
      image: capturedImage,
      faydaNumber
    });
  };

  return (
    <div className="verification-wizard-container">
      <h2>የመታወቂያ ካርድዎን ይቃኙ</h2>
      <p style={{ fontSize: '14px', color: '#64748b' }}>
        እባክዎን መታወቂያዎን በካሜራው ፍሬም ውስጥ ሙሉ በሙሉ ያስገቡ።
      </p>

      {!capturedImage ? (
        <>
          <Webcam
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{
              facingMode: "environment",
              aspectRatio: 1.586 // የኢትዮጵያ መታወቂያ ካርድ ቅርጽ (ID-1)
            }}
            className="verification-wizard-webcam"
            style={{
              width: "100%",
              maxWidth: "450px",
              aspectRatio: "1.586",
              objectFit: "cover",
              borderRadius: "15px",
              border: "3px solid #162447"
            }}
          />

          <button className="verification-wizard-btn" onClick={captureImage}>
            መታወቂያውን ይቅረጹ (Capture)
          </button>
        </>
      ) : (
        <>
          <img
            src={capturedImage}
            alt="ID Card"
            style={{
              width: "100%",
              maxWidth: "450px",
              borderRadius: "15px",
              marginTop: "15px"
            }}
          />

          <button className="verification-wizard-btn" onClick={continueVerification}>
            ወደ ቀጣዩ ደረጃ ይሂዱ
          </button>
          
          <button 
            className="verification-wizard-btn" 
            style={{ background: '#64748b' }} 
            onClick={() => setCapturedImage(null)}
          >
            እንደገና ያንሱ
          </button>
        </>
      )}
    </div>
  );
}

export default CaptureIDCard;
