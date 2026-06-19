import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CaptureID from './CaptureID'; 
import LivenessTest from './LivenessTest'; 

function VerificationWizard() {
  const { faydaNum } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(1); 
  const [idPhoto, setIdPhoto] = useState(null); // ለFace Matching የምንጠቀምበት ምስል

  // 1. የፎቶ ቀረጻ ሲጠናቀቅ የሚጠራ
  const handleCaptureComplete = (capturedPhoto) => {
    setIdPhoto(capturedPhoto); // ምስሉን በስቴት እናስቀምጣለን
    setStep(2); // ወደ LivenessTest እንሄዳለን
  };

  // 2. የህይወት ማረጋገጫ ሲጠናቀቅ የሚጠራ
  const handleVerificationComplete = () => {
    alert("የጡረተኛው ማረጋገጫ በተሳካ ሁኔታ ተጠናቋል!");
    navigate('/customer-dashboard'); // ወደ ዳሽቦርድ መመለስ
  };

  return (
    <div className="wizard-container" style={{ padding: '20px', textAlign: 'center' }}>
      {step === 1 && (
        <div className="step-content">
          <h2>ደረጃ 1፡ የመታወቂያ ማረጋገጫ</h2>
          <CaptureID 
            faydaNum={faydaNum} 
            onComplete={handleCaptureComplete} 
          />
        </div>
      )}
      
      {step === 2 && (
        <div className="step-content">
          <h2>ደረጃ 2፡ የህይወት ማረጋገጫ (Liveness Test)</h2>
          <LivenessTest 
            faydaNumber={faydaNum} 
            idPhoto={idPhoto} 
            onSuccess={handleVerificationComplete}
          />
        </div>
      )}
    </div>
  );
}

export default VerificationWizard;
