import React, { useRef, useState } from "react";
import Webcam from "react-webcam";

function CaptureSelfie({ onSuccess }) {

  const webcamRef = useRef(null);

  const [selfie, setSelfie] = useState(null);

  const captureSelfie = () => {

    const imageSrc = webcamRef.current.getScreenshot();

    if (!imageSrc) {
      alert("Unable to capture image");
      return;
    }

    setSelfie(imageSrc);

  };

  return (

    <div style={{ textAlign: "center" }}>

      <h2>እባክዎን የእርስዎን ፎቶ ያንሱ</h2>

      {!selfie ? (
        <>
          <Webcam
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{
              facingMode: "user"
            }}
            style={{
              width: "450px",
              borderRadius: "15px"
            }}
          />

          <br /><br />

          <button onClick={captureSelfie}>
            Capture Selfie
          </button>
        </>
      ) : (
        <>
          <img
            src={selfie}
            alt="Selfie"
            width="450"
            style={{
              borderRadius: "15px"
            }}
          />

          <br /><br />

          <button
            onClick={() => onSuccess(selfie)}
          >
            Continue
          </button>
        </>
      )}

    </div>

  );

}

export default CaptureSelfie;
