import React, { useState } from "react";
import axios from "axios";

import CaptureIDCard from "./CaptureIDCard";
import CaptureSelfie from "./CaptureSelfie";
import LivenessTest from "./LivenessTest";
import FaceMatch from "./FaceMatch";
import VerificationSuccess from "./VerificationSuccess";

function VerificationWizard() {
  const [step, setStep] = useState(1);

  const [faydaNumber, setFaydaNumber] = useState("");
  const [pensionerData, setPensionerData] = useState(null);

  const [selfieUrl, setSelfieUrl] = useState("");
  const [livenessResult, setLivenessResult] = useState({});
  const [matchPercent, setMatchPercent] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // STEP 1
  const handleIdSuccess = async (data) => {
    setLoading(true);
    setError("");

    try {
      const res = await axios.get(
        `https://poessa-digital-services-1.onrender.com/api/pensioners/search?query=${data.faydaNumber}`
      );

      if (!res.data.success) {
        setError("❌ Pensioner not found");
        return;
      }

      console.log("Pensioner =", res.data.data);
      console.log("Photo URL =", res.data.data.photoUrl);

      setFaydaNumber(data.faydaNumber);
      setPensionerData(res.data.data);

      setStep(2);
    } catch (err) {
      console.error(err);
      setError("❌ Server error");
    } finally {
      setLoading(false);
    }
  };

  // FINAL SAVE
  const handleFinal = async (match) => {
    setLoading(true);

    try {
const payload = {
  faydaNumber,

  // image from MongoDB
  dbPhotoUrl: pensionerData.photoUrl,

  // captured selfie
  selfiePhotoUrl: selfieUrl,

  matchPercentage: match,

  smilePassed: livenessResult.smilePassed || false,
  nodPassed: livenessResult.nodPassed || false,
  turnPassed: livenessResult.turnPassed || false
};

      const res = await axios.post(
        "https://poessa-digital-services-1.onrender.com/api/liveness/verify-success",
        payload
      );

      if (res.data.success) {
        setStep(5);
      } else {
        setError("❌ Save failed");
      }
    } catch (err) {
      console.error(err);
      setError("❌ System error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wizard-container">

      {loading && (
        <div className="overlay">
          ⏳ Processing...
        </div>
      )}

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      {/* STEP 1 */}
      {step === 1 && (
        <CaptureIDCard onSuccess={handleIdSuccess} />
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <CaptureSelfie
          onSuccess={(url) => {
            setSelfieUrl(url);
            setStep(3);
          }}
        />
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <LivenessTest
          onSuccess={(result) => {
            setLivenessResult(result);
            setStep(4);
          }}
        />
      )}

      {/* STEP 4 */}
   {step === 4 && pensionerData && (
  <FaceMatch
    registeredPhoto={pensionerData.photoUrl}
    selfiePhoto={selfieUrl}
    onSuccess={(percent) => {
      setMatchPercent(percent);
      handleFinal(percent);
    }}
  />
)}

      {/* STEP 5 */}
      {step === 5 && (
        <VerificationSuccess data={pensionerData} />
      )}

      {step < 5 && (
        <div className="step-info">
          Step {step}/5
        </div>
      )}

    </div>
  );
}

export default VerificationWizard;
