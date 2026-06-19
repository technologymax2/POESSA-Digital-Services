import React, { useState, useRef } from "react";
import { QrReader } from "react-qr-reader";
import Webcam from "react-webcam";

function CaptureID({ onComplete }) {
  const [step, setStep] = useState("SCAN");
  const [faydaNum, setFaydaNum] = useState("");
  const [scanned, setScanned] = useState(false);

  const webcamRef = useRef(null);

  // QR Scan
  const handleScan = (result) => {
    if (result && !scanned) {
      const qrValue = result?.text || "";

      setScanned(true);
      setFaydaNum(qrValue);
      setStep("CAPTURE");
    }
  };

  // Camera Photo Capture
  const capturePhoto = () => {
    const imageSrc = webcamRef.current?.getScreenshot();

    if (!imageSrc) {
      alert("ፎቶ ማንሳት አልተሳካም!");
      return;
    }

    onComplete({
      faydaNum,
      imageSrc,
    });
  };

  return (
    <div
      className="capture-wrapper"
      style={{
        padding: "20px",
        textAlign: "center",
      }}
    >
      {step === "SCAN" && (
        <>
          <h2>ደረጃ 1፡ የጡረተኛውን QR Code ይቃኙ</h2>

          <div
            style={{
              maxWidth: "400px",
              margin: "20px auto",
            }}
          >
            <QrReader
              constraints={{
                facingMode: "environment",
              }}
              scanDelay={500}
              onResult={(result, error) => {
                if (result) {
                  handleScan(result);
                }
              }}
            />
          </div>
        </>
      )}

      {step === "CAPTURE" && (
        <>
          <h2>ደረጃ 2፡ ፎቶ ያንሱ</h2>

          <p>
            Fayda Number: <strong>{faydaNum}</strong>
          </p>

          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            videoConstraints={{
              facingMode: "user",
            }}
            style={{
              width: "100%",
              maxWidth: "400px",
              borderRadius: "15px",
              border: "3px solid #007bff",
            }}
          />

          <br />

          <button
            onClick={capturePhoto}
            style={{
              marginTop: "20px",
              padding: "12px 30px",
              fontSize: "16px",
              border: "none",
              borderRadius: "8px",
              backgroundColor: "#007bff",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            ፎቶውን አንሳ
          </button>
        </>
      )}
    </div>
  );
}

export default CaptureID;
