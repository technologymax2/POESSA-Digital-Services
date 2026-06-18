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
  const [deletedLogs, setDeletedLogs] = useState([]);
  
  // 🔥 ለቫሊዴሽን ስህተቶች መልዕክት ማስቀመጫ ስቴት
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    const storedUser = localStorage.getItem('fullName') || localStorage.getItem('username') || 'የፖኤሳ ሰራተኛ';
    setCurrentEmployee(storedUser);
    fetchDeletedLogs();
  }, []);

  const fetchDeletedLogs = async () => {
    try {
      const response = await fetch('https://poessa-digital-services-1.onrender.com/api/pensioners/deleted-logs');
      const result = await response.json();
      if (result.success) setDeletedLogs(result.data);
    } catch (err) {
      console.error("የጠፉ መረጃዎችን ታሪክ ማምጣት አልተቻለም፦", err.message);
    }
  };

  // 🔥 ሪል-ታይም ቫሊዴሽን የሚሰራው የ input መቀየሪያ
  const handleEditChange = (e) => {
  const { name, value } = e.target;
  let errors = { ...validationErrors };
  
  // ቁጥር ብቻ መሆን ያለባቸው ፊልዶች
  if (['pensionerId', 'phone', 'tin'].includes(name)) {
    // ከቁጥር ውጪ ያሉትን ፊደላት በሙሉ ያጠፋል
    let cleanValue = value.replace(/\D/g, ''); 

    // 📱 ለስልክ ቁጥር ልዩ ህግ፡ መጀመሪያ የሚገባው ቁጥር 0 መሆን አለበት
    if (name === 'phone' && cleanValue.length > 0 && cleanValue[0] !== '0') {
      errors[name] = "⚠️ ስልክ ቁጥር በ '0' መጀመር አለበት!";
      // በ '0' ካልጀመረ መረጃውን ወደ ስቴት አያስገባውም (ተጠቃሚው እንዳይሳሳት ይከለክለዋል)
      setValidationErrors(errors);
      return; 
    }

    // 🛑 ቁልፍ ህግ፡ ከ10 ዲጂት በላይ እንዳይሄድ መገደብ (Max Length = 10)
    if (cleanValue.length > 10) {
      cleanValue = cleanValue.substring(0, 10);
    }

    // የዲጂት ብዛት ማረጋገጫ (ልክ 10 መሆኑን ቼክ ያደርጋል)
    if (cleanValue.length > 0 && cleanValue.length < 10) {
      errors[name] = `⚠️ ልክ 10 ዲጂት መሆን አለበት! (አሁን፡ ${cleanValue.length})`;
    } else {
      delete errors[name]; // ልክ 10 ሲሞላ ስህተቱን ያጠፋል
    }

    setEditData({ ...editData, [name]: cleanValue });
  } else {
    // ለሌሎች መደበኛ የጽሑፍ ፊልዶች
    setEditData({ ...editData, [name]: value });
  }

  setValidationErrors(errors);
};


  // 🔍 1. መረጃ መፈለጊያ
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
        setRegisteredData({ ...result.data, imageSrc: result.data.photoUrl });
        setEditData(result.data);
        setSearchStatus('🎉 የጡረተኛው መረጃ ተገኝቷል!');
      } else {
        setSearchStatus(`❌ ${result.message}`);
      }
    } catch (err) {
      setSearchStatus(`❌ የፍለጋ ስህተት፡ ${err.message}`);
    }
  };


   // 📝 2. መረጃ ማሻሻያ (የተስተካከለ - ከ10 ዲጂት ጥብቅ ቫሊዴሽን ጋር)
  const handleUpdate = async (e) => {
    e.preventDefault();

    // 🛑 ከመላኩ በፊት እያንዳንዱ ቁጥር ልክ 10 ዲጂት መሆኑን በድጋሚ ቼክ ማድረግ
    const requiredNumbers = ['pensionerId', 'phone', 'tin'];
    let finalErrors = {};
    
    requiredNumbers.forEach(field => {
      // ቲን (TIN) ቁጥር ግዴታ ካልሆነና ተጠቃሚው ምንም ካልጻፈበት እንዲያልፍ ይደረጋል
      if (field === 'tin' && !editData[field]) return; 

      // መረጃው ከሌለ ወይም ርዝመቱ ልክ 10 ካልሆነ ስህተት ይይዛል
      if (!editData[field] || editData[field].length !== 10) {
        finalErrors[field] = "⚠️ ይህ መረጃ ልክ 10 ዲጂት መሆን አለበት!";
      }
    });

    // ስህተት ከተገኘ ፎርሙ ወደ ባክኤንድ እንዳይላክ እዚህ ላይ ይቆማል
    if (Object.keys(finalErrors).length > 0) {
      setValidationErrors(finalErrors);
      setSearchStatus('❌ እባክዎ የፎርሙን ስህተቶች ሳያስተካክሉ መረጃ መላክ አይችሉም!');
      return;
    }

    setSearchStatus('⏳ መረጃው እየታረመ ነው...');
    
    // ከባክኤንድ የመጡና አብረው መላክ የሌለባቸውን ፊልዶች እንነጥላለን
    const { editHistory, createdAt, updatedAt, ...cleanEditData } = editData;

    try {
      const response = await fetch(`https://poessa-digital-services-1.onrender.com/api/pensioners/update/${registeredData._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...cleanEditData, lastEditedBy: currentEmployee }),
      });

      const result = await response.json();
      if (result.success) {
        setRegisteredData({ 
          ...result.data, 
          imageSrc: result.data.photoUrl 
        });
        setIsEditing(false);
        setValidationErrors({}); // የነበሩ የቫሊዴሽን ስህተቶችን ያጸዳል
        setSearchStatus('🎉 መረጃው በተሳካ ሁኔታ ታርሟል!');
      } else {
        setSearchStatus(`❌ ስህተት፡ ${result.message}`);
      }
    } catch (err) {
      setSearchStatus(`❌ ማስተካከል አልተቻለም፡ ${err.message}`);
    }
  };


  // 💀 3. የህይወት ሁኔታ መቀየሪያ
  const toggleLifeStatus = async (newStatus) => {
    const confirmation = window.confirm(`ይህንን የጡረተኛ ሁኔታ ለመቀየር እርግጠኛ ነዎት?`);
    if (!confirmation) return;

    setSearchStatus('⏳ የዜጋው ሁኔታ እየተቀየረ ነው...');
    try {
      const response = await fetch(`https://poessa-digital-services-1.onrender.com/api/pensioners/update/${registeredData._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, lastEditedBy: currentEmployee }),
      });

      const result = await response.json();
      if (result.success) {
        setRegisteredData({ ...result.data, imageSrc: result.data.photoUrl });
        setEditData(result.data);
        setSearchStatus(`🎉 የዜጋው ሁኔታ ተቀይሯል!`);
      }
    } catch (err) {
      setSearchStatus(`❌ መቀየር አልተቻለም፡ ${err.message}`);
    }
  };

  // 🗑️ 4. መረጃ ማጥፊያ
  const handleDelete = async () => {
    if (!window.confirm("🚨 ይህንን መረጃ ማጥፋት ይፈልጋሉ?")) return;
    try {
      const response = await fetch(`https://poessa-digital-services-1.onrender.com/api/pensioners/delete/${registeredData._id}?employeeName=${currentEmployee}`, { method: 'DELETE' });
      const result = await response.json();
      if (result.success) {
        setRegisteredData(null);
        setSearchStatus(`🗑️ ${result.message}`);
        fetchDeletedLogs();
      }
    } catch (err) {
      setSearchStatus(`❌ ማጥፋት አልተቻለም፡ ${err.message}`);
    }
  };

  return (
    <div className="id-generation-page-container">
      {/* 🔍 የፍለጋ ሳጥን */}
      <div className="search-section no-print">
        <h3>🔍 የጡረተኛ መረጃ ማኔጅመንት እና መታወቂያ ማውጫ</h3>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
          <input type="text" placeholder="የፋይዳ ቁጥር፣ ስልክ ወይም ፔንሲዮን ቁጥር..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ flex: 1, padding: '10px' }} />
          <button type="submit" className="search-submit-btn">ፈልግ</button>
        </form>
        {searchStatus && <p className="status-indicator">{searchStatus}</p>}
      </div>

      {/* 📝 ባለሁለት ቋንቋ መረጃ ማስተካከያ ፎርም */}
      {isEditing && (
        <div className="edit-form-section no-print">
          <h3>📝 የጡረተኛ መረጃ ማስተካከያ (ፈጻሚ ባለሙያ፡ {currentEmployee})</h3>
          <form onSubmit={handleUpdate} className="pensioner-form">
            <div className="form-grid">
              {/* ቁጥርና 10 ዲጂት ቫሊዴሽን ያላቸው ፊልዶች */}
              <div className="input-group">
                <label>Pension ID (10+ Digits Only)</label>
                <input type="text" name="pensionerId" value={editData.pensionerId || ''} onChange={handleEditChange} required />
                {validationErrors.pensionerId && <span className="error-text" style={{color: 'red', fontSize: '11px'}}>{validationErrors.pensionerId}</span>}
              </div>
              <div className="input-group">
                <label>ስልክ ቁጥር / Phone (10+ Digits)</label>
                <input type="tel" name="phone" value={editData.phone || ''} onChange={handleEditChange} required />
                {validationErrors.phone && <span className="error-text" style={{color: 'red', fontSize: '11px'}}>{validationErrors.phone}</span>}
              </div>
              <div className="input-group">
                <label>ቲን ቁጥር / TIN (10+ Digits)</label>
                <input type="text" name="tin" value={editData.tin || ''} onChange={handleEditChange} />
                {validationErrors.tin && <span className="error-text" style={{color: 'red', fontSize: '11px'}}>{validationErrors.tin}</span>}
              </div>
              <div className="input-group"><label>የፋይዳ ቁጥር</label><input type="text" name="faydaNumber" value={editData.faydaNumber || ''} onChange={handleEditChange} required /></div>
              
              {/* 🌐 የቋንቋ ከፋይ ፊልዶች */}
              <div className="input-group"><label>ሙሉ ስም (በአማርኛ)</label><input type="text" name="nameAmh" value={editData.nameAmh || ''} onChange={handleEditChange} required /></div>
              <div className="input-group"><label>Full Name (In English)</label><input type="text" name="nameEng" value={editData.nameEng || ''} onChange={handleEditChange} required /></div>
              
              <div className="input-group"><label>አድራሻ (ክልል/ዞን/ወረዳ)</label><input type="text" name="addressAmh" value={editData.addressAmh || ''} onChange={handleEditChange} required /></div>
              <div className="input-group"><label>Address (Region/Zone/Woreda)</label><input type="text" name="addressEng" value={editData.addressEng || ''} onChange={handleEditChange} required /></div>
              
              <div className="input-group"><label>የባንክ ስም (አማርኛ)</label><input type="text" name="bankNameAmh" value={editData.bankNameAmh || ''} onChange={handleEditChange} /></div>
              <div className="input-group"><label>Bank Name (English)</label><input type="text" name="bankNameEng" value={editData.bankNameEng || ''} onChange={handleEditChange} /></div>

              {/* መደበኛ ፊልዶች */}
              <div className="input-group"><label>ዕድሜ</label><input type="number" name="age" value={editData.age || ''} onChange={handleEditChange} required /></div>
              <div className="input-group">
                <label>ጾታ</label>
                <select name="gender" value={editData.gender || ''} onChange={handleEditChange}>
                  <option value="Male">ወንድ / Male</option>
                  <option value="Female">ሴት / Female</option>
                </select>
              </div>
              <div className="input-group"><label>የጡረታ አበል (ETB)</label><input type="number" name="pensionAmount" value={editData.pensionAmount || ''} onChange={handleEditChange} required /></div>
              <div className="input-group"><label>የባንክ ቅርንጫፍ</label><input type="text" name="bankBranch" value={editData.bankBranch || ''} onChange={handleEditChange} /></div>
              <div className="input-group"><label>የፖኤሳ ቅርንጫፍ (POESSA)</label><input type="text" name="poessaBranch" value={editData.poessaBranch || ''} onChange={handleEditChange} /></div>
              <div className="input-group"><label>የተሰጠበት ቀን</label><input type="date" name="issueDate" value={editData.issueDate ? editData.issueDate.substring(0,10) : ''} onChange={handleEditChange} /></div>
            </div>
            
            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
              <button type="submit" className="save-btn">ለውጦችን አስቀምጥ</button>
              <button type="button" onClick={() => setIsEditing(false)} className="cancel-btn">አንሳ</button>
            </div>
          </form>
        </div>
      )}

      {/* 🪪 የሁለት ቋንቋ ዲጂታል መታወቂያ ካርድ */}
      {registeredData && (
        <div className="id-card-wrapper-section">
          <div className="admin-actions no-print">
            <button onClick={() => setIsEditing(true)} className="edit-action-btn">📝 አርም</button>
            {registeredData.status === 'Passive' ? (
              <button onClick={() => toggleLifeStatus('Active')} className="status-active-btn">💚 ወደ Active ቀይር</button>
            ) : (
              <button onClick={() => toggleLifeStatus('Passive')} className="status-passive-btn">💀 ወደ Passive ቀይር (አርፈዋል)</button>
            )}
            <button onClick={handleDelete} className="delete-action-btn">🗑️ አጥፋ</button>
          </div>

          {/* ዲጂታል መታወቂያ ካርድ */}
          <div className={`id-card ${registeredData.status === 'Passive' ? 'pensioner-dead' : ''}`} id="pensioner-id-card">
            <div className="id-card-header">
              <div className="logo-placeholder">🇪🇹</div>
              <div className="header-titles">
                <h3>POESSA DIGITAL ID CARD</h3>
                <p style={{fontSize: '11px', margin: 0}}>የፌዴራል የጡረታና ማህበራዊ ዋስትና ኤጀንሲ</p>
                <p style={{fontSize: '9px', margin: 0, color: '#ddd'}}>Federal Pension & Social Security Agency</p>
              </div>
              <div className={`status-badge-view ${registeredData.status === 'Passive' ? 'badge-passive' : 'badge-active'}`}>
                {registeredData.status === 'Passive' ? "PASSIVE" : "ACTIVE"}
              </div>
            </div>

            <div className="id-card-body">
              <div className="id-photo-zone">
                <img src={registeredData.imageSrc || "https://via.placeholder.com/150"} alt="Pensioner" className="id-pensioner-img" onError={(e) => { e.target.src = "https://via.placeholder.com/150"; }} />
                <div className="id-dates-box">
                  <p><strong>የተሰጠበት ቀን / Issue:</strong></p>
                  <p>{registeredData.issueDate ? registeredData.issueDate.substring(0,10) : 'N/A'}</p>
                </div>
              </div>

              {/* 🌐 በሁለት ቋንቋ ጎን ለጎን የተደረደረ የዝርዝር መረጃ ክፍል */}
              <div className="id-details-zone">
                <p><span className="lbl">ስም / Name:</span> <span className="val-name">{registeredData.nameAmh} / {registeredData.nameEng}</span></p>
                <p><span className="lbl">አይዲ / Pension ID:</span> <span className="val">{registeredData.pensionerId}</span></p>
                <p><span className="lbl">ፋይዳ / FAYDA:</span> <span className="val">{registeredData.faydaNumber}</span></p>
                <p><span className="lbl">ቲን / TIN:</span> <span className="val">{registeredData.tin || 'N/A'}</span></p> 
                <p><span className="lbl">ስልክ / Phone:</span> <span className="val">{registeredData.phone}</span></p>
                <p><span className="lbl">አድራሻ / Address:</span> <span className="val">{registeredData.addressAmh} | {registeredData.addressEng}</span></p>
                <p><span className="lbl">ባንክ / Bank:</span> <span className="val">{registeredData.bankNameAmh || 'N/A'} ({registeredData.bankNameEng || 'N/A'})</span></p>
                <p><span className="lbl">ቅርንጫፍ / Branch:</span> <span className="val">{registeredData.poessaBranch || 'ዋናው ቅርንጫፍ'}</span></p>
                {registeredData.status === 'Passive' && registeredData.statusChangedDate && (
                  <p style={{ color: '#dc3545', fontSize: '10px', fontWeight: 'bold', marginTop: '5px' }}>🚨 ህልፈት የተመዘገበበት፡ {new Date(registeredData.statusChangedDate).toLocaleDateString('et-ET')}</p>
                )}
              </div>

              <div className="id-qr-zone">
                <QRCodeSVG value={`${window.location.origin}/verify/${registeredData.faydaNumber}`} size={105} level={"H"} includeMargin={true} />
                <span className="qr-label">DIGITAL SIGNATURE</span>
              </div>
            </div>

            <div className="id-card-footer">
              <p>የሀገር ባለውለታዎችን በክብር እናገለግላለን! | POESSA 2026</p>
            </div>
          </div>

          {/* 📋 የጡረተኛ CRUD Log ፓነል */}
          <div className="crud-audit-panel no-print">
            <h4>📋 የዚህ ጡረተኛ የክትትል መረጃ (PENSIONER CRUD LOG)</h4>
            <div className="audit-row">
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span><strong>የመዘገበው ባለሙያ:</strong> {registeredData.registeredBy || 'ያልታወቀ'}</span>
                <span><strong>የተመዘገበበት ቀን፡</strong> {registeredData.createdAt ? new Date(registeredData.createdAt).toLocaleString('et-ET') : 'N/A'}</span>
              </div>
            </div>
            {registeredData.editHistory && (
              <div className="audit-row border-top" style={{ color: '#0056b3', fontWeight: '500', padding: '8px 0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {Array.isArray(registeredData.editHistory) ? (
                  registeredData.editHistory.map((history, index) => (
                    <span key={index}>
                      ℹ️ <strong>የእርማት አይነት፦</strong> {history.details} 
                      <small style={{ color: '#666', fontWeight: 'normal', marginLeft: '5px' }}>({history.editedBy} - {new Date(history.editedAt).toLocaleString('et-ET')})</small>
                    </span>
                  ))
                ) : (
                  <span>ℹ️ <strong>የእርማት አይነት፦</strong> {registeredData.editHistory}</span>
                )}
              </div>
            )}
          </div>

          <button onClick={() => window.print()} className="print-btn no-print">🖨️ መታወቂያውን አትም (Print ID)</button>
        </div>
      )}

      {/* 🚨 የጠፉ መረጃዎች ታሪክ (DELETED LOGS) ፓነል */}
      <div className="crud-audit-panel no-print" style={{ marginTop: '30px', borderTop: '3px solid #dc3545', background: '#fff5f5' }}>
        <h4 style={{ color: '#c53030' }}>🚨 የጠፉ/የተደለዙ መረጃዎች የታሪክ መዝገብ (DELETED LOGS)</h4>
        {deletedLogs.length === 0 ? (
          <p style={{ color: '#666', fontSize: '13px', padding: '10px 0' }}>እስከ አሁን የጠፋ የጡረተኛ መረጃ የለም።</p>
        ) : (
          <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
            {deletedLogs.map((log, index) => (
              <div key={log._id || index} style={{ fontSize: '13px', padding: '10px', background: '#fff', borderRadius: '4px', borderLeft: '4px solid #dc3545', display: 'flex', justifyContent: 'between', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  🗑️ <strong>የጡረተኛው ስም:</strong> {log.pensionerName} | 🆔 <strong>ፋይዳ ቁጥር:</strong> {log.faydaNumber}
                </div>
                <div style={{ color: '#555', textAlign: 'right', fontSize: '12px' }}>
                  👤 <strong>ያጠፋው ባለሙያ:</strong> {log.deletedBy} <br/>
                  📅 <strong>የጠፋበት ቀን:</strong> {new Date(log.deletedAt).toLocaleString('et-ET')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default IdCardGenerationAndSearch;
