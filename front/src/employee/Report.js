import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Report.css";

const API_URL = "https://poessa-digital-services-1.onrender.com";

function Report() {
  const [pensioners, setPensioners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("All"); 
  const [selectedPensioner, setSelectedPensioner] = useState(null);
  const [comment, setComment] = useState("");

  useEffect(() => {
    fetchReportData();
  }, []);

  // 🔄 ሁሉንም የጡረተኞች መረጃ ከነ ባዮሜትሪክስ ሁኔታቸው አንድ ላይ የሚያመጣ ፈንክሽን
  const fetchReportData = async () => {
    setLoading(true);
    try {
      // ማሳሰቢያ፡ ሰርቨርህ ላይ የ UserPensioner ዝርዝርን የሚያመጣውን endpoint እዚህ ጥራ
      const res = await axios.get(`${API_URL}/api/pensioners`);
      
      // ከቤክኤንድ የሚመጣው ዳታ { success: true, data: [...] } ከሆነ ወይም ቀጥታ አሬይ ከሆነ ለመቀበል
      const data = res.data.data || res.data;
      if (Array.isArray(data)) {
        setPensioners(data);
      }
    } catch (err) {
      console.error("የሪፖርት ዳታ መጫን አልተቻለም፦", err);
    } finally {
      setLoading(false);
    }
  };

  // 🟢 🔴 የማረጋገጫ ሁኔታን ማሻሻያ (Verify / Failed) ፈንክሽን 
  // (ከ LivenessVerification Schema የ "verificationStatus" enum ጋር የተጣጣመ)
  const handleStatusUpdate = async (faydaNumber, newStatus) => {
    try {
      // በፋይዳ ቁጥር አማካኝነት የባዮሜትሪክስ ሁኔታን ለማዘመን ወደ ቤክኤንድ PUT ማድረግ
      await axios.put(`${API_URL}/api/pensioners/verify-status/${faydaNumber}`, {
        verificationStatus: newStatus,
        comment: comment
      });
      
      alert(`የማረጋገጫ ሁኔታው በተሳካ ሁኔታ ወደ ${newStatus} ተቀይሯል!`);
      setSelectedPensioner(null);
      setComment("");
      fetchReportData(); // ሰንጠረዡን በቅጽበት ማደስ
    } catch (err) {
      console.error(err);
      alert("ሁኔታውን ማዘመን አልተቻለም። እባክዎ የቤክኤንድ መስመርዎን ያረጋግጡ።");
    }
  };

  // 📊 የማጣሪያ (Filter) ሎጂክ - ከ LivenessVerification የ "verificationStatus" ጋር ይገናኛል
  const filteredData = pensioners.filter((p) => {
    // በስኬማው መሠረት ከሌለ ወደ "Pending" ይቀየራል
    const status = p.verificationStatus || "Pending"; 
    if (filter === "All") return true;
    return status === filter;
  });

  // 🖨️ የሪፖርት ማተሚያ / PDF ማውጫ
  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="admin-dashboard-wrapper">
      <h2 style={{ color: "#162447", borderBottom: "2px solid #e2e8f0", paddingBottom: "10px", display: "flex", alignItems: "center", gap: "10px" }}>
        📊 POESSA የጡረተኞች ማረጋገጫ ሪፖርት ማውጫ
      </h2>
      
      {/* 📊 የሪፖርት ማጠቃለያ ካርዶች (ልክ እንደ ምስሉ ዲዛይን) */}
      <div className="admin-summary-grid">
        <div className="summary-card total">
          <h3>{pensioners.length}</h3> 
          <p>ጠቅላላ የገቡ</p>
        </div>
        <div className="summary-card pending">
          <h3>{pensioners.filter(p => !p.verificationStatus || p.verificationStatus === "Pending").length}</h3> 
          <p>በሂደት ላይ ያሉ</p>
        </div>
        <div className="summary-card verified">
          <h3>{pensioners.filter(p => p.verificationStatus === "Verified").length}</h3> 
          <p>የተረጋገጡ</p>
        </div>
        <div className="summary-card rejected">
          <h3>{pensioners.filter(p => p.verificationStatus === "Failed").length}</h3> 
          <p>ውድቅ የተደረጉ</p>
        </div>
      </div>

      {/* ⚙️ ማጣሪያ እና ሪፖርት ማውጫ ሰሌዳ */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }} className="no-print">
        <div>
          <label style={{ fontWeight: "bold", marginRight: "10px", color: "#334155" }}>መረጃዎችን ለይቶ ማሳያ፦ </label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#fff", fontSize: "14px" }}>
            <option value="All">ሁሉንም አሳይ</option>
            <option value="Pending">በሂደት ላይ ያሉ (Pending)</option>
            <option value="Verified">የተረጋገጡ (Verified)</option>
            <option value="Failed">ውድቅ የተደረጉ (Failed)</option>
          </select>
        </div>
        <button onClick={handlePrintReport} style={{ background: "#2563eb", color: "#fff", padding: "10px 20px", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "14px" }}>
          🖨️ የሪፖርት ማጠቃለያ / Print አውጣ
        </button>
      </div>

      {/* 📝 የጡረተኞች መረጃ ሰንጠረዥ (UserPensioner ፊልዶችን ይጠቀማል) */}
      <div className="admin-table-container">
        <table className="admin-data-table">
          <thead>
            <tr>
              <th>የፋይዳ ቁጥር</th>
              <th>የጡረተኛው ሙሉ ስም</th>
              <th>የማረጋገጫ ሁኔታ</th>
              <th style={{ textAlign: "center" }} className="no-print">ድርጊት</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="4" style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>መረጃዎች በመጫን ላይ ናቸው...</td></tr>
            ) : filteredData.length === 0 ? (
              <tr><td colSpan="4" style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>ምንም የተመዘገበ መረጃ አልተገኘም።</td></tr>
            ) : (
              filteredData.map((p) => (
                <tr key={p._id}>
                  <td style={{ fontWeight: "bold" }}>{p.faydaNumber}</td>
                  {/* በአወቃቀሩ መሠረት የአማርኛ ስም ካለ እሱን ካልሆነ የእንግሊዝኛውን ስም ያሳያል */}
                  <td>{p.nameAmh || p.nameEng || "ስም አልተጠቀሰም"}</td>
                  <td>
                    <span style={{ 
                      padding: "6px 12px", 
                      borderRadius: "20px", 
                      fontSize: "12px", 
                      fontWeight: "bold", 
                      background: (p.verificationStatus === "Verified") ? "#dcfce7" : (p.verificationStatus === "Failed") ? "#fee2e2" : "#fef9c3", 
                      color: (p.verificationStatus === "Verified") ? "#16a34a" : (p.verificationStatus === "Failed") ? "#dc2626" : "#ca8a04" 
                    }}>
                      {p.verificationStatus || "Pending"}
                    </span>
                  </td>
                  <td style={{ textAlign: "center" }} className="no-print">
                    <button onClick={() => setSelectedPensioner(p)} style={{ background: "#162447", color: "#fff", border: "none", padding: "6px 14px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "13px" }}>
                      🔍 መረጃውን መርምር
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 🔍 የባዮሜትሪክስ ፎቶዎች ማነጻጸሪያ እና ውሳኔ መስጫ መስኮት (Modal Pop-up) */}
      {selectedPensioner && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-content">
            <h3 style={{ margin: "0 0 20px 0", color: "#162447", borderBottom: "1px solid #e2e8f0", paddingBottom: "10px" }}>🔎 ዝርዝር የባዮሜትሪክስ ማነጻጸሪያ</h3>
            
            <p style={{ margin: "5px 0" }}><strong>የጡረተኛው ስም፦</strong> {selectedPensioner.nameAmh || selectedPensioner.nameEng}</p>
            <p style={{ margin: "5px 0" }}><strong>ፋይዳ ቁጥር፦</strong> {selectedPensioner.faydaNumber}</p>
            <p style={{ margin: "5px 0" }}><strong>ስልክ ቁጥር፦</strong> {selectedPensioner.phone}</p>
            
            {/* 📸 የፎቶዎች ጎን ለጎን ማነጻጸሪያ (የምዝገባ photoUrl እና የባዮሜትሪክስ selfiePhoto) */}
            <div style={{ display: "flex", gap: "20px", margin: "20px 0", justifyContent: "center" }}>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: "12px", fontWeight: "bold", color: "#64748b", marginBottom: "5px" }}>የሲስተም/DB ፎቶ</p>
                <img src={selectedPensioner.photoUrl || "https://via.placeholder.com/150"} alt="Database" style={{ width: "150px", height: "150px", objectFit: "cover", borderRadius: "8px", border: "2px solid #cbd5e1" }} />
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: "12px", fontWeight: "bold", color: "#64748b", marginBottom: "5px" }}>የቀጥታ ሴልፊ ፎቶ</p>
                <img src={selectedPensioner.selfiePhoto || "https://via.placeholder.com/150"} alt="Live Selfie" style={{ width: "150px", height: "150px", objectFit: "cover", borderRadius: "8px", border: "2px solid #3b82f6" }} />
              </div>
            </div>

            {/* የባዮሜትሪክስ ቼኮች ዝርዝር ሁኔታ */}
            <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "6px", marginBottom: "15px", fontSize: "13px" }}>
              <div>👤 ፊቱ ተገጣጥሟል? <strong>{selectedPensioner.faceMatched ? "✅ አዎ" : "❌ የለም"}</strong></div>
              <div>😊 ፈገግታ አልፏል? <strong>{selectedPensioner.smilePassed ? "✅ አዎ" : "❌ የለም"}</strong></div>
              <div>🔄 ራስ ማዞር አልፏል? <strong>{selectedPensioner.turnPassed ? "✅ አዎ" : "❌ የለም"}</strong></div>
            </div>

            {/* 📝 የማሳሰቢያ ጽሑፍ ሳጥን */}
            <label style={{ fontWeight: "bold", display: "block", marginBottom: "8px", color: "#334155", fontSize: "14px" }}>ውድቅ የሚያደርጉ ከሆነ የሚጻፍ ማሳሰቢያ፦</label>
            <textarea 
              value={comment} 
              onChange={(e) => setComment(e.target.value)} 
              placeholder="ለምሳሌ፦ 'የቀጥታ ሴልፊው ላይ ፊትዎ ግልጽ አይደለም...'"
              style={{ width: "100%", height: "80px", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box", fontSize: "14px", outline: "none", resize: "none" }}
            />

            {/* 🟢 🔴 የውሳኔ በተኖች */}
            <div style={{ display: "flex", gap: "12px", marginTop: "25px" }}>
              <button onClick={() => handleStatusUpdate(selectedPensioner.faydaNumber, "Verified")} style={{ flex: 1, background: "#22c55e", color: "#fff", padding: "12px", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "14px" }}>🟢 አጽድቅ (Verify)</button>
              <button onClick={() => handleStatusUpdate(selectedPensioner.faydaNumber, "Failed")} style={{ flex: 1, background: "#dc2626", color: "#fff", padding: "12px", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "14px" }}>🔴 ውድቅ አድርግ (Failed)</button>
            </div>
            
            <button onClick={() => { setSelectedPensioner(null); setComment(""); }} style={{ width: "100%", background: "#e2e8f0", color: "#475569", padding: "10px", border: "none", borderRadius: "8px", marginTop: "12px", cursor: "pointer", fontWeight: "bold" }}>ዝጋ</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Report;
