import React, { useRef } from "react";
import Webcam from "react-webcam";

function CaptureSelfie({ onSuccess }) {

  const webcamRef = useRef(null);

  const capture = () => {

    const image = webcamRef.current.getScreenshot();

    if (!image) return;

    onSuccess(image);
  };

  return (
    <div>

      <h2>እባክዎን ፎቶ ያንሱ</h2>

      <Webcam
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        videoConstraints={{
          facingMode: "user"
        }}
      />

      <button onClick={capture}>
        Capture Selfie
      </button>

    </div>
  );
}

export default CaptureSelfie;
