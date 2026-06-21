import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Report.css"; // 👈 ያዘጋጀኸውን External CSS እዚህ ጋር አገናኝተነዋል

// 💡 ያንተን የቤክኤንድ URL እዚህ ጋር አስተካክል
const API_BASE_URL = "https://your-backend-service.onrender.com/api"; 

const Report = () => {
  const [pensioners, setPensioners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // ለፖፕ-አፕ (Modal) መቆጣጠሪያ
  const [selectedPensioner, setSelectedPensioner] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [comment, setComment] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // 🔄 1. የሪፖርት መረጃዎችን ከቤክኤንድ ማምጫ (Fetch Data)
  const fetchReportData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/pensioners`);
      if (response.data.success) {
        setPensioners(response.data.data);
        setError("");
      } else {
        setError("መረጃውን ማምጣት አልተቻለም።");
      }
    } catch (err) {
      console.error("Fetch Error:", err);
      setError("ከሰርቨር ጋር መገናኘት አልተቻለም። እባክዎ የኔትወርክ መስመርዎን ያረጋግጡ!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  // 👁️ 2. የአንዱን ጡረተኛ ዝርዝር መረጃ በፖፕ-አፕ ለመክፈት
  const handleOpenDetails = (pensioner) => {
    setSelectedPensioner(pensioner);
    setComment(pensioner.comment || "");
    setShowModal(true);
  };

  // 🟢 🔴 3. የጡረተኛውን ሁኔታ ማጽደቂያ ወይም ውድቅ ማድረጊያ (Verify / Fail)
  const handleUpdateStatus = async (status) => {
    if (!selectedPensioner) return;

    try {
      setActionLoading(true);
      const response = await axios.put(
        `${API_BASE_URL}/pensioners/verify-status/${selectedPensioner.faydaNumber}`,
        {
          verificationStatus: status,
          comment: comment
        }
      );

      if (response.data.success) {
        alert(`የማረጋገጫ ሁኔታው በተሳካ ሁኔታ ወደ ${status} ተቀይሯል!`);
        setShowModal(false);
        fetchReportData(); // ሰንጠረዡን በቅጽበት በጀርባ ለማደስ
      } else {
        alert("⚠️ ሁኔታውን ማዘመን አልተቻለም፦ " + response.data.message);
      }
    } catch (err) {
      console.error("Update Error:", err);
      alert("❌ ስህተት አጋጥሟል! እባክዎ የቤክኤንድ መስመርዎን ያረጋግጡ።");
    } finally {
      setActionLoading(false);
    }
  };

  // 📊 4. የማጠቃለያ ቁጥሮችን በራስ-ሰር የመቁጠሪያ ሎጂክ
  const totalCount = pensioners.length;
  const pendingCount = pensioners.filter(p => p.verificationStatus === "Pending").length;
  const verifiedCount = pensioners.filter(p => p.verificationStatus === "Verified").length;
  const failedCount = pensioners.filter(p => p.verificationStatus === "Failed").length;

  if (loading) return <div className="admin-dashboard-wrapper" style={{textAlign: 'center', paddingTop: '40px'}}>⏳ መረጃ በመጫን ላይ ነው... እባክዎ ይጠብቁ...</div>;
  if (error) return <div className="admin-dashboard-wrapper" style={{color: '#b91c1c', textAlign: 'center', fontWeight: 'bold'}}>⚠️ {error}</div>;

  return (
    <div className="admin-dashboard-wrapper">
      <h2 style={{ textAlign: "center", color: "#1e293b", marginBottom: "25px", fontWeight: "700" }}>
        🔍 POESSA የባዮሜትሪክስ ማረጋገጫ ሪፖርት ማውጫ
      </h2>
      
      {/* 📊 የማጠቃለያ ካርዶች ሰሌዳ (Summary Grid) */}
      <div className="admin-summary-grid">
        <div className="summary-card total">
          <h3>{totalCount}</h3>
          <p>ጠቅላላ የሞከሩ</p>
        </div>
        <div className="summary-card pending">
          <h3>{pendingCount}</h3>
          <p>⏳ በመጠባበቅ ላይ (Pending)</p>
        </div>
        <div className="summary-card verified">
          <h3>{verifiedCount}</h3>
          <p>🟢 የጸደቁ (Verified)</p>
        </div>
        <div className="summary-card rejected">
          <h3>{failedCount}</h3>
          <p>🔴 ውድቅ የተደረጉ (Failed)</p>
        </div>
      </div>

      {/* ቁልፎችን ለማተም (Print) በማይፈለግበት ጊዜ ለመደበቅ 'no-print' ክላስ ተጨምሯል */}
      <div className="no-print" style={{ marginBottom: "15px", textAlign: "right" }}>
        <button 
          onClick={() => window.print()} 
          style={{ background: "#0f172a", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}
        >
          🖨️ ሪፖርቱን አትም (Print Report)
        </button>
      </div>

      {/* 📝 የጡረተኞች መረጃ ሰንጠረዥ */}
      <div className="admin-table-container">
        <table className="admin-data-table">
          <thead>
            <tr>
              <th>የጡረተኛው ስም</th>
              <th>ፋይዳ ቁጥር</th>
              <th>ስልክ ቁጥር</th>
              <th>የእድሳት ቀን / ሰዓት</th>
              <th>የአሁኑ ሁኔታ</th>
              <th className="no-print">ድርጊት</th>
            </tr>
          </thead>
          <tbody>
            {pensioners.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                  ምንም የተመዘገበ የባዮሜትሪክስ መረጃ አልተገኘም።
                </td>
              </tr>
            ) : (
              pensioners.map((p, index) => (
                <tr key={p._id || index}>
                  <td><strong>{p.name}</strong></td>
                  <td>{p.faydaNumber}</td>
                  <td>{p.phone}</td>
                  <td>{new Date(p.lastVerificationDate).toLocaleString("am-ET")}</td>
                  <td>
                    <span style={{
                      padding: "4px 10px",
                      borderRadius: "20px",
                      fontSize: "13px",
                      fontWeight: "bold",
                      backgroundColor: p.verificationStatus === "Verified" ? "#dcfce7" : p.verificationStatus === "Failed" ? "#fee2e2" : "#fef9c3",
                      color: p.verificationStatus === "Verified" ? "#16a34a" : p.verificationStatus === "Failed" ? "#dc2626" : "#ca8a04"
                    }}>
                      {p.verificationStatus === "Verified" ? "🟢 የጸደቀ" : p.verificationStatus === "Failed" ? "🔴 ውድቅ የተደረገ" : "⏳ በሂደት ላይ"}
                    </span>
                  </td>
                  <td className="no-print">
                    <button 
                      style={{ background: "#2563eb", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer", fontWeight: "600" }}
                      onClick={() => handleOpenDetails(p)}
                    >
                      ዝርዝር መረጃ
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 🗂️ ፖፕ-አፕ ማሳያ (Details Modal) */}
      {showModal && selectedPensioner && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-content">
            <h3 style={{ margin: "0 0 15px 0", color: "#0f172a", borderBottom: "2px solid #e2e8f0", paddingBottom: "10px", fontWeight: "700" }}>
              🔎 ዝርዝር የባዮሜትሪክስ ማመሳከሪያ
            </h3>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "6px", marginBottom: "15px", background: "#f1f5f9", padding: "12px", borderRadius: "8px", fontSize: "14px" }}>
              <p style={{ margin: 0 }}><strong>የጡረተኛው ስም፦</strong> {selectedPensioner.name}</p>
              <p style={{ margin: 0 }}><strong>ፋይዳ ቁጥር፦</strong> {selectedPensioner.faydaNumber}</p>
              <p style={{ margin: 0 }}><strong>ስልክ ቁጥር፦</strong> {selectedPensioner.phone}</p>
            </div>

            {/* 📸 የፎቶዎች ማነጻጸሪያ */}
            <div style={{ display: "flex", gap: "15px", marginBottom: "15px" }}>
              <div style={{ flex: 1, textAlign: "center" }}>
                <p style={{ fontSize: "12px", fontWeight: "bold", color: "#475569", marginBottom: "5px" }}>🪪 ሲስተም/DB ፎቶ</p>
                {selectedPensioner.idPhoto ? (
                  <img src={selectedPensioner.idPhoto} alt="ID" style={{ width: "100%", height: "150px", objectFit: "cover", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
                ) : (
                  <div style={{ height: "150px", display: "flex", alignItems: "center", justifyContent: "center", background: "#cbd5e1", borderRadius: "8px", color: "#64748b" }}>ፎቶ የለም</div>
                )}
              </div>
              <div style={{ flex: 1, textAlign: "center" }}>
                <p style={{ fontSize: "12px", fontWeight: "bold", color: "#475569", marginBottom: "5px" }}>📸 የቀጥታ ሴልፊ (ImgBB)</p>
                {selectedPensioner.selfiePhoto ? (
                  <img src={selectedPensioner.selfiePhoto} alt="Selfie" style={{ width: "100%", height: "150px", objectFit: "cover", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
                ) : (
                  <div style={{ height: "150px", display: "flex", alignItems: "center", justifyContent: "center", background: "#cbd5e1", borderRadius: "8px", color: "#64748b" }}>ሴልፊ የለም</div>
                )}
              </div>
            </div>

            {/* 🤖 የ AI ህያውነት ማረጋገጫ ውጤቶች */}
            <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", marginBottom: "15px", fontSize: "14px", lineHeight: "1.8", border: "1px solid #e2e8f0" }}>
              <div>👤 ፊቱ ተገጣጥሟል? <strong>{selectedPensioner.faceMatched === true || selectedPensioner.faceMatched === "true" ? "✅ አዎ" : "❌ የለም"}</strong></div>
              <div>😊 ፈገግታ አልፏል? <strong>{selectedPensioner.smilePassed === true || selectedPensioner.smilePassed === "true" ? "✅ አዎ" : "❌ የለም"}</strong></div>
              <div>🔄 እንቅስቃሴ አልፏል? <strong>{selectedPensioner.nodPassed === true || selectedPensioner.turnPassed === true || selectedPensioner.nodPassed === "true" ? "✅ አዎ" : "❌ የለም"}</strong></div>
            </div>

            {/* 📝 የማሳሰቢያ መስጫ ሳጥን */}
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", fontSize: "14px" }}>ውድቅ የሚያደርጉ ከሆነ ምክንያቱን ያስቀምጡ፦</label>
              <textarea 
                style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box", fontFamily: "inherit" }} 
                rows="2" 
                placeholder="ምሳሌ፦ 'የቀጥታ ሴልፊው ብዥ ያለ ነው...'"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>

            {/* 🔘 የውሳኔ ቁልፎች */}
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button 
                style={{ background: "#16a34a", color: "#fff", border: "none", padding: "10px 15px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}
                disabled={actionLoading} 
                onClick={() => handleUpdateStatus("Verified")}
              >
                {actionLoading ? "እየቀየረ..." : "🟢 እቀበላለሁ"}
              </button>
              <button 
                style={{ background: "#dc2626", color: "#fff", border: "none", padding: "10px 15px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}
                disabled={actionLoading} 
                onClick={() => handleUpdateStatus("Failed")}
              >
                {actionLoading ? "እየቀየረ..." : "🔴 ውድቅ አድርግ"}
              </button>
              <button 
                style={{ background: "#475569", color: "#fff", border: "none", padding: "10px 15px", borderRadius: "6px", cursor: "pointer" }}
                onClick={() => setShowModal(false)}
              >
                ዝጋ
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Report;
