import React, { useRef, useState } from "react";
import Webcam from "react-webcam";

function CaptureIDCard({ onSuccess }) {

  const webcamRef = useRef(null);

  const [capturedImage, setCapturedImage] = useState(null);

  const captureImage = () => {

    const imageSrc = webcamRef.current.getScreenshot();

    if (!imageSrc) {
      alert("Unable to capture image");
      return;
    }

    setCapturedImage(imageSrc);
  };

  const continueVerification = () => {

    // ለጊዜው QR Scan እስኪጨመር
    const faydaNumber = "123456789";

    onSuccess({
      image: capturedImage,
      faydaNumber
    });

  };

  return (
    <div style={{ textAlign: "center" }}>

      <h2>የዲጂታል መታወቂያዎን ፎቶ ያንሱ</h2>

      {!capturedImage ? (
        <>
          <Webcam
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{
              facingMode: "environment"
            }}
            style={{
              width: "450px",
              borderRadius: "15px"
            }}
          />

          <br />

          <button onClick={captureImage}>
            Capture ID Card
          </button>
        </>
      ) : (
        <>
          <img
            src={capturedImage}
            alt="ID Card"
            width="450"
          />

          <br /><br />

          <button onClick={continueVerification}>
            Continue
          </button>
        </>
      )}

    </div>
  );
}

export default CaptureIDCard;
