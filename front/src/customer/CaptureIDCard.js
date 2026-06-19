import React, { useRef, useState } from "react";
import Webcam from "react-webcam";
import "./Verification.css"; // ቀደም ሲል የፈጠርነውን CSS ተጠቀም

function CaptureIDCard({ onSuccess }) {
  const webcamRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);

  const captureImage = () => {
    // ፎቶው ከፍሬም ውጭ እንዳይሆን እና እንዳይሻፋ ለማድረግ
    const imageSrc = webcamRef.current.getScreenshot();

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
      <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '15px' }}>
        እባክዎን መታወቂያዎን በካሜራው ፍሬም ውስጥ ሙሉ በሙሉ ያስገቡ።
      </p>

      {!capturedImage ? (
        <div style={{ position: 'relative', width: '100%', maxWidth: '450px', margin: '0 auto' }}>
          <Webcam
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            // የካሜራውን ጥራት እና መጠን ለመቆጣጠር
            videoConstraints={{
              facingMode: "environment", // የጀርባ ካሜራ
              aspectRatio: 1.586 // የኢትዮጵያ መታወቂያ ካርድ ቅርጽ (ID-1)
            }}
            className="verification-wizard-webcam"
            style={{
              width: "100%",
              aspectRatio: "1.586", // የካርድ ቅርጽ
              objectFit: "cover", // ምስሉ እንዳይሻፋ ለመከላከል ዋናው ቁልፍ
              borderRadius: "15px",
              border: "3px solid #162447"
            }}
          />
          {/* ተጠቃሚው መታወቂያውን የት እንደሚያደርግ የሚያሳይ ክፈፍ */}
          <div style={{
            position: 'absolute',
            top: '5%',
            left: '5%',
            right: '5%',
            bottom: '5%',
            border: '2px dashed #4ade80',
            borderRadius: '10px',
            pointerEvents: 'none'
          }} />
        </div>
      ) : (
        <>
          <img
            src={capturedImage}
            alt="ID Card"
            style={{
              width: "100%",
              maxWidth: "450px",
              aspectRatio: "1.586",
              objectFit: "cover",
              borderRadius: "15px",
              border: "3px solid #162447",
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

      {!capturedImage && (
        <button className="verification-wizard-btn" onClick={captureImage}>
          መታወቂያውን ይቅረጹ (Capture)
        </button>
      )}
    </div>
  );
}

export default CaptureIDCard;
