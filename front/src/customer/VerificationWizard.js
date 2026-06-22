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

  const [idPhotoUrl, setIdPhotoUrl] = useState("");
  const [selfieUrl, setSelfieUrl] = useState("");

  const [livenessResult, setLivenessResult] = useState(null);
  const [matchPercent, setMatchPercent] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // =========================
  // STEP 1: ID VERIFY
  // =========================
  const handleIdSuccess = async (data) => {
    setLoading(true);
    setError("");

    try {
      const res = await axios.get(
        `https://poessa-digital-services-1.onrender.com/api/pensioners/search?query=${data.faydaNumber}`
      );

      if (!res.data?.success) {
        setError("❌ Pensioner not found");
        return;
      }

      setFaydaNumber(data.faydaNumber);
      setPensionerData(res.data.data);
      setIdPhotoUrl(data.idPhotoUrl);

      setStep(2);
    } catch (err) {
      setError("❌ Server error");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // FINAL SAVE
  // =========================
  const handleFinal = async (match) => {
    setLoading(true);

    try {
      const payload = {
        faydaNumber,
        idPhotoUrl,
        selfiePhotoUrl: selfieUrl,

        faceMatchPercent: match,

        liveness: livenessResult,

        verified: match >= 50 && livenessResult?.passed
      };

      const res = await axios.post(
        "https://poessa-digital-services-1.onrender.com/api/liveness/verify-success",
        payload
      );

      if (res.data?.success) {
        setStep(5);
      } else {
        setError("❌ Save failed");
      }
    } catch (err) {
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

      {error && <div className="error">{error}</div>}

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
      {step === 4 && (
        <FaceMatch
          idPhoto={idPhotoUrl}
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
          Step {step} / 5
        </div>
      )}

    </div>
  );
}

export default VerificationWizard;
