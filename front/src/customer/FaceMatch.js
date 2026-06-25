// src/components/FaceMatch.js
import React, { useEffect, useState } from "react";

function FaceMatch({ idPhoto, selfiePhoto, dbPensionerData, onSuccess, livenessResults }) {
  const [matchStatus, setMatchStatus] = useState("⏳ ምስሎችን በመላክ ላይ...");

  useEffect(() => {
    async function verify() {
      try {
        const res = await fetch("https://poessa-digital-services-1.onrender.com/api/pensioners/verify-success", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            faydaNumber: dbPensionerData?.faydaNumber,
            dbPhotoUrl: idPhoto,
            selfiePhotoUrl: selfiePhoto,
            ...livenessResults
          })
        });
        const data = await res.json();
        if (data.success) {
          setMatchStatus(`📊 ማነጻጸሩ ተጠናቀቀ፦ ${data.data.matchPercentage}%`);
          setTimeout(() => onSuccess(data.data.matchPercentage), 2000);
        } else {
          setMatchStatus("❌ ማረጋገጫ አልተሳካም");
        }
      } catch (err) {
        setMatchStatus("⚠️ ሰርቨር ስህተት!");
      }
    }
    verify();
  }, [idPhoto, selfiePhoto, dbPensionerData, livenessResults, onSuccess]);

  return <div style={{ textAlign: "center", padding: "20px" }}><h3>{matchStatus}</h3></div>;
}
export default FaceMatch;
