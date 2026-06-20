import React, { useState, useEffect } from "react";
import axios from "axios";
import "../Verification.css"; // የ CSS ስታይሉን እንዲጠቀም

function Report() {
  const [pensioners, setPensioners] = useState([]);
  const [filter, setFilter] = useState("All"); 
  const [selectedPensioner, setSelectedPensioner] = useState(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPensioners();
  }, []);

  const fetchPensioners = async () => {
    setLoading(true);
    try {
      // ሁሉንም የተመዘገቡ ጡረተኞች ዝርዝር የሚያመጣ API
      const res = await axios.get("https://poessa-digital-services-1.onrender.com/api/pensioners");
      if (res.data) setPensioners(res.data);
    } catch (err) {
      console.error("ዳታ መጫን አልተቻለም", err);
    } finally {
      setLoading(false);
    }
  };

  // ሁኔታን የማሻሻያ (Verify / Reject) ፈንክሽን
  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await axios.put(`https://poessa-digital-services-1.onrender.com/api/pensioners/${id}`, {
        verificationStatus: newStatus,
        comment: comment
      });
      alert(`የማረጋገጫ ሁኔታው በተሳካ ሁኔታ ወደ ${newStatus} ተቀይሯል!`);
      setSelectedPensioner(null);
      setComment("");
      fetchPensioners(); // ሰንጠረዡን በቅጽበት ማደስ
    } catch (err) {
      alert("ሁኔታውን ማዘመን አልተቻለም።");
    }
  };

  // 📊 የማጣሪያ (Filter) ሎጂክ
  const filteredData = pensioners.filter(p => {
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
      <h2 style={{ color: "#162447", borderBottom: "2px solid #e2e8f0", paddingBottom: "10px" }}>
        📊 POESSA የጡረተኞች ማረጋገጫ ሪፖርት እና መቆጣጠሪያ
      </h2>
      
      {/* 📊 የሪፖርት ማጠቃለያ ካርዶች */}
      <div className="admin-summary-grid">
        <div className="summary-card total">
          <h3>{pensioners.length}</h3> 
          <p>ጠቅላላ የገቡ</p>
        </div>
        <div className="summary-card pending">
          <h3>{pensioners.filter(p => !p.verificationStatus || p.verificationStatus === "Pending").length}</h3> 
          <p>በሂደት ላይ ያሉ (Pending)</p>
        </div>
        <div className="summary-card verified">
          <h3>{pensioners.filter(p => p.verificationStatus === "Verified").length}</h3> 
          <p>የጸደቁ (Verified)</p>
        </div>
        <div className="summary-card rejected">
          <h3>{pensioners.filter(p => p.verificationStatus === "Rejected").length}</h3> 
          <p>ውድቅ የተደረጉ (Rejected)</p>
        </div>
      </div>

      {/* ⚙️ ማጣሪያ እና ሪፖርት ማውጫ */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <label style={{ fontWeight: "bold", marginRight: "10px", color: "#334155" }}>መረጃዎችን ለይቶ ማሳያ፦ </label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#fff", fontSize: "14px" }}>
            <option value="All">ሁሉንም አሳይ</option>
            <option value="Pending">በሂደት ላይ ያሉ (Pending)</option>
            <option value="Verified">የተረጋገጡ (Verified)</option>
            <option value="Rejected">ውድቅ የተደረጉ (Rejected)</option>
          </select>
        </div>
        <button onClick={handlePrintReport} style={{ background: "#2563eb", color: "#fff", padding: "10px 20px", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "14px" }}>
          🖨️ የሪፖርት ማጠቃለያ / Print አውጣ
        </button>
      </div>

      {/* 📝 የጡረተኞች መረጃ ሰንጠረዥ */}
      <div className="admin-table-container">
        <table className="admin-data-table">
          <thead>
            <tr>
              <th>የፋይዳ ቁጥር</th>
              <th>የጡረተኛው ሙሉ ስም</th>
              <th>የማረጋገጫ ሁኔታ</th>
              <th style={{ textAlign: "center" }}>ድርጊት</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="4" style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>መረጃዎች በመጫን ላይ ናቸው...</td></tr>
            ) : filteredData.length === 0 ? (
              <tr><td colSpan="4" style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>ምንም የተመዘገበ መረጃ አልተገኘም።</td></tr>
            ) : (
              filteredData.map(p => (
                <tr key={p._id}>
                  <td style={{ fontWeight: "bold" }}>{p.faydaNumber || p.fayda}</td>
                  <td>{p.name || "Mamaru Anmaw"}</td>
                  <td>
                    <span style={{ padding: "6px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold", 
                      background: (p.verificationStatus === "Verified") ? "#dcfce7" : (p.verificationStatus === "Rejected") ? "#fee2e2" : "#fef9c3", 
                      color: (p.verificationStatus === "Verified") ? "#16a34a" : (p.verificationStatus === "Rejected") ? "#dc2626" : "#ca8a04" 
                    }}>
                      {p.verificationStatus || "Pending"}
                    </span>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <button onClick={() => setSelectedPensioner(p)} style={{ background: "#162447", color: "#fff", border: "none", padding: "6px 14px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "13px" }}>🔍 መረጃውን መርምር</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 🔍 የፎቶዎች ማነጻጸሪያ እና ውሳኔ መስጫ መስኮት (Modal Pop-up) */}
      {selectedPensioner && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-content">
            <h3 style={{ margin: "0 0 20px 0", color: "#162447", borderBottom: "1px solid #e2e8f0", paddingBottom: "10px" }}>🔎 ዝርዝር የባዮሜትሪክስ ማነጻጸሪያ</h3>
            
            <p style={{ margin: "5px 0" }}><strong>የጡረተኛው ስም፦</strong> {selectedPensioner.name || "Mamaru Anmaw"}</p>
            <p style={{ margin: "5px 0" }}><strong>ፋይዳ ቁጥር፦</strong> {selectedPensioner.faydaNumber || selectedPensioner.fayda}</p>
            
            {/* 📸 የፎቶዎች ጎን ለጎን ማነጻጸሪያ ክፍል */}
            <div style={{ display: "flex", gap: "20px", margin: "20px 0", justifyContent: "center" }}>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: "12px", fontWeight: "bold", color: "#64748b", marginBottom: "5px" }}>የሲስተም/DB ፎቶ</p>
                <img src={selectedPensioner.dbPhotoUrl || selectedPensioner.photo} alt="Database" style={{ width: "150px", height: "150px", objectFit: "cover", borderRadius: "8px", border: "2px solid #cbd5e1" }} />
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: "12px", fontWeight: "bold", color: "#64748b", marginBottom: "5px" }}>የቀጥታ ሴልፊ ፎቶ</p>
                <img src={selectedPensioner.selfiePhoto} alt="Live Selfie" style={{ width: "150px", height: "150px", objectFit: "cover", borderRadius: "8px", border: "2px solid #3b82f6" }} />
              </div>
            </div>

            {/* 📝 የማሳሰቢያ ጽሑፍ ሳጥን */}
            <label style={{ fontWeight: "bold", display: "block", marginBottom: "8px", color: "#334155", fontSize: "14px" }}>ውድቅ የሚያደርጉ ከሆነ ለጡረተኛው የሚላክ ማሳሰቢያ፦</label>
            <textarea 
              value={comment} 
              onChange={(e) => setComment(e.target.value)} 
              placeholder="ለምሳሌ፦ 'የቀጥታ ሴልፊው ላይ ፊትዎ በደንብ አይታይም...'"
              style={{ width: "100%", height: "80px", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box", fontSize: "14px", outline: "none", resize: "none" }}
            />

            {/* 🟢 🔴 የውሳኔ በተኖች */}
            <div style={{ display: "flex", gap: "12px", marginTop: "25px" }}>
              <button onClick={() => handleStatusUpdate(selectedPensioner._id, "Verified")} style={{ flex: 1, background: "#22c55e", color: "#fff", padding: "12px", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "14px" }}>🟢 አጽድቅ (Verify)</button>
              <button onClick={() => handleStatusUpdate(selectedPensioner._id, "Rejected")} style={{ flex: 1, background: "#dc2626", color: "#fff", padding: "12px", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "14px" }}>🔴 ውድቅ አድርግ (Reject)</button>
            </div>
            
            <button onClick={() => { setSelectedPensioner(null); setComment(""); }} style={{ width: "100%", background: "#e2e8f0", color: "#475569", padding: "10px", border: "none", borderRadius: "8px", marginTop: "12px", cursor: "pointer", fontWeight: "bold" }}>ዝጋ</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Report;
