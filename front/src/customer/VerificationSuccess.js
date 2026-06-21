import React, { useState, useEffect } from "react";
import axios from "axios";

function VerificationSuccess({ pensionerData }) {
  // 🌟 አዲስ ማስተካከያ፦ ጡረተኛው የጨረሰበትን የፋይዳ ቁጥር በቀጥታ በራስ-ሰር እንዲይዝ ተደርጓል
  const [searchFayda, setSearchFayda] = useState(pensionerData?.faydaNumber || "");
  const [statusResult, setStatusResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // ገጹ እንደተከፈተ የጡረተኛውን መረጃ ቀጥታ መፈለግ እንዲችል ካስፈለገ
  const checkMyStatus = async () => {
    if (!searchFayda) return;
    setLoading(true);
    setStatusResult(null);
    try {
      // 🔗 ሁሉንም ጡረተኞች አምጥቶ በፍሮንትኤንድ የመፈለግ አስተማማኝ ስልት
      const res = await axios.get("https://poessa-digital-services-1.onrender.com/api/pensioners");
      if (res.data && res.data.success) {
        const found = res.data.data.find(p => p.faydaNumber === searchFayda.trim());
        if (found) {
          setStatusResult(found);
        } else {
          alert("❌ ይህ የፋይዳ ቁጥር በስርዓቱ ላይ አልተገኘም!");
        }
      } else {
        alert("❌ መረጃውን ማምጣት አልተቻለም።");
      }
    } catch (err) {
      console.error("Status Check Error in Success Page:", err);
      alert("⚠️ የአሁኑን ሁኔታ ለመፈተሽ አልተቻለም። እባክዎ ኢንተርኔትዎን ያረጋግጡ።");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "30px 20px", maxWidth: "450px", margin: "30px auto", textAlign: "center", fontFamily: "sans-serif", background: "#fff", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
      {/* ⏳ የአኒሜሽን ምልክት */}
      <div style={{ fontSize: "70px", marginBottom: "10px" }}>⏳</div>
      
      <h3 style={{ color: "#162447", fontSize: "22px", fontWeight: "700", margin: "10px 0" }}>ማረጋገጫዎ ለባለሙያ ተልኳል!</h3>
      <p style={{ color: "#475569", lineHeight: "1.6", fontSize: "15px" }}>
        የጡረተኛው <strong>{pensionerData?.name || "ባለቤት"}</strong> የባዮሜትሪክስ መረጃ በተሳካ ሁኔታ ተመዝግቧል። 
        አሁን የ POESSA ባለሙያዎች መረጃውን አይተው ያረጋግጣሉ። እባክዎ ጥቂት ቆይተው ሁኔታውን ከታች ይከታተሉ::
      </p>

      <hr style={{ margin: "25px 0", border: "0", height: "1px", background: "#e2e8f0" }} />

      {/* 🔍 የሁኔታ መከታተያ ሳጥን */}
      <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "10px", border: "1px solid #e2e8f0", boxSizing: "border-box" }}>
        <h4 style={{ margin: "0 0 12px 0", color: "#162447", fontWeight: "bold" }}>🔍 የሂደት ሁኔታ መከታተያ</h4>
        
        <input 
          type="text" 
          placeholder="የፋይዳ ቁጥርዎን እዚህ ያስገቡ..." 
          value={searchFayda}
          onChange={(e) => setSearchFayda(e.target.value.replace(/\D/g, ""))} // ቁጥር ብቻ እንዲቀበል
          maxLength={16}
          style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "2px solid #cbd5e1", fontSize: "16px", fontWeight: "bold", textAlign: "center", boxSizing: "border-box", outline: "none", backgroundColor: "#fff" }}
        />
        
        <button 
          onClick={checkMyStatus} 
          disabled={loading || searchFayda.length !== 16}
          style={{ width: "100%", background: "#162447", color: "#fff", padding: "12px", border: "none", borderRadius: "8px", marginTop: "12px", cursor: searchFayda.length === 16 ? "pointer" : "not-allowed", fontWeight: "bold", fontSize: "15px", opacity: searchFayda.length === 16 ? 1 : 0.6 }}
        >
          {loading ? "በመፈለግ ላይ... ⏳" : "የማረጋገጫ ሁኔታዬን እይ"}
        </button>

        {/* 📊 የውጤት ማሳያ ቦርድ */}
        {statusResult && (
          <div style={{ 
            marginTop: "15px", 
            padding: "15px", 
            borderRadius: "8px", 
            textAlign: "center",
            fontWeight: "bold",
            fontSize: "14px",
            background: statusResult.verificationStatus === "Verified" ? "#dcfce7" : statusResult.verificationStatus === "Failed" ? "#fee2e2" : "#fef9c3",
            color: statusResult.verificationStatus === "Verified" ? "#15803d" : statusResult.verificationStatus === "Failed" ? "#b91c1c" : "#a16207",
            border: `1px solid ${statusResult.verificationStatus === "Verified" ? "#bbf7d0" : statusResult.verificationStatus === "Failed" ? "#fecaca" : "#fef08a"}`
          }}>
            <span>የአሁኑ ሁኔታ፦ </span>
            {statusResult.verificationStatus === "Verified" ? "✅ የጸደቀ (Verified)" : statusResult.verificationStatus === "Failed" ? "🔴 ውድቅ የተደረገ (Failed)" : "⏳ በመጠባበቅ ላይ (Pending)"}
            
            {/* ⚠️ ውድቅ የተደረገበት ምክንያት ካለ */}
            {statusResult.verificationStatus === "Failed" && statusResult.comment && (
              <div style={{ marginTop: "10px", padding: "8px", background: "#fff", borderRadius: "4px", color: "#991b1b", fontSize: "13px", textAlign: "left", borderLeft: "3px solid #dc2626", fontWeight: "normal" }}>
                <strong>⚠️ ምክንያት፦</strong> "{statusResult.comment}"
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default VerificationSuccess;
