import React, { useState } from "react";
import CaptureIDCard from "./CaptureIDCard";
import CaptureSelfie from "./CaptureSelfie";
import LivenessTest from "./LivenessTest";
import FaceMatch from "./FaceMatch";

function VerificationWizard() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    faydaNumber: "",
    idPhotoUrl: "",
    selfieUrl: "",
    livenessResults: {
      smilePassed: false,
      nodPassed: false,
      turnPassed: false
    }
  });

  // Moves to next step and saves data from the previous component
  const handleStepSuccess = (data) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setStep((prev) => prev + 1);
  };

  return (
    <div style={{ maxWidth: "600px", margin: "40px auto", padding: "20px", background: "#fff", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
      {/* Progress Header */}
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <h2 style={{ color: "#162447" }}>የባዮሜትሪክ ማረጋገጫ ሂደት</h2>
        <p style={{ color: "#64748b" }}>ደረጃ {step} ከ 4</p>
      </div>

      {/* Conditional Rendering of Steps */}
      {step === 1 && (
        <CaptureIDCard 
          onSuccess={(data) => handleStepSuccess({ faydaNumber: data.faydaNumber, idPhotoUrl: data.photo })} 
        />
      )}
      
      {step === 2 && (
        <CaptureSelfie 
          onSuccess={(photo) => handleStepSuccess({ selfieUrl: photo })} 
        />
      )}
      
      {step === 3 && (
        <LivenessTest 
          faydaNumber={formData.faydaNumber} 
          onSuccess={(results) => handleStepSuccess({ livenessResults: results })} 
        />
      )}
      
      {step === 4 && (
        <FaceMatch 
          idPhoto={formData.idPhotoUrl} 
          selfiePhoto={formData.selfieUrl} 
          dbPensionerData={{ faydaNumber: formData.faydaNumber }}
          livenessResults={formData.livenessResults}
          onSuccess={(finalData) => {
            console.log("Verification Complete:", finalData);
            alert("✅ ማረጋገጫው በተሳካ ሁኔታ ተጠናቋል!");
            window.location.reload(); // Restart or redirect to success page
          }}
        />
      )}
    </div>
  );
}

export default VerificationWizard;
