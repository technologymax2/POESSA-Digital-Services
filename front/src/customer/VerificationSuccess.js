import React, { useState } from "react";
import axios from "axios";

function VerificationSuccess({ pensionerData }) {
  const [searchFayda, setSearchFayda] = useState("");
  const [statusResult, setStatusResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const checkMyStatus = async () => {
    if (!searchFayda) return;
    setLoading(true);
    try {
      const res = await axios.get(`https://poessa-digital-services-1.onrender.com/api/pensioners/search?query=${searchFayda}`);
      if (res.data && res.data.success) {
        setStatusResult(res.data.data);
      } else {
        alert("የፋይዳ ቁጥሩ አልተገኘም!");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "500px", margin: "0 auto", textAlign: "center", fontFamily: "sans-serif" }}>
      <div style={{ fontSize: "60px", color: "#22c55e" }}>⏳</div>
      <h3 style={{ color: "#162447" }}>ማረጋገጫዎ ለባለሙያ ተልኳል!</h3>
      <p style={{ color: "#475569", lineHeight: "1.6" }}>
        የጡረተኛው <strong>{pensionerData?.name || "Mamaru Anmaw"}</strong> መረጃ በተሳካ ሁኔታ ተመዝግቧል። 
        አሁን ባለሙያዎቻችን መረጃውን አይተው ያረጋግጣሉ። እባክዎ ጥቂት ቆይተው ሁኔታውን ይፈትሹ።
      </p>

      <hr style={{ margin: "25px 0", border: "0", hieght: "1px", background: "#cbd5e1" }} />

      {/* 🔍 ጡረተኛው በፋይዳ ቁጥር ገብቶ ሁኔታውን የሚያይበት ክፍል */}
      <div style={{ background: "#f8fafc", padding: "15px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
        <h4 style={{ margin: "0 0 10px 0", color: "#162447" }}>🔍 የሁኔታ መከታተያ</h4>
        <input 
          type="text" 
          placeholder="የፋይዳ ቁጥርዎን እዚህ ያስገቡ..." 
          value={searchFayda}
          onChange={(e) => setSearchFayda(e.target.value)}
          style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", textAlign: "center", boxSizing: "border-box" }}
        />
        <button onClick={checkMyStatus} style={{ width: "100%", background: "#162447", color: "#fff", padding: "10px", border: "none", borderRadius: "6px", marginTop: "10px", cursor: "pointer", fontWeight: "bold" }}>
          {loading ? "በመፈለግ ላይ..." : "የማረጋገጫ ሁኔታዬን እይ"}
        </button>

        {statusResult && (
          <div style={{ marginTop: "15px", padding: "10px", borderRadius: "6px", background: statusResult.verificationStatus === "Verified" ? "#dcfce7" : statusResult.verificationStatus === "Rejected" ? "#fee2e2" : "#fef9c3" }}>
            <strong>የአሁኑ ሁኔታ፦</strong> {statusResult.verificationStatus || "Pending (በሂደት ላይ)"}
            {statusResult.comment && (
              <div style={{ marginTop: "5px", color: "#991b1b", fontSize: "13px" }}>
                <strong>⚠️ ከባለሙያ የተላከ መልዕክት፦</strong> {statusResult.comment}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default VerificationSuccess;
