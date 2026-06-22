import React, { useState } from "react";
import axios from "axios";
import "./Verification.css";

import CaptureIDCard from "./CaptureIDCard";
import CaptureSelfie from "./CaptureSelfie";
import FaceMatch from "./FaceMatch";
import LivenessTest from "./LivenessTest";
import VerificationSuccess from "./VerificationSuccess";

function VerificationWizard() {
  const [step, setStep] = useState(1);

  const [faydaNumber, setFaydaNumber] = useState("");
  const [dbPensionerData, setDbPensionerData] = useState(null);

  const [selfiePhoto, setSelfiePhoto] = useState("");
  const [matchPercentage, setMatchPercentage] = useState(0);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // ===========================
  // STEP 1: VERIFY ID
  // ===========================
  const verifyIdWithDatabase = async (scannedData) => {
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await axios.get(
        `https://poessa-digital-services-1.onrender.com/api/pensioners/search?query=${scannedData.faydaNumber}`
      );

      if (response.data?.success) {
        setFaydaNumber(scannedData.faydaNumber);
        setDbPensionerData(response.data.data);
        setStep(2);
      } else {
        setErrorMessage("❌ ይህ የፋይዳ ቁጥር አልተገኘም!");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("❌ መረጃ ከዳታቤዝ ጋር አልተገናኘም");
    } finally {
      setLoading(false);
    }
  };

  // ===========================
  // FINAL SAVE
  // ===========================
  const handleFinalSuccess = async (livenessResults) => {
    setLoading(true);
    setErrorMessage("");

    try {
      const exactFayda =
        faydaNumber ||
        dbPensionerData?.faydaNumber ||
        dbPensionerData?.fayda;

      const payload = {
        faydaNumber: exactFayda,

        idPhotoUrl:
          dbPensionerData?.photoUrl ||
          dbPensionerData?.photo ||
          "",

        selfiePhotoUrl: selfiePhoto,

        matchPercentage: matchPercentage,

        // ✅ FIXED LOGIC
        faceMatched: matchPercentage >= 50,

        smilePassed: livenessResults.smilePassed || false,
        nodPassed: livenessResults.nodPassed || false,
        turnPassed: livenessResults.turnPassed || false
      };

      console.log("FINAL PAYLOAD:", payload);

      const response = await axios.post(
        "https://poessa-digital-services-1.onrender.com/api/liveness/verify-success",
        payload
      );

      if (response.data?.success) {
        setStep(5);
      } else {
        setErrorMessage(response.data?.message || "❌ ማስቀመጥ አልተቻለም");
      }
    } catch (err) {
      console.error("SAVE ERROR:", err.response?.data || err.message);
      setErrorMessage("❌ System error occurred");
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="verification-wizard-container">

      {/* LOADING OVERLAY */}
      {loading && (
        <div className="overlay-loading">
          ⏳ Processing...
        </div>
      )}

      {/* ERROR */}
      {errorMessage && (
        <div className="verification-error-banner">
          {errorMessage}
        </div>
      )}

      {/* STEP 1 */}
      {step === 1 && (
        <CaptureIDCard
          onSuccess={(data) => verifyIdWithDatabase(data)}
        />
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <CaptureSelfie
          onSuccess={(imageUrl) => {
            setSelfiePhoto(imageUrl);
            setStep(3);
          }}
        />
      )}

      {/* STEP 3 */}
      {step === 3 && dbPensionerData && (
        <FaceMatch
          idPhoto={
            dbPensionerData?.photoUrl ||
            dbPensionerData?.photo
          }
          selfiePhoto={selfiePhoto}
          onSuccess={(similarity) => {
            setMatchPercentage(similarity);
            setStep(4);
          }}
        />
      )}

      {/* STEP 4 */}
      {step === 4 && (
        <LivenessTest
          faydaNumber={faydaNumber}
          onSuccess={handleFinalSuccess}
        />
      )}

      {/* STEP 5 */}
      {step === 5 && (
        <VerificationSuccess
          pensionerData={dbPensionerData}
        />
      )}

      {/* STEP INFO */}
      {step < 5 && (
        <div className="verification-wizard-step-info">
          ደረጃ {step} ከ 5
        </div>
      )}

    </div>
  );
}

export default VerificationWizard;
