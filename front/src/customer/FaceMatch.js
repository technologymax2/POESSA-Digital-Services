import React, { useEffect, useState, useRef } from "react";

function FaceMatch({ idPhoto, selfiePhoto, dbPensionerData, onSuccess, smilePassed, nodPassed, turnPassed, }) {
  const [matchStatus, setMatchStatus] = useState(
    "⏳ ምስሎችን ወደ ድርጅቱ ሰርቨር በመላክ ላይ..."
  );
  const [progress, setProgress] = useState(20);
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    async function sendToBackend() {
      try {
        setProgress(50);
        setMatchStatus("🧠 ሰርቨሩ የፊት ገጽታዎችን እያነጻጸረ ነው...");

        const cleanSelfie = selfiePhoto?.selfieUrl || selfiePhoto;

        // 🌐 እውነተኛውን እና ሁሉንም ዳታ በአንድ ላይ የሚይዘውን /verify-success መስመር መጥራት
        const response = await fetch(
          "https://poessa-digital-services-1.onrender.com/api/pensioners/verify-success",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              faydaNumber: dbPensionerData?.faydaNumber,
              dbPhotoUrl: idPhoto,
              selfiePhotoUrl: cleanSelfie,
              smilePassed: smilePassed ?? true, // የሊቨነስ ውጤቶች ካሉህ እዚህ ይተካሉ
              nodPassed: nodPassed ?? true,
              turnPassed: turnPassed ?? true,
            }),
          }
        );

        const resData = await response.json();

        if (response.ok && resData.success) {
          const realPercent = resData.data.matchPercentage;
          setProgress(100);
          setMatchStatus(`📊 ማነጻጸሩ ተጠናቋል! እውነተኛ ውጤት፦ ${realPercent}%`);
          setTimeout(() => onSuccess(realPercent), 2000);
        } else {
          throw new Error(resData.message || "የሰርቨር ማነጻጸር ስህተት");
        }
      } catch (err) {
        console.error("Backend Verification Error:", err);
        setMatchStatus("⚠️ ማሳሰቢያ፦ የፊት ማነጻጸር ስህተት አጋጥሟል!");
        setProgress(100);
        setTimeout(() => onSuccess(0), 2500); // ስህተት ከሆነ 0% ይሰጣል
      }
    }

    sendToBackend();
  }, [
    idPhoto,
    selfiePhoto,
    dbPensionerData,
    onSuccess,
    smilePassed,
    nodPassed,
    turnPassed,
  ]);

  return (
    <div
      style={{
        padding: "30px",
        textAlign: "center",
        background: "#fff",
        borderRadius: "12px",
        boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
        maxWidth: "450px",
        margin: "30px auto",
        fontFamily: "sans-serif",
      }}
    >
      <h3 style={{ color: "#162447", marginBottom: "20px", fontWeight: "700" }}>
        🤖 ደረጃ 4፦ የሰርቨር ባዮሜትሪክስ ማነጻጸሪያ
      </h3>

      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          marginBottom: "25px",
          gap: "15px",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <img
            src={idPhoto}
            alt="የመታወቂያ"
            style={{
              width: "120px",
              height: "140px",
              objectFit: "cover",
              borderRadius: "8px",
              border: "3px solid #162447",
            }}
          />
          <p
            style={{
              fontSize: "12px",
              color: "#64748b",
              marginTop: "5px",
              fontWeight: "bold",
            }}
          >
            የመታወቂያ ፎቶ
          </p>
        </div>
        <div style={{ textAlign: "center" }}>
          <img
            src={selfiePhoto?.selfieUrl || selfiePhoto}
            alt="ሴልፊ"
            style={{
              width: "120px",
              height: "140px",
              objectFit: "cover",
              borderRadius: "8px",
              border: "3px solid #10b981",
            }}
          />
          <p
            style={{
              fontSize: "12px",
              color: "#64748b",
              marginTop: "5px",
              fontWeight: "bold",
            }}
          >
            የአሁኑ ሴልፊ
          </p>
        </div>
      </div>

      <div
        style={{
          width: "100%",
          background: "#e2e8f0",
          height: "8px",
          borderRadius: "4px",
          overflow: "hidden",
          marginBottom: "15px",
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            background: progress === 100 ? "#10b981" : "#162447",
            height: "100%",
            transition: "0.4s ease",
          }}
        ></div>
      </div>

      <div
        style={{
          padding: "12px",
          borderRadius: "8px",
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          fontSize: "15px",
          fontWeight: "bold",
          color: "#162447",
        }}
      >
        {matchStatus}
      </div>
    </div>
  );
}

export default FaceMatch;
