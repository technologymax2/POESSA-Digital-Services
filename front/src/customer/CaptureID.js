import React, { useState, useRef, useEffect } from "react";
import { QrReader } from "react-qr-reader";
import Webcam from "react-webcam";

function CaptureID({ onComplete }) {
  const [step, setStep] = useState("SCAN");
  const [faydaNum, setFaydaNum] = useState("");
  const [cameraReady, setCameraReady] = useState(false);

  const webcamRef = useRef(null);

  // Camera permission request
  useEffect(() => {
    const requestCamera = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({
          video: true,
        });

        setCameraReady(true);
      } catch (err) {
        console.log(err);
        alert("Camera permission denied!");
      }
    };

    requestCamera();
  }, []);

  // QR scan
  const handleScan = (result) => {
    if (result && step === "SCAN") {
      setFaydaNum(result.text);
      setStep("CAPTURE");
    }
  };

  // Capture ID card image
  const capturePhoto = () => {
    const imageSrc = webcamRef.current?.getScreenshot();

    if (!imageSrc) {
      alert("Failed to capture image");
      return;
    }

    onComplete({
      faydaNum,
      imageSrc,
    });
  };

  if (!cameraReady) {
    return <h2>Requesting camera permission...</h2>;
  }

  return (
    <div style={{ textAlign: "center" }}>
      {step === "SCAN" && (
        <>
          <h2>Step 1: Scan QR Code</h2>

          <div style={{ width: 400, margin: "auto" }}>
            <QrReader
              constraints={{
                facingMode: "environment",
              }}
              onResult={(result) => {
                if (result) handleScan(result);
              }}
            />
          </div>
        </>
      )}

      {step === "CAPTURE" && (
        <>
          <h2>Step 2: Capture ID Card</h2>

          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            videoConstraints={{
              facingMode: "environment"
            }}
            style={{
              width: 500,
              borderRadius: 10
            }}
          />

          <br />

          <button
            onClick={capturePhoto}
            style={{
              marginTop: 20,
              padding: "10px 30px"
            }}
          >
            Capture ID Card
          </button>
        </>
      )}
    </div>
  );
}

export default CaptureID;
