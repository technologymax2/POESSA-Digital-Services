import React, { useState } from "react";
import axios from "axios";
import "./Verification.css";

import CaptureIDCard from "./CaptureIDCard";
import CaptureSelfie from "./CaptureSelfie";
import FaceMatch from "./FaceMatch";
import LivenessTest from "./LivenessTest";
import VerificationSuccess from "./VerificationSuccess";

// 📸 ምስል አሳንሶ ጥራት ሳይቀንስ የሚልክ ፋንክሽን
const compressImage = (base64Str, maxWidth = 400, maxHeight = 400) => {
  return new Promise((resolve) => {
    if (!base64Str) return resolve("");
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      let width = img.width, height = img.height;
      if (width > maxWidth) { height = Math.round((height * maxWidth) / width); width = maxWidth; }
      if (height > maxHeight) { width = Math.round((width * maxHeight) / height); height = maxHeight; }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.60));
    };
  });
};

function VerificationWizard() {
  const [step, setStep] = useState(1);
  const [faydaNumber, setFaydaNumber] = useState("");
  const [dbPensionerData, setDbPensionerData] = useState(null);
  const [idCardPhoto, setIdCardPhoto] = useState(null);
  const [selfiePhoto, setSelfiePhoto] = useState(null);
  const [matchPercentage, setMatchPercentage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const verifyIdWithDatabase = async (scannedData) => {
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await axios.get(`https://poessa-digital-services-1.onrender.com/api/pensioners/search?query=${scannedData.faydaNumber}`);
      if (res.data?.success) {
        setFaydaNumber(scannedData.faydaNumber);
        setIdCardPhoto(scannedData.idPhotoUrl);
        setDbPensionerData(res.data.data);
        setStep(2);
      } else {
        setErrorMessage("❌ ይህ የፋይዳ ቁጥር በሲስተሙ አልተገኘም!");
      }
    } catch (err) {
      setErrorMessage("⚠️ ሰርቨር መገናኘት አልተቻለም።");
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSuccess = async (livenessResults) => {
    setLoading(true);
    try {
      const compressedSelfie = await compressImage(selfiePhoto);
      
      const payload = {
        faydaNumber: faydaNumber,
        idPhotoUrl: idCardPhoto || dbPensionerData?.photoUrl,
        selfiePhotoUrl: compressedSelfie,
        matchPercentage: matchPercentage,
        faceMatched: matchPercentage > 50, // 💡 የ 50% መስፈርት
        smilePassed: livenessResults.smilePassed || false,
        nodPassed: livenessResults.nodPassed || false,
        turnPassed: livenessResults.turnPassed || false
      };

      await axios.post("https://poessa-digital-services-1.onrender.com/api/liveness/verify-success", payload);
      setStep(5);
    } catch (err) {
      console.error(err);
      alert("⚠️ መረጃውን ማስቀመጥ አልተቻለም። እባክዎ እንደገና ይሞክሩ።");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="verification-wizard-container">
      {loading && <div className="verification-loading-spinner">⏳ በመስራት ላይ...</div>}
      {errorMessage && <div className="verification-error-banner">{errorMessage}</div>}

      {step === 1 && <CaptureIDCard onSuccess={verifyIdWithDatabase} />}
      {step === 2 && <CaptureSelfie onSuccess={(img) => { setSelfiePhoto(img); setStep(3); }} />}
      {step === 3 && dbPensionerData && (
        <FaceMatch 
          idPhoto={dbPensionerData.photoUrl || dbPensionerData.photo}
          selfiePhoto={selfiePhoto} 
          onSuccess={(p) => { setMatchPercentage(p); setStep(4); }} 
        />
      )}
      {step === 4 && (
        <LivenessTest 
          faydaNumber={faydaNumber}
          matchPercentage={matchPercentage}
          onSuccess={handleFinalSuccess} 
        />
      )}
      {step === 5 && <VerificationSuccess pensionerData={dbPensionerData} />}
    </div>
  );
}

export default VerificationWizard;
