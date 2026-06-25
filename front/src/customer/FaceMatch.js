import React, { useEffect, useState } from "react";

function FaceMatch({ idPhoto, selfiePhoto, dbPensionerData, livenessResults, onSuccess }) {
  const [status, setStatus] = useState("🧠 ምስሎችን በማወዳደር ላይ...");
  const [error, setError] = useState(null);

  useEffect(() => {
    const verifyIdentity = async () => {
      try {
        // 1. Prepare data for the backend API
        const payload = {
          faydaNumber: dbPensionerData?.faydaNumber,
          dbPhotoUrl: idPhoto,
          selfiePhotoUrl: selfiePhoto,
          smilePassed: livenessResults?.smilePassed || false,
          nodPassed: livenessResults?.nodPassed || false,
          turnPassed: livenessResults?.turnPassed || false
        };

        // 2. Call the backend API (ensure this matches your server route)
        const response = await fetch("https://poessa-digital-services-1.onrender.com/api/pensioners/verify-success", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const resData = await response.json();

        if (resData.success) {
          setStatus(`✅ ማረጋገጫ ተጠናቀቀ! የፊት መመሳሰል: ${resData.data.matchPercentage}%`);
          // 3. Trigger success callback after a short delay so user can read status
          setTimeout(() => onSuccess(resData.data), 2000);
        } else {
          setError(resData.message || "❌ የፊት ማነጻጸር አልተሳካም");
        }
      } catch (err) {
        console.error("Verification Error:", err);
        setError("⚠️ ሰርቨር ጋር መገናኘት አልተቻለም። እባክዎ እንደገና ይሞክሩ።");
      }
    };

    if (idPhoto && selfiePhoto) {
      verifyIdentity();
    } else {
      setError("❌ የምስል መረጃ ጎድሏል");
    }
  }, [idPhoto, selfiePhoto, dbPensionerData, livenessResults, onSuccess]);

  return (
    <div style={{ textAlign: "center", padding: "40px", fontFamily: "sans-serif" }}>
      {error ? (
        <div style={{ color: "#b91c1c", fontWeight: "bold" }}>{error}</div>
      ) : (
        <div>
          <div className="spinner" style={{ fontSize: "40px", marginBottom: "20px" }}>🔄</div>
          <h3 style={{ color: "#162447" }}>{status}</h3>
          <p style={{ color: "#64748b" }}>እባክዎ አይውጡ፣ መረጃው በሰርቨር እየተመዘገበ ነው...</p>
        </div>
      )}
    </div>
  );
}

export default FaceMatch;
