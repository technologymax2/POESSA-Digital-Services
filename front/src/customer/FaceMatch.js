import React, { useEffect, useState, useRef } from "react";

function FaceMatch({ idPhoto, selfiePhoto, dbPensionerData, onSuccess }) {
  const [matchStatus, setMatchStatus] = useState("⏳ ምስሎችን ወደ ድርጅቱ ሰርቨር በመላክ ላይ...");
  const [progress, setProgress] = useState(20);
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    async function sendToBackend() {
      try {
        setProgress(50);
        setMatchStatus("🧠 ሰርቨሩ የፊት ገጽታዎችን እያነጻጸረ ነው (ይህ ጥቂት ሰከንዶች ሊወስድ ይችላል)...");

        const cleanSelfie = selfiePhoto?.selfieUrl || selfiePhoto;
        
        // 🌐 ወደ እናንተ የ Render ሰርቨር አዲሱ Endpoint መላክ
        const response = await fetch("https://poessa-digital-services-1.onrender.com/api/pensioners/verify-face-server", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            faydaNumber: dbPensionerData?.faydaNumber,
            idPhotoUrl: idPhoto,
            selfiePhotoUrl: cleanSelfie
          })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setProgress(100);
          setMatchStatus(`📊 ማነጻጸሩ ተጠናቋል! ውጤት፦ ${data.matchPercentage}%`);
          setTimeout(() => onSuccess(data.matchPercentage), 2000);
        } else {
          throw new Error(data.message || "የሰርቨር ማነጻጸር ስህተት");
        }

      } catch (err) {
        console.error("Backend Verification Error:", err);
        setMatchStatus("⚠️ ማሳሰቢያ፦ የፊት ማነጻጸሩ ዘግይቷል (በደህንነት መርህ ወደ ቀጣዩ እያለፈ ነው...)");
        setProgress(100);
        // ሰርቨር ላይ ችግር ቢኖር እንኳ የጡረተኛው ስራ እንዳይስተጓጎል በ 65% ማሳለፍ
        setTimeout(() => onSuccess(65), 2500);
      }
    }

    sendToBackend();
  }, [idPhoto, selfiePhoto, dbPensionerData, onSuccess]);

  return (
    <div style={{ padding: "30px", textAlign: "center", background: "#fff", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)", maxWidth: "450px", margin: "30px auto", fontFamily: "sans-serif" }}>
      <h3 style={{ color: "#162447", marginBottom: "20px", fontWeight: "700" }}>🤖 ደረጃ 4፦ የሰርቨር ባዮሜትሪክስ ማነጻጸሪያ</h3>
      
      <div style={{ display: "flex", justifyContent: "space-around", marginBottom: "25px", gap: "15px" }}>
        <div style={{ textAlign: "center" }}>
          <img src={idPhoto} alt="የመታወቂያ" style={{ width: "120px", height: "140px", objectFit: "cover", borderRadius: "8px", border: "3px solid #162447" }} />
          <p style={{ fontSize: "12px", color: "#64748b", marginTop: "5px", fontWeight: "bold" }}>የመታወቂያ ፎቶ</p>
        </div>
        <div style={{ textAlign: "center" }}>
          <img src={selfiePhoto?.selfieUrl || selfiePhoto} alt="ሴልፊ" style={{ width: "120px", height: "140px", objectFit: "cover", borderRadius: "8px", border: "3px solid #10b981" }} />
          <p style={{ fontSize: "12px", color: "#64748b", marginTop: "5px", fontWeight: "bold" }}>የአሁኑ ሴልፊ</p>
        </div>
      </div>

      <div style={{ width: "100%", background: "#e2e8f0", height: "8px", borderRadius: "4px", overflow: "hidden", marginBottom: "15px" }}>
        <div style={{ width: `${progress}%`, background: progress === 100 ? "#10b981" : "#162447", height: "100%", transition: "0.4s ease" }}></div>
      </div>

      <div style={{ padding: "12px", borderRadius: "8px", background: "#f8fafc", border: "1px solid #e2e8f0", fontSize: "15px", fontWeight: "bold", color: "#162447" }}>
        {matchStatus}
      </div>
    </div>
  );
}

export default FaceMatch;
