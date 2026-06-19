import React from "react";

function VerificationSuccess({ pensionerData }) {
  return (
    <div style={{ padding: "30px 20px", maxWidth: "450px", margin: "0 auto", textAlign: "center", fontFamily: "sans-serif" }}>
      <div style={{ width: "80px", height: "80px", backgroundColor: "#22c55e", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px auto", boxShadow: "0 10px 20px rgba(34, 197, 94, 0.2)" }}>
        <span style={{ color: "white", fontSize: "40px", fontWeight: "bold" }}>✓</span>
      </div>
      
      <h2 style={{ color: "#162447", margin: "0 0 10px 0" }}>🎉 ማረጋገጡ በተሳካ ሁኔታ ተጠናቋል!</h2>
      <p style={{ color: "#475569", fontSize: "15px", lineHeight: "1.5" }}>
        የጡረተኛው <strong>{pensionerData?.nameAmh || "ዜጋ"}</strong> በህይወት መኖራቸው በባዮሜትሪክስ ተረጋግጦ በዳታቤዝ ውስጥ <strong>"Verified"</strong> ከሆኑት ጋር በደህንነት ተመድቧል።
      </p>

      <div style={{ background: "#f8fafc", padding: "15px", borderRadius: "8px", border: "1px solid #e2e8f0", marginTop: "20px", textAlign: "left", fontSize: "13px" }}>
        <p style={{ margin: "4px 0" }}>🆔 <strong>ፋይዳ ቁጥር፦</strong> {pensionerData?.faydaNumber}</p>
        <p style={{ margin: "4px 0" }}>📅 <strong>የተረጋገጠበት ቀን፦</strong> {new Date().toLocaleDateString('et-ET')}</p>
        <p style={{ margin: "4px 0", color: "#162447" }}>💼 <strong>የጡረታ ሁኔታ፦</strong> Active / በህይወት ያሉ</p>
      </div>

      <button 
        onClick={() => window.location.reload()} 
        style={{ marginTop: "25px", background: "#162447", color: "#fff", padding: "12px 25px", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}
      >
        🔄 አዲስ ጡረተኛ አረጋግጥ
      </button>
    </div>
  );
}

export default VerificationSuccess;
