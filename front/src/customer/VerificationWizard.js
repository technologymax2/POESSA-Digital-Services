import React, { useState } from "react";
import FaceMatch from "./FaceMatch";
import LivenessTest from "./LivenessTest";
import VerificationSuccess from "./VerificationSuccess";

function PensionerVerificationWizard() {
  // 1. የደረጃ መቆጣጠሪያ ስቴት (አሁን ያለህበትን ደረጃ ይይዛል)
  const [currentStep, setCurrentStep] = useState(3); // ከደረጃ 3 ጀምሮ የተመሰለ

  // 2. ከደረጃ 1 እና 2 የተገኘ የጡረተኛው ዳታ (ናሙና)
  // 🚨 በተግባር ይህ ዳታ ካንተ ዋና ስቴት ወይም ከኤፒአይ የመጣ መሆን አለበት
  const [pensionerData, setPensionerData] = useState({
    faydaNumber: "FO-987654321-AZ",
    nameAmh: "አሰፋ በቀለ ገብሬ",
    idPhotoUrl: "https://i.ibb.co/example/database-photo.jpg" // የዳታቤዝ ፎቶ
  });

  // 3. ከካሜራ የተነሳ አዲስ ሴልፊ ፎቶ ስቴት
  const [selfiePhoto, setSelfiePhoto] = useState("https://i.ibb.co/example/selfie-photo.jpg");

  /* ==========================================================================
     📬 [ዋናው የኤፒአይ መላኪያ ፈንክሽን] - ከ LivenessTest ስኬት በኋላ የሚጠራ
  ========================================================================== */
  const handleLivenessSuccess = async (livenessData) => {
    try {
      console.log("ከ Liveness Component የመጣ ዳታ፦", livenessData);

      // የፋይዳ ቁጥሩ መኖሩን በቅድሚያ ማረጋገጥ
      const currentFayda = pensionerData?.faydaNumber; 
      if (!currentFayda) {
        alert("⚠️ ስህተት፦ የጡረተኛው የፋይዳ ቁጥር አልተገኘም! እባክዎ ገጹን አድሰው ከደረጃ 1 ይጀምሩ።");
        return;
      }

      // ወደ ባክኤንድህ የሚደረግ የፖስት (POST) ጥሪ
      const response = await fetch("https://poessa-digital-services.vercel.app/api/liveness/verify-success", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          faydaNumber: currentFayda,                 // የፋይዳ ቁጥር (ለባክኤንድ መፈለጊያ)
          smilePassed: livenessData.smilePassed,     // የፈገግታ ማረጋገጫ (true)
          nodPassed: livenessData.nodPassed,         // የእንቅስቃሴ ማረጋገጫ (true)
          turnPassed: livenessData.turnPassed || true
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log("🎉 ባክኤንድ ላይ በተሳካ ሁኔታ ተቀምጧል፦", result);
        
        // 🟢 መረጃው ሲቀመጥ በቀጥታ ወደ ስኬት ገጽ (ደረጃ 5) ያሻግረዋል
        setCurrentStep(5); 
      } else {
        // ሰርቨሩ የመለሰውን ትክክለኛ የሰውኛ ስህተት መልዕክት ያሳያል
        alert(`❌ ስህተት፦ ${result.message || "መረጃውን ማስቀመጥ አልተቻለም።"}`);
      }

    } catch (error) {
      console.error("Network or Server Error:", error);
      alert("❌ የማረጋገጫ መረጃውን ለማስቀመጥ የኔትወርክ ወይም የሰርቨር ስህተት አጋጥሟል። እባክዎ እንደገና ይሞክሩ።");
    }
  };

  /* ==========================================================================
     🔄 የእያንዳንዱ ደረጃ ማሳያ መቆጣጠሪያ (Render Step)
  ========================================================================== */
  const renderStep = () => {
    switch (currentStep) {
      case 3:
        return (
          <FaceMatch
            idPhoto={pensionerData.idPhotoUrl}
            selfiePhoto={selfiePhoto}
            onSuccess={() => setCurrentStep(4)} // የፊት ማመሳሰሉ ካለፈ ወደ ደረጃ 4 ይወስዳል
          />
        );

      case 4:
        return (
          <LivenessTest
            faydaNumber={pensionerData.faydaNumber}
            onSuccess={handleLivenessSuccess} // 🔥 ስራውን ሲጨርስ የላይኛውን የኤፒአይ ፈንክሽን ይጠራል
          />
        );

      case 5:
        return (
          <VerificationSuccess 
            pensionerData={pensionerData} 
          />
        );

      default:
        return <div>ያልታወቀ ደረጃ</div>;
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f1f5f9", padding: "40px 10px" }}>
      {/* የሲስተሙ ዋና ራስጌ ሰሌዳ */}
      <div style={{ textAlign: "center", marginBottom: "30px", fontFamily: "sans-serif" }}>
        <h1 style={{ color: "#162447", fontSize: "24px", margin: "0" }}>የብሔራዊ ጡረተኞች ማረጋገጫ ዊዛርድ</h1>
        <p style={{ color: "#64748b", fontSize: "14px", marginTop: "5px" }}>POESSA Digital Biometric Verification System</p>
      </div>

      {/* የደረጃ ማሳያ ካርድ ሳጥን */}
      <div style={{ background: "#fff", borderRadius: "16px", boxShadow: "0 10px 25px rgba(0,0,0,0.05)", padding: "10px", maxWidth: "480px", margin: "0 auto" }}>
        {renderStep()}
      </div>
    </div>
  );
}

export default PensionerVerificationWizard;
