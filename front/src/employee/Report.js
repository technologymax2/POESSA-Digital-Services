import React, { useEffect, useState } from "react";
import axios from "axios";

function Report() {
  const [pensioners, setPensioners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPensioner, setSelectedPensioner] = useState(null); // ለፖፕ-አፕ (Modal)
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPensioners();
  }, []);

  const fetchPensioners = async () => {
    try {
      const res = await axios.get("https://poessa-digital-services-1.onrender.com/api/pensioners");
      if (res.data && res.data.success) {
        setPensioners(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ የጡረተኛውን ሁኔታ ማጽደቂያ ወይም ውድቅ ማድረጊያ
  const handleUpdateStatus = async (id, status) => {
    if (status === "Failed" && !comment.trim()) {
      alert("⚠️ እባክዎ መጀመሪያ ውድቅ የተደረገበትን ምክንያት በኮሜንት ሳጥኑ ውስጥ ይጻፉ!");
      return;
    }

    setSubmitting(true);
    try {
      const res = await axios.put(`https://poessa-digital-services-1.onrender.com/api/pensioners/${id}`, {
        verificationStatus: status,
        comment: status === "Failed" ? comment : "የተሟላ ባዮሜትሪክስ ማረጋገጫ አልፏል።"
      });

      if (res.data && res.data.success) {
        alert(`Status updated to ${status} successfully!`);
        setSelectedPensioner(null);
        setComment("");
        fetchPensioners(); // ዝርዝሩን ማደስ
      }
    } catch (err) {
      console.error(err);
      alert("ስህተት አጋጥሟል፤ መረጃውን ማስተካከል አልተቻለም።");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ textAlign: "center", marginTop: "50px", fontFamily: "sans-serif" }}>⏳ ሙሉ የሪፖርት መረጃዎችን ከዳታቤዝ በመጫን ላይ...</div>;

  return (
    <div style={{ padding: "30px", fontFamily: "sans-serif", backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      <h2 style={{ color: "#162447", marginBottom: "5px" }}>📊 የጡረተኞች የባዮሜትሪክስ ማረጋገጫ ማውጫ (Report)</h2>
      <p style={{ color: "#64748b", marginBottom: "20px" }}>የቀረቡ የባዮሜትሪክስ መረጃዎችን በመገምገም ያጽድቁ ወይም ውድቅ ያድርጉ</p>

      {/* 📋 የዳታ ሰንጠረዥ */}
      <div style={{ overflowX: "auto", background: "#fff", borderRadius: "8px", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ background: "#162447", color: "#fff" }}>
              <th style={{ padding: "12px" }}>የጡረተኛው ስም</th>
              <th style={{ padding: "12px" }}>የፋይዳ ቁጥር</th>
              <th style={{ padding: "12px" }}>የፊት ማች ፐርሰንት</th>
              <th style={{ padding: "12px" }}>የሂደት ሁኔታ</th>
              <th style={{ padding: "12px" }}>ድርጊት</th>
            </tr>
          </thead>
          <tbody>
            {pensioners.map((p) => (
              <tr key={p._id} style={{ borderBottom: "1px solid #e2e8f0", transition: "0.2s" }}>
                <td style={{ padding: "12px", fontWeight: "bold" }}>{p.name}</td>
                <td style={{ padding: "12px" }}>{p.faydaNumber}</td>
                <td style={{ padding: "12px", fontWeight: "bold", color: "#2563eb" }}>
                  {p.matchPercentage ? `${p.matchPercentage}%` : "---"}
                </td>
                <td style={{ padding: "12px" }}>
                  <span style={{ 
                    padding: "5px 10px", borderRadius: "4px", fontSize: "12px", fontWeight: "bold",
                    background: p.verificationStatus === "Verified" ? "#dcfce7" : p.verificationStatus === "Failed" ? "#fee2e2" : "#fef9c3",
                    color: p.verificationStatus === "Verified" ? "#15803d" : p.verificationStatus === "Failed" ? "#b91c1c" : "#a16207"
                  }}>
                    {p.verificationStatus || "Pending"}
                  </span>
                </td>
                <td style={{ padding: "12px" }}>
                  <button 
                    onClick={() => setSelectedPensioner(p)}
                    style={{ background: "#475569", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
                  >
                    🔍 ዝርዝር እይ
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 🗂️ ዝርዝር ማሳያ ፖፕ-አፕ (Modal) */}
      {selectedPensioner && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", padding: "25px", borderRadius: "12px", width: "90%", maxWidth: "500px", boxShadow: "0 10px 25px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" }}>
            <h3 style={{ margin: "0 0 15px 0", color: "#162447" }}>📋 የጡረተኛው ዝርዝር ማረጋገጫ</h3>

            {/* 📸 የፎቶ ማነፃፀሪያ ክፍል */}
            <div style={{ display: "flex", justifyContent: "space-around", marginBottom: "15px", background: "#f1f5f9", padding: "10px", borderRadius: "8px" }}>
              <div style={{ textAlign: "center" }}>
                <img src={selectedPensioner.idPhotoUrl || selectedPensioner.image} alt="ID" style={{ width: "120px", height: "130px", objectFit: "cover", borderRadius: "6px", border: "2px solid #cbd5e1" }} />
                <span style={{ display: "block", fontSize: "11px", color: "#475569", marginTop: "4px", fontWeight: "bold" }}>የመታወቂያ ፎቶ</span>
              </div>
              <div style={{ textAlign: "center" }}>
                <img src={selectedPensioner.selfiePhotoUrl || selectedPensioner.selfie} alt="Selfie" style={{ width: "120px", height: "130px", objectFit: "cover", borderRadius: "6px", border: "2px solid #cbd5e1" }} />
                <span style={{ display: "block", fontSize: "11px", color: "#475569", marginTop: "4px", fontWeight: "bold" }}>የቀጥታ ሴልፊ</span>
              </div>
            </div>

            {/* 📊 የ AI ውጤቶች መረጃ */}
            <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", marginBottom: "15px", fontSize: "14px", lineHeight: "1.8", border: "1px solid #e2e8f0" }}>
              <p style={{ margin: "4px 0" }}><strong>ስም፦</strong> {selectedPensioner.name}</p>
              <p style={{ margin: "4px 0" }}><strong>የፋይዳ ቁጥር፦</strong> {selectedPensioner.faydaNumber}</p>
              <div style={{ borderTop: "1px dashed #cbd5e1", marginTop: "8px", paddingTop: "8px" }}>
                👤 ፊቱ ተገጣጥሟል? <strong>{selectedPercentageCheck(selectedPensioner) ? "✅ አዎ" : "❌ የለም"}</strong>
              </div>
              
              {/* 🌟 ሰራተኛው በደመቀ ሰማያዊ ከለር የፊት ማች ፐርሰንቱን የሚያይበት መስመር */}
              <div>
                📊 የፊት መመሳሰል መጠን፦ <strong style={{ color: "#2563eb", fontSize: "18px" }}>
                  {selectedPensioner.matchPercentage ? `${selectedPensioner.matchPercentage}%` : "---"}
                </strong>
              </div>

              <div>😊 ፈገግታ ፈተና፦ <strong>{selectedPensioner.smilePassed ? "✅ አልፏል" : "❌ አልፏል"}</strong></div>
              <div>🔄 የእንቅስቃሴ ፈተና፦ <strong>{selectedPensioner.nodPassed ? "✅ አልፏል" : "❌ አልፏል"}</strong></div>
            </div>

            {/* ✍️ የኮሜንት መስጫ */}
            <label style={{ fontSize: "13px", fontWeight: "bold", color: "#162447" }}>ውድቅ ካደረጉ ምክንያቱን እዚህ ይጻፉ፦</label>
            <textarea 
              placeholder="ለምሳሌ፦ መታወቂያው እና ፊቱ አይመሳሰሉም..." 
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", marginTop: "5px", height: "60px", boxSizing: "border-box", outline: "none" }}
            />

            {/* 🔘 የውሳኔ ቁልፎች */}
            <div style={{ display: "flex", gap: "10px", marginTop: "25px" }}>
              <button 
                onClick={() => handleUpdateStatus(selectedPensioner._id, "Verified")}
                disabled={submitting}
                style={{ flex: 1, background: "#22c55e", color: "#fff", border: "none", padding: "12px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}
              >
                ✅ አጽድቅ (Approve)
              </button>
              <button 
                onClick={() => handleUpdateStatus(selectedPensioner._id, "Failed")}
                disabled={submitting}
                style={{ flex: 1, background: "#dc2626", color: "#fff", border: "none", padding: "12px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}
              >
                ❌ ውድቅ አድርግ (Reject)
              </button>
            </div>

            <button 
              onClick={() => { setSelectedPensioner(null); setComment(""); }}
              style={{ width: "100%", background: "#cbd5e1", color: "#334155", border: "none", padding: "10px", borderRadius: "6px", marginTop: "10px", cursor: "pointer", fontWeight: "bold" }}
            >
              ዝጋ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ፊቱ መመሳሰሉን ለመፈተሽ ረዳት ፈንክሽን
function selectedPercentageCheck(p) {
  if (p.matchPercentage && parseInt(p.matchPercentage) >= 50) return true;
  return p.faceMatched === true || p.faceMatched === "true";
}

export default Report;
