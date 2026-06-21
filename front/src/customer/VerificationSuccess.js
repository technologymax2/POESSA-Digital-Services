import React, { useState } from "react";
import axios from "axios";

function VerificationSuccess({ pensionerData }) {
  const [searchFayda, setSearchFayda] = useState(pensionerData?.faydaNumber || "");
  const [statusResult, setStatusResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const checkMyStatus = async () => {
    if (!searchFayda) return;
    setLoading(true);
    setStatusResult(null);
    try {
      // 🔗 አሁን ወደ ትክክለኛው የ Liveness endpoint እየጠየቅን ነው
      const res = await axios.get(`https://poessa-digital-services-1.onrender.com/api/liveness/pensioners`);
      
      if (res.data && res.data.success) {
        // ከሊቭነስ ዳታቤዝ ውስጥ የተፈለገውን ሰው መፈለግ
        const found = res.data.data.find(p => p.faydaNumber === searchFayda.trim());
        if (found) {
          setStatusResult(found);
        } else {
          alert("❌ ይህ የፋይዳ ቁጥር የባዮሜትሪክስ ፈተና ታሪክ ውስጥ አልተገኘም!");
        }
      }
    } catch (err) {
      console.error("Status Check Error:", err);
      alert("⚠️ ሁኔታውን ለመፈተሽ አልተቻለም።");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "30px 20px", maxWidth: "450px", margin: "30px auto", textAlign: "center", fontFamily: "sans-serif", background: "#fff", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
      <div style={{ fontSize: "70px", marginBottom: "10px" }}>⏳</div>
      <h3 style={{ color: "#162447", fontSize: "22px", fontWeight: "700" }}>ማረጋገጫዎ ተልኳል!</h3>
      <p style={{ color: "#475569", fontSize: "15px" }}>
        የጡረተኛው <strong>{pensionerData?.nameAmh || "ባለቤት"}</strong> መረጃ ተቀብለናል።
      </p>

      <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
        <h4 style={{ margin: "0 0 12px 0" }}>🔍 የሂደት ሁኔታ መከታተያ</h4>
        <input 
          type="text" 
          placeholder="የፋይዳ ቁጥር..." 
          value={searchFayda}
          onChange={(e) => setSearchFayda(e.target.value)}
          style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
        />
        <button 
          onClick={checkMyStatus} 
          disabled={loading}
          style={{ width: "100%", background: "#162447", color: "#fff", padding: "12px", borderRadius: "8px", marginTop: "12px", cursor: "pointer" }}
        >
          {loading ? "በመፈለግ ላይ..." : "ሁኔታዬን እይ"}
        </button>

        {statusResult && (
          <div style={{ 
            marginTop: "15px", 
            padding: "15px", 
            borderRadius: "8px",
            background: statusResult.verificationStatus === "Verified" ? "#dcfce7" : statusResult.verificationStatus === "Failed" ? "#fee2e2" : "#fef9c3",
            color: statusResult.verificationStatus === "Verified" ? "#15803d" : statusResult.verificationStatus === "Failed" ? "#b91c1c" : "#a16207"
          }}>
            <strong>ሁኔታ፦ </strong>
            {statusResult.verificationStatus === "Verified" ? "✅ የጸደቀ" : statusResult.verificationStatus === "Failed" ? "🔴 ውድቅ የተደረገ" : "⏳ በመጠባበቅ ላይ"}
            {statusResult.comment && <p style={{ fontSize: "12px", marginTop: "5px" }}>ምክንያት፡ {statusResult.comment}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

export default VerificationSuccess;
