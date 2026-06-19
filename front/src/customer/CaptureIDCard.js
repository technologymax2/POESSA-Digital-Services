import React, { useRef } from "react";
import Webcam from "react-webcam";
import jsQR from "jsqr";

function CaptureIDCard({ onSuccess }) {

  const webcamRef = useRef(null);

  const capture = () => {

    const image = webcamRef.current.getScreenshot();

    if (!image) {
      alert("Image not captured");
      return;
    }

    // በኋላ QR scan እና database verification
    const faydaNumber = "123456789";

    onSuccess({
      image,
      faydaNumber
    });

  };

  return (
    <div>

      <h2>የዲጂታል መታወቂያዎን ፎቶ ያንሱ</h2>

      <Webcam
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        videoConstraints={{
          facingMode: "environment"
        }}
      />

      <button onClick={capture}>
        Capture ID Card
      </button>

    </div>
  );
}

export default CaptureIDCard;
