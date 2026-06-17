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
    const storedUser = localStorage.getItem('fullName') || localStorage.getItem('username') || 'የፖኤሳ ሰራተኛ';
    setCurrentEmployee(storedUser);
  }, []);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData({ ...editData, [name]: value });
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
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
        setRegisteredData({
          ...result.data,
          imageSrc: result.data.photoUrl,
        });
        // 1️⃣ ሳርም ሙሉውን ፊልድ ሞልቶ እንዲያመጣ ሙሉውን ዳታ እዚህ እንሰጠዋለን
        setEditData(result.data);
        setSearchStatus('🎉 የጡረተኛው መረጃ ተገኝቷል!');
      } else {
        setSearchStatus(`❌ ${result.message}`);
      }
    } catch (err) {
      setSearchStatus(`❌ የፍለጋ ስህተት፡ ${err.message}`);
    }
  };

  // 2️⃣ መረጃ ማረሚያ (የባለሙያ ስም እና ሰዓት ጨምሮ)
  const handleUpdate = async (e) => {
    e.preventDefault();
    setSearchStatus('⏳ መረጃው እየታረመ ነው...');
    
    try {
      const response = await fetch(`https://poessa-digital-services-1.onrender.com/api/pensioners/update/${registeredData._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editData, lastEditedBy: currentEmployee }),
      });

      const result = await response.json();
      if (result.success) {
        setRegisteredData({ ...registeredData, ...result.data, imageSrc: result.data.photoUrl });
        setIsEditing(false);
        setSearchStatus('🎉 መረጃው በተሳካ ሁኔታ ታርሟል!');
      } else {
        setSearchStatus(`❌ ስህተት፡ ${result.message}`);
      }
    } catch (err) {
      setSearchStatus(`❌ ማስተካከል አልተቻለም፡ ${err.message}`);
    }
  };

  // 4️⃣ Active / Passive የመቀየሪያ ተግባር (ቀኑን መዝጋቢ)
  const toggleLifeStatus = async (newStatus) => {
    const confirmation = window.confirm(`ይህንን ግለሰብ ሁኔታ ወደ [${newStatus}] ለመቀየር እርግጠኛ ነዎት?`);
    if (!confirmation) return;

    setSearchStatus('⏳ ሁኔታው እየተቀየረ ነው...');
    try {
      const response = await fetch(`https://poessa-digital-services-1.onrender.com/api/pensioners/update/${registeredData._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus, 
          statusChangedDate: new Date(),
          lastEditedBy: currentEmployee 
        }),
      });

      const result = await response.json();
      if (result.success) {
        setRegisteredData({ ...registeredData, ...result.data, imageSrc: result.data.photoUrl });
        setSearchStatus(`🎉 የዜጋው ሁኔታ ወደ ${newStatus} ተቀይሯል!`);
      }
    } catch (err) {
      setSearchStatus(`❌ መቀየር አልተቻለም፡ ${err.message}`);
    }
  };

  // 3️⃣ መረጃ ማጥፊያ (ያጠፋውን ባለሙያና የፋይዳ ቁጥር ሰርቨር ላይ ይልካል)
  const handleDelete = async () => {
    if (!window.confirm("🚨 ይህንን መረጃ ማጥፋት ይፈልጋሉ? የፋይዳ ቁጥሩና ያጠፉት ባለሙያ ስም በታሪክ መዝገብ ላይ ይሰፍራል!")) return;
    try {
      const response = await fetch(`https://poessa-digital-services-1.onrender.com/api/pensioners/delete/${registeredData._id}?employeeName=${currentEmployee}`, { method: 'DELETE' });
      const result = await response.json();
      if (result.success) {
        setRegisteredData(null);
        setSearchStatus(`🗑️ ${result.message}`);
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
          <input type="text" placeholder="የፋይዳ ቁጥር ወይም ስልክ..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ flex: 1, padding: '10px' }} />
          <button type="submit" className="search-submit-btn">ፈልግ</button>
        </form>
        {searchStatus && <p className="status-indicator">{searchStatus}</p>}
      </div>

      {isEditing && (
        <div className="edit-form-section no-print">
          <h3>📝 የጡረተኛ መረጃ ማስተካከያ (በአምራች ባለሙያ፡ {currentEmployee})</h3>
          <form onSubmit={handleUpdate} className="pensioner-form">
            <div className="form-grid">
              <div className="input-group"><label>Pension ID</label><input type="text" name="pensionerId" value={editData.pensionerId || ''} onChange={handleEditChange} required /></div>
              <div className="input-group"><label>ሙሉ ስም</label><input type="text" name="name" value={editData.name || ''} onChange={handleEditChange} required /></div>
              <div className="input-group"><label>ፋይዳ ቁጥር</label><input type="text" name="faydaNumber" value={editData.faydaNumber || ''} onChange={handleEditChange} required /></div>
              <div className="input-group"><label>ቲን ቁጥር (TIN)</label><input type="text" name="tin" value={editData.tin || ''} onChange={handleEditChange} required /></div>
              <div className="input-group"><label>ስልክ ቁጥር</label><input type="tel" name="phone" value={editData.phone || ''} onChange={handleEditChange} required /></div>
              <div className="input-group"><label>ዕድሜ</label><input type="number" name="age" value={editData.age || ''} onChange={handleEditChange} required /></div>
              <div className="input-group">
                <label>ጾታ</label>
                <select name="gender" value={editData.gender || ''} onChange={handleEditChange}>
                  <option value="Male">ወንድ</option>
                  <option value="Female">ሴት</option>
                </select>
              </div>
              <div className="input-group"><label>አድራሻ</label><input type="text" name="address" value={editData.address || ''} onChange={handleEditChange} required /></div>
              <div className="input-group"><label>የጡረታ አበል</label><input type="number" name="pensionAmount" value={editData.pensionAmount || ''} onChange={handleEditChange} required /></div>
              <div className="input-group"><label>የባንክ ስም</label><input type="text" name="bankName" value={editData.bankName || ''} onChange={handleEditChange} /></div>
              <div className="input-group"><label>የቅርንጫፍ ስም</label><input type="text" name="bankBranch" value={editData.bankBranch || ''} onChange={handleEditChange} /></div>
              <div className="input-group"><label>የፖኤሳ ቅርንጫፍ</label><input type="text" name="poessaBranch" value={editData.poessaBranch || ''} onChange={handleEditChange} /></div>
              <div className="input-group"><label>የተሰጠበት ቀን</label><input type="date" name="issueDate" value={editData.issueDate ? editData.issueDate.substring(0,10) : ''} onChange={handleEditChange} /></div>
              <div className="input-group"><label>የማብቂያ ቀን</label><input type="date" name="expiryDate" value={editData.expiryDate ? editData.expiryDate.substring(0,10) : ''} onChange={handleEditChange} /></div>
            </div>
            
            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
              <button type="submit" className="save-btn">ለውጦችን አስቀምጥ</button>
              <button type="button" onClick={() => setIsEditing(false)} className="cancel-btn">አንሳ</button>
            </div>
          </form>
        </div>
      )}

      {registeredData && !isEditing && (
        <div className="id-card-wrapper-section">
          {/* መቆጣጠሪያ ቁልፎች */}
          <div className="admin-actions no-print" style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <button onClick={() => setIsEditing(true)} className="edit-action-btn">📝 አርም</button>
            
            {/* 4️⃣ Active / Passive መቆጣጠሪያ */}
            {registeredData.status === 'Passive' ? (
              <button onClick={() => toggleLifeStatus('Active')} className="status-active-btn" style={{ backgroundColor: '#28a745', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>💚 ወደ Active ቀይር</button>
            ) : (
              <button onClick={() => toggleLifeStatus('Passive')} className="status-passive-btn" style={{ backgroundColor: '#dc3545', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>💀 ወደ Passive ቀይር (አርፏል)</button>
            )}
            
            <button onClick={handleDelete} className="delete-action-btn">🗑️ አጥፋ</button>
          </div>

          {/* 5️⃣ የላቀ ውበት የተሰጠው ዲጂታል መታወቂያ */}
          <div className={`id-card ${registeredData.status === 'Passive' ? 'pensioner-dead' : ''}`} id="pensioner-id-card">
            
            {/* የኢትዮጵያ ሰንደቅ አላማ ግራዲየንት በላዩ ላይ ይኖረዋል */}
            <div className="id-card-top-flag-line"></div>
            
            <div className="id-card-header">
              <div className="logo-placeholder">🇪🇹</div>
              <div className="header-titles">
                <h3>POESSA DIGITAL ID CARD</h3>
                <p>የፌዴራል የጡረታና ማህበራዊ ዋስትና ኤጀንሲ</p>
              </div>
              <div className={`status-badge-view ${registeredData.status === 'Passive' ? 'badge-passive' : 'badge-active'}`}>
                {registeredData.status === 'Passive' ? "PASSIVE" : "ACTIVE"}
              </div>
            </div>

            <div className="id-card-body">
              <div className="id-photo-zone">
                <img 
                  src={registeredData.imageSrc || "https://via.placeholder.com/150?text=No+Photo"} 
                  alt="Pensioner" 
                  className="id-pensioner-img" 
                />
                <div className="id-dates-box">
                  <p><strong>የተሰጠበት:</strong> {registeredData.issueDate ? registeredData.issueDate.substring(0,10) : 'N/A'}</p>
                  <p><strong>የሚያበቃው:</strong> {registeredData.expiryDate ? registeredData.expiryDate.substring(0,10) : 'N/A'}</p>
                </div>
              </div>

              <div className="id-details-zone">
                <p><span className="lbl">ስም / Name:</span> <span className="val-name">{registeredData.name}</span></p>
                <p><span className="lbl">ፋይዳ / FAYDA:</span> <span className="val">{registeredData.faydaNumber}</span></p>
                <p><span className="lbl">ቲን / TIN:</span> <span className="val">{registeredData.tin || 'N/A'}</span></p> 
                <p><span className="lbl">ስልክ / Phone:</span> <span className="val">{registeredData.phone}</span></p>
                <p><span className="lbl">አድራሻ / Address:</span> <span className="val">{registeredData.address}</span></p>
                <p><span className="lbl">ቅርንጫፍ / Branch:</span> <span className="val">{registeredData.poessaBranch || 'ዋናው ቅርንጫፍ'}</span></p>
                {registeredData.status === 'Passive' && registeredData.statusChangedDate && (
                  <p style={{ color: '#dc3545', fontSize: '11px', fontWeight: 'bold' }}>የሞት መዝገብ የሰፈረበት፡ {new Date(registeredData.statusChangedDate).toLocaleDateString('et-ET')}</p>
                )}
              </div>

              {/* 5️⃣ QR Code ስካን ሲደረግ በቀጥታ ወደዚህ መታወቂያ ሊንክ ይመራል */}
              <div className="id-qr-zone">
                <QRCodeSVG 
                  value={window.location.href + `?query=${registeredData.faydaNumber}`} 
                  size={95} 
                  level={"H"}
                  includeMargin={true}
                />
                <span className="qr-label">SCAN TO VERIFY</span>
              </div>
            </div>

            <div className="id-card-signature-area">
              <div className="sig-block"><p className="sig-line">____________________</p><p>የባለሙያ ፊርማ</p></div>
              <div className="sig-block"><p className="sig-line">Official Digital Stamp</p></div>
            </div>

            <div className="id-card-footer">
              <p>የሀገር ባለውለታዎችን በክብር እናገለግላለን! | POESSA 2026</p>
            </div>
          </div>

          <button onClick={() => window.print()} className="print-btn no-print">🖨️ መታወቂያውን አትም (Print ID)</button>
        </div>
      )}
    </div>
  );
}

export default IdCardGenerationAndSearch;
