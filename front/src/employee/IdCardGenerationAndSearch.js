import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import './IdCardGenerationAndSearch.css';

function IdCardGenerationAndSearch() {
  const navigate = useNavigate();
  const [currentEmployee, setCurrentEmployee] = useState('የፖኤሳ ሰራተኛ');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchStatus, setSearchStatus] = useState('');
  const [registeredData, setRegisteredData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    const storedUser = localStorage.getItem('user') || localStorage.getItem('username') || 'የፖኤሳ ሰራተኛ';
    setCurrentEmployee(storedUser);
  }, []);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData({ ...editData, [name]: value });
  };

const handleSearch = async (e) => {
  e.preventDefault();
  if (!searchQuery) {
    setSearchStatus('⚠️ እባክዎ መፈለጊያ ቁጥር ያስገቡ!');
    return;
  }
  setSearchStatus('በመፈለግ ላይ...');
  setRegisteredData(null);
  setIsEditing(false);

  try {
    const response = await fetch(`https://poessa-digital-services-1.onrender.com/api/pensioners/search?query=${searchQuery}`);
    const result = await response.json();

    if (result.success) {
      // ከሰርቨር የመጣውን መረጃ ሙሉ በሙሉ መቅረጽ
      setRegisteredData({
        _id: result.data._id,
        pensionerId: result.data.pensionerId,
        name: result.data.name,
        faydaNumber: result.data.faydaNumber,
        poessaBranch: result.data.poessaBranch,
        bankName: result.data.bankName,
        bankBranch: result.data.bankBranch,
        tin: result.data.tin,
        age: result.data.age,
        gender: result.data.gender,
        pensionAmount: result.data.pensionAmount,
        phone: result.data.phone,
        address: result.data.address,
        issueDate: result.data.issueDate,
        expiryDate: result.data.expiryDate,
        imageSrc: result.data.photoUrl,
        // ኦዲት መረጃዎች (ከሰርቨር ካልመጡ ነባሪ ዋጋ ይኖራቸዋል)
        registeredBy: result.data.registeredBy || 'Unknown',
        lastEditedBy: result.data.lastEditedBy || 'None',
        lastAction: result.data.lastAction || 'Created',
        lastActionTime: result.data.lastActionTime || new Date().toISOString()
      });
      setEditData(result.data);
      setSearchStatus('🎉 የጡረተኛው ሙሉ መረጃ ተገኝቷል!');
    } else {
      setSearchStatus(`❌ ${result.message}`);
    }
  } catch (err) {
    setSearchStatus(`❌ የፍለጋ ስህተት፡ ${err.message}`);
  }
};

const handleUpdate = async (e) => {
    e.preventDefault();
    setSearchStatus('⏳ መረጃው እየታረመ ነው...');
    
    // የሰራተኛውን ስም ከLocalStorage ማምጣት
    const employeeName = localStorage.getItem('fullName') || localStorage.getItem('username') || 'ያልታወቀ ሰራተኛ';

    try {
      const response = await fetch(`https://poessa-digital-services-1.onrender.com/api/pensioners/update/${registeredData._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...editData, 
          age: editData.age ? Number(editData.age) : 0,
          pensionAmount: editData.pensionAmount ? Number(editData.pensionAmount) : 0,
          // አዲሱ የAudit Log መረጃዎች
          lastEditedBy: employeeName,
          lastAction: 'Updated',
          lastActionTime: new Date().toISOString()
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // የFrontend መረጃን ማዘመን
        setRegisteredData({ 
          ...registeredData, 
          ...result.data, 
          imageSrc: result.data.photoUrl,
          lastEditedBy: employeeName,
          lastAction: 'Updated',
          lastActionTime: new Date().toISOString()
        });
        setIsEditing(false);
        setSearchStatus(`🎉 መረጃው በ "${employeeName}" በተሳካ ሁኔታ ታርሟል!`);
      } else {
        setSearchStatus(`❌ ስህተት፡ ${result.message}`);
      }
    } catch (err) {
      setSearchStatus(`❌ ማስተካከል አልተቻለም፡ ${err.message}`);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("🚨 ይህንን መረጃ ከሲስተም ማጥፋት ይፈልጋሉ?")) return;
    try {
      const response = await fetch(`https://poessa-digital-services-1.onrender.com/api/pensioners/delete/${registeredData._id}?employeeName=${currentEmployee}`, { method: 'DELETE' });
      const result = await response.json();
      if (result.success) {
        setRegisteredData(null);
        setSearchQuery('');
        setSearchStatus(`🗑️ ${result.message}`);
      } else {
        setSearchStatus(`❌ ስህተት፡ ${result.message}`);
      }
    } catch (err) {
      setSearchStatus(`❌ ማጥፋት አልተቻለም፡ ${err.message}`);
    }
  };

  return (
    <div className="id-generation-page-container">
      

      <div className="search-section no-print">
        <h3>🔍 የጡረተኛ መረጃ ማኔጅመንት እና መታወቂያ ማውጫ</h3>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
          <input type="text" placeholder="የፋይዳ ቁጥር ወይም ስልክ ያስገቡ..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e0' }} />
          <button type="submit" className="search-submit-btn">ፈልግ</button>
        </form>
        {searchStatus && <p className="status-indicator">{searchStatus}</p>}
      </div>

      {isEditing && (
        <div className="edit-form-section no-print">
          <h3>📝 የተሳሳተ መረጃ ማስተካከያ ፎርም</h3>
          <form onSubmit={handleUpdate} className="pensioner-form">
            <div className="form-grid">
              <div className="input-group"><label>ሙሉ ስም</label><input type="text" name="name" value={editData.name || ''} onChange={handleEditChange} required /></div>
              <div className="input-group"><label>ስልክ ቁጥር</label><input type="tel" name="phone" value={editData.phone || ''} onChange={handleEditChange} required /></div>
              <div className="input-group"><label>አድራሻ</label><input type="text" name="address" value={editData.address || ''} onChange={handleEditChange} required /></div>
              <div className="input-group"><label>የባንክ ስም</label><input type="text" name="bankName" value={editData.bankName || ''} onChange={handleEditChange} required /></div>
              <div className="input-group"><label>የጡረታ አበል</label><input type="number" name="pensionAmount" value={editData.pensionAmount || ''} onChange={handleEditChange} required /></div>
              <div className="input-group"><label>የማብቂያ ጊዜ</label><input type="date" name="expiryDate" value={editData.expiryDate || ''} onChange={handleEditChange} required /></div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <button type="submit" className="save-btn">ለውጦችን አስቀምጥ</button>
              <button type="button" onClick={() => setIsEditing(false)} className="cancel-btn">አንሳ</button>
            </div>
          </form>
        </div>
      )}

      {registeredData && !isEditing && (
        <div className="id-card-wrapper-section">
          <div className="admin-actions no-print">
            <button onClick={() => setIsEditing(true)} className="edit-action-btn">📝 መረጃውን አርም</button>
            <button onClick={handleDelete} className="delete-action-btn">🗑️ ሙሉ በሙሉ አጥፋ</button>
        <div className="audit-log-box" style={{ 
      marginTop: '20px', 
      padding: '15px', 
      backgroundColor: '#f8fafc', 
      borderRadius: '8px',
      borderLeft: '4px solid #3182ce',
      textAlign: 'left'
    }}>
      <h4 style={{ marginBottom: '10px' }}>የመረጃ ታሪክ (Audit Log)</h4>
      <p><strong>የመጀመሪያ ምዝገባ በ:</strong> {registeredData.registeredBy}</p>
      <p><strong>መጨረሻ የተቀየረው በ:</strong> {registeredData.lastEditedBy}</p>
      <p><strong>የመጨረሻ ድርጊት:</strong> {registeredData.lastAction}</p>
      <p><strong>ሰዓት:</strong> {new Date(registeredData.lastActionTime).toLocaleString('am-ET')}</p>
    </div>
          </div>

          <div className="id-card" id="pensioner-id-card">
            <div className="id-card-header"><h3>POESSA DIGITAL ID</h3><p>የግል ድርግት ሰራተኞች ማህበራዊ ዋስትና አስተዳደር</p></div>
            <div className="id-card-body">
              <div className="id-photo-zone">
                <img src={registeredData.imageSrc} alt="Pensioner" className="id-pensioner-img" />
                <p className="id-num">{registeredData.pensionerId}</p>
              </div>
              <div className="id-details-zone">
                <p><strong>ስም:</strong> {registeredData.name}</p>
                <p><strong>FAYDA No:</strong> {registeredData.faydaNumber}</p>
                <p><strong>ስልክ ቁጥር:</strong> {registeredData.phone}</p>
                <p><strong>ቅርንጫፍ:</strong> {registeredData.poessaBranch}</p>
                <p style={{fontSize: '11px', marginTop: '5px'}}><strong>የተሰጠበት ቀን:</strong> {registeredData.issueDate}</p>
                <p style={{fontSize: '11px', color: 'red'}}><strong>የማብቂያ ጊዜ:</strong> {registeredData.expiryDate}</p>
              </div>
              <div className="id-qr-zone">
                <QRCodeSVG value={JSON.stringify({ id: registeredData.pensionerId, fayda: registeredData.faydaNumber, name: registeredData.name })} size={90} level={"M"} />
                <span className="qr-label">SCAN TO VERIFY</span>
              </div>
            </div>
            <div className="id-card-footer"><p>ያገለገሉ ዜጎችን በማገልገላችን ኩራት ይሰማናል</p></div>
          </div>
          <button onClick={() => window.print()} className="print-btn no-print">🖨️ መታወቂያውን አትም (Print ID)</button>
        </div>
      )}
    </div>
  );
}

export default IdCardGenerationAndSearch;
