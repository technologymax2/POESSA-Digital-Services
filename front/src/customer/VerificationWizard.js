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

  // ==================================
  // STEP 1 - ID CARD OCR SUCCESS
  // ==================================
  const handleIdSuccess = async (data) => {
    try {
      setLoading(true);
      setError("");

      const fayda = data?.faydaNumber;

      if (!fayda) {
        setError("❌ Fayda number not found");
        return;
      }

      const res = await axios.get(
        `https://poessa-digital-services-1.onrender.com/api/pensioners/search?query=${fayda}`
      );

      if (!res.data?.success) {
        setError("❌ Pensioner not found");
        return;
      }

      const pensioner = res.data.data;
      console.log("PENSIONER:", pensioner);

      if (!pensioner?.photoUrl) {
        setError("❌ Registered photo not found");
        return;
      }

      setFaydaNumber(fayda);
      setPensionerData(pensioner);
      setStep(2);
    } catch (error) {
      console.error(error);
      setError("❌ Failed to fetch pensioner");
    } finally {
      setLoading(false);
    }
  };

  // ==================================
  // SAVE FINAL RESULT
  // ==================================
  const handleFinal = async (match) => {
    try {
      setLoading(true);
      setError("");

      if (!pensionerData) {
        setError("❌ Missing pensioner data");
        return;
      }

      // 🌟 [ማሻሻያ] selfieUrl ኦብጀክት ከሆነ የውስጡን ሊንክ ይወስዳል
      const finalSelfieUrl = selfieUrl?.selfieUrl || selfieUrl;

      const payload = {
        faydaNumber,
        dbPhotoUrl: pensionerData.photoUrl,
        selfiePhotoUrl: finalSelfieUrl, 
        matchPercentage: match,
        smilePassed: !!livenessResult?.smilePassed,
        nodPassed: !!livenessResult?.nodPassed,
        turnPassed: !!livenessResult?.turnPassed,
      };

      console.log("VERIFY PAYLOAD:", payload);

      const res = await axios.post(
        "https://poessa-digital-services-1.onrender.com/api/liveness/verify-success",
        payload
      );

      if (res.data?.success) {
        setStep(5);
      } else {
        setError("❌ Verification save failed");
      }
    } catch (error) {
      console.error(error);
      setError("❌ Verification error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wizard-container">
      {loading && (
        <div style={{ padding: "10px", background: "#fff3cd", marginBottom: "10px" }}>
          ⏳ Processing...
        </div>
      )}

      {error && (
        <div style={{ color: "red", marginBottom: "10px" }}>
          {error}
        </div>
      )}

      {step < 5 && (
        <div style={{ marginBottom: "15px", fontWeight: "bold" }}>
          Step {step} / 5
        </div>
      )}

      {/* STEP 1 */}
      {step === 1 && <CaptureIDCard onSuccess={handleIdSuccess} />}

      {/* STEP 2 */}
      {step === 2 && (
        <CaptureSelfie
          onSuccess={(data) => {
            console.log("SELFIE CAPTURE DATA:", data);
            // 🌟 [ዋና ማሻሻያ] የ CaptureSelfie ውጤት ኦብጀክት ስለሆነ ሙሉውን ዳታ እዚህ እናስቀምጣለን
            setSelfieUrl(data);
            setStep(3);
          }}
        />
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <LivenessTest
          onSuccess={(result) => {
            console.log("LIVENESS:", result);
            setLivenessResult(result);
            setStep(4);
          }}
        />
      )}

      {/* STEP 4 */}
      {step === 4 && pensionerData && pensionerData.photoUrl && selfieUrl && (
        <FaceMatch
          idPhoto={pensionerData.photoUrl}
          selfiePhoto={selfieUrl} // 🌟 ኦብጀክቱ ሙሉ በሙሉ ለ FaceMatch ይተላለፋል
          dbPensionerData={pensionerData} // ለደህንነት ሲባል ሙሉውን የፔንሲዮነር ዳታም እንልካለን
          onSuccess={(percent) => {
            console.log("FACE MATCH SUCCESS:", percent);
            setMatchPercent(percent);
            handleFinal(percent);
          }}
        />
      )}

      {/* STEP 5 */}
      {step === 5 && (
        <VerificationSuccess
          data={{
            ...pensionerData,
            matchPercent,
          }}
        />
      )}
    </div>
  );
}

export default VerificationWizard;
