import React, { useState } from "react";
import axios from "axios";
import "./CheckStatus.css"; // ካስፈለገ ስታይል ለመጨመር

function CheckStatus() {
  const [faydaNumber, setFaydaNumber] = useState("");
  const [pensioner, setPensioner] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleCheckStatus = async (e) => {
    e.preventDefault();
    if (!faydaNumber.trim()) return;

    setLoading(true);
    setSearched(true);
    setPensioner(null);

    try {
      // ከዚህ ቀደም የፋይዳ ቁጥር የምንፈልግበትን API መጠቀም
      const response = await axios.get(`https://poessa-digital-services-1.onrender.com/api/pensioners/search?query=${faydaNumber}`);
      
      if (response.data && response.data.success) {
        setPensioner(response.data.data);
      } else {
        setPensioner(null);
      }
    } catch (err) {
      console.error("Status Check Error:", err);
      alert("የመረጡትን ሁኔታ መፈተሽ አልተቻለም። እባክዎ ኢንተርኔትዎን ያረጋግጡ።");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "40px 20px", maxWidth: "500px", margin: "50px auto", textAlign: "center", fontFamily: "sans-serif", background: "#fff", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
      <h2 style={{ color: "#162447", marginBottom: "10px" }}>🔍 የጡረታ ማረጋገጫ ሁኔታ መከታተያ</h2>
      <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "30px" }}>የፋይዳ ቁጥርዎን በማስገባት የማረጋገጫ ሂደትዎ የት ደረጃ ላይ እንደደረሰ ይከታተሉ</p>

      <form onSubmit={handleCheckStatus} style={{ marginBottom: "30px" }}>
        <input 
          type="text" 
          placeholder="ባለ 16 ዲጂት የፋይዳ ቁጥርዎን ያስገቡ..." 
          value={faydaNumber}
          onChange={(e) => setFaydaNumber(e.target.value)}
          maxLength={16}
          style={{ width: "100%", padding: "14px", borderRadius: "8px", border: "2px solid #cbd5e1", fontSize: "16px", textAlign: "center", boxSizing: "border-box", outline: "none" }}
        />
        <button type="submit" style={{ width: "100%", background: "#162447", color: "#fff", padding: "14px", border: "none", borderRadius: "8px", marginTop: "15px", fontSize: "16px", fontWeight: "bold", cursor: "pointer", transition: "0.3s" }}>
          {loading ? "በመፈለግ ላይ... ⏳" : "የማረጋገጫ ሁኔታዬን አሳይ"}
        </button>
      </form>

      {/* 📊 የውጤት ማሳያ ሰሌዳ */}
      {loading && <p style={{ color: "#64748b" }}>መረጃው ከሰርቨር እየተጫነ ነው...</p>}

      {!loading && searched && !pensioner && (
        <div style={{ padding: "20px", borderRadius: "8px", background: "#fee2e2", color: "#b91c1c", fontWeight: "bold" }}>
          ❌ ይህ የፋይዳ ቁጥር በስርዓቱ ላይ አልተገኘም! እባክዎ ቁጥሩን አስተካክለው ይሞክሩ።
        </div>
      )}

      {!loading && pensioner && (
        <div style={{ marginTop: "20px", padding: "20px", borderRadius: "10px", border: "1px solid #e2e8f0", textAlign: "left", background: "#f8fafc" }}>
          <h4 style={{ margin: "0 0 15px 0", color: "#162447", borderBottom: "1px solid #e2e8f0", paddingBottom: "10px" }}>📋 የባለቤት መረጃ</h4>
          <p><strong>ስም፦</strong> {pensioner.name || "Mamaru Anmaw"}</p>
          <p><strong>የፋይዳ ቁጥር፦</strong> {pensioner.faydaNumber || pensioner.fayda}</p>
          
          <div style={{ marginTop: "20px", padding: "15px", borderRadius: "8px", textAlign: "center", fontWeight: "bold", 
            background: pensioner.verificationStatus === "Verified" ? "#dcfce7" : pensioner.verificationStatus === "Rejected" ? "#fee2e2" : "#fef9c3",
            color: pensioner.verificationStatus === "Verified" ? "#15803d" : pensioner.verificationStatus === "Rejected" ? "#b91c1c" : "#a16207"
          }}>
            የአሁኑ የሂደት ሁኔታ፦ {pensioner.verificationStatus === "Verified" ? "✅ ተረጋግጧል (Verified)" : pensioner.verificationStatus === "Rejected" ? "❌ ውድቅ ተደርጓል (Rejected)" : "⏳ በሂደት ላይ (Pending)"}
          </div>

          {/* ⚠️ ከባለሙያ የተላከ መልዕክት ካለ */}
          {pensioner.verificationStatus === "Rejected" && pensioner.comment && (
            <div style={{ marginTop: "15px", padding: "12px", borderRadius: "6px", background: "#fff5f5", borderLeft: "4px solid #ef4444", color: "#991b1b", fontSize: "14px" }}>
              <strong>⚠️ ከባለሙያ የተላከ ማሳሰቢያ፦</strong> "{pensioner.comment}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CheckStatus;
