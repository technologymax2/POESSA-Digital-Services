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

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    let errors = { ...validationErrors };

    if (['pensionerId', 'phone', 'tin', 'faydaNumber'].includes(name)) {
      let cleanValue = value.replace(/\D/g, '');

      if (name === 'phone' && cleanValue.length > 0 && cleanValue[0] !== '0') {
        errors[name] = "⚠️ ስልክ ቁጥር በ '0' መጀመር አለበት!";
        setValidationErrors(errors);
        return;
      }

      const maxLength = name === 'faydaNumber' ? 16 : 10;
      if (cleanValue.length > maxLength) {
        cleanValue = cleanValue.substring(0, maxLength);
      }

      if (cleanValue.length > 0 && cleanValue.length < maxLength) {
        errors[name] = `⚠️ ልክ ${maxLength} ዲጂት መሆን አለበት! (አሁን፡ ${cleanValue.length})`;
      } else {
        delete errors[name];
      }

      setEditData({ ...editData, [name]: cleanValue });
    } else {
      setEditData({ ...editData, [name]: value });
    }

    setValidationErrors(errors);
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

  const handleUpdate = async (e) => {
    e.preventDefault();

    let finalErrors = {};
    const required10Digits = ['pensionerId', 'phone', 'tin'];
    
    required10Digits.forEach(field => {
      if (!editData[field] || editData[field].length !== 10) {
        finalErrors[field] = "⚠️ ይህ መረጃ ልክ 10 ዲጂት መሆን አለበት!";
      }
    });

    if (!editData.faydaNumber || editData.faydaNumber.length !== 16) {
      finalErrors.faydaNumber = "⚠️ የፋይዳ ቁጥር ልክ 16 ዲጂት መሆን አለበት!";
    }

    if (Object.keys(finalErrors).length > 0) {
      setValidationErrors(finalErrors);
      setSearchStatus('❌ እባክዎ የፎርሙን ስህተቶች ያስተካክሉ!');
      return;
    }

    setSearchStatus('⏳ መረጃው እየታረመ ነው...');
    const { editHistory, createdAt, updatedAt, ...cleanEditData } = editData;

    try {
      const response = await fetch(`https://poessa-digital-services-1.onrender.com/api/pensioners/update/${registeredData._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...cleanEditData, lastEditedBy: currentEmployee }),
      });

      const result = await response.json();
      if (result.success) {
        setRegisteredData({ ...result.data, imageSrc: result.data.photoUrl });
        setIsEditing(false);
        setSearchStatus('🎉 መረጃው በተሳካ ሁኔታ ታርሟል!');
      } else {
        setSearchStatus(`❌ ስህተት፡ ${result.message}`);
      }
    } catch (err) {
      setSearchStatus(`❌ ማስተካከል አልተቻለም፡ ${err.message}`);
    }
  };

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

      {/* 📝 መረጃ ማስተካከያ ፎርም */}
      {isEditing && (
        <div className="edit-form-section no-print">
          <h3>📝 የጡረተኛ መረጃ ማስተካከያ (ፈጻሚ ባለሙያ፡ {currentEmployee})</h3>
          <form onSubmit={handleUpdate} className="pensioner-form">
            <div className="form-grid">
              <div className="input-group">
                <label>Pension ID (10 Digits)</label>
                <input type="text" name="pensionerId" value={editData.pensionerId || ''} onChange={handleEditChange} required />
                {validationErrors.pensionerId && <span className="error-text" style={{color: 'red', fontSize: '11px'}}>{validationErrors.pensionerId}</span>}
              </div>
              <div className="input-group">
                <label>የፋይዳ ቁጥር / FAYDA (16 Digits)</label>
                <input type="text" name="faydaNumber" value={editData.faydaNumber || ''} onChange={handleEditChange} required />
                {validationErrors.faydaNumber && <span className="error-text" style={{color: 'red', fontSize: '11px'}}>{validationErrors.faydaNumber}</span>}
              </div>
              <div className="input-group">
                <label>ስልክ ቁጥር / Phone (10 Digits)</label>
                <input type="tel" name="phone" value={editData.phone || ''} onChange={handleEditChange} required />
                {validationErrors.phone && <span className="error-text" style={{color: 'red', fontSize: '11px'}}>{validationErrors.phone}</span>}
              </div>
              <div className="input-group">
                <label>ቲን ቁጥር / TIN (10 Digits)</label>
                <input type="text" name="tin" value={editData.tin || ''} onChange={handleEditChange} required />
                {validationErrors.tin && <span className="error-text" style={{color: 'red', fontSize: '11px'}}>{validationErrors.tin}</span>}
              </div>
              
              <div className="input-group"><label>ሙሉ ስም (አማርኛ)</label><input type="text" name="nameAmh" value={editData.nameAmh || ''} onChange={handleEditChange} required /></div>
              <div className="input-group"><label>Full Name (In English)</label><input type="text" name="nameEng" value={editData.nameEng || ''} onChange={handleEditChange} required /></div>
              <div className="input-group"><label>አድራሻ (አማርኛ)</label><input type="text" name="addressAmh" value={editData.addressAmh || ''} onChange={handleEditChange} required /></div>
              <div className="input-group"><label>Address (In English)</label><input type="text" name="addressEng" value={editData.addressEng || ''} onChange={handleEditChange} required /></div>
              <div className="input-group"><label>የባንክ ስም (አማርኛ)</label><input type="text" name="bankNameAmh" value={editData.bankNameAmh || ''} onChange={handleEditChange} required /></div>
              <div className="input-group"><label>Bank Name (In English)</label><input type="text" name="bankNameEng" value={editData.bankNameEng || ''} onChange={handleEditChange} required /></div>
              <div className="input-group"><label>የባንክ ቅርንጫፍ</label><input type="text" name="bankBranch" value={editData.bankBranch || ''} onChange={handleEditChange} required /></div>
              <div className="input-group"><label>የፖኤሳ ቅርንጫፍ (POESSA)</label><input type="text" name="poessaBranch" value={editData.poessaBranch || ''} onChange={handleEditChange} required /></div>
              <div className="input-group"><label>ዕድሜ</label><input type="number" name="age" value={editData.age || ''} onChange={handleEditChange} required /></div>
              <div className="input-group">
                <label>ጾታ</label>
                <select name="gender" value={editData.gender || ''} onChange={handleEditChange}>
                  <option value="Male">ወንድ / Male</option>
                  <option value="Female">ሴት / Female</option>
                </select>
              </div>
              <div className="input-group"><label>የጡረታ አበል (ETB)</label><input type="number" name="pensionAmount" value={editData.pensionAmount || ''} onChange={handleEditChange} required /></div>
              <div className="input-group"><label>የተሰጠበት ቀን</label><input type="date" name="issueDate" value={editData.issueDate ? editData.issueDate.substring(0,10) : ''} onChange={handleEditChange} required /></div>
            </div>
            
            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
              <button type="submit" className="save-btn">ለውጦችን አስቀምጥ</button>
              <button type="button" onClick={() => setIsEditing(false)} className="cancel-btn">አንሳ</button>
            </div>
          </form>
        </div>
      )}

      {/* 🪪 ዲጂታል መታወቂያ ካርድ */}
      {registeredData && (
        <div className="id-card-wrapper-section">
          <div className="admin-actions no-print" style={{ marginBottom: '15px' }}>
            <button onClick={() => setIsEditing(true)} className="edit-action-btn">📝 አርም</button>
            {registeredData.status === 'Passive' ? (
              <button onClick={() => toggleLifeStatus('Active')} className="status-active-btn">ወደ Active ቀይር</button>
            ) : (
              <button onClick={() => toggleLifeStatus('Passive')} className="status-passive-btn">ወደ Passive ቀይር</button>
            )}
            <button onClick={handleDelete} className="delete-action-btn">🗑️ አጥፋ</button>
          </div>

          {/* ዲጂታል መታወቂያ ካርድ - Background ከተጠቃሚው ፍላጎት ጋር የተጣጣመ ስስ ውሃማ ቀለም (#ecf4f9) */}
          <div className={`id-card ${registeredData.status === 'Passive' ? 'pensioner-dead' : ''}`} id="pensioner-id-card" style={{ border: '2px solid #162447', borderRadius: '12px', overflow: 'hidden', width: '680px', background: '#ecf4f9', fontFamily: 'sans-serif', margin: '0 auto', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
            
            {/* 🇪🇹 የሄደር ክፍል */}
            <div className="id-card-header" style={{ background: '#162447', padding: '15px 20px', color: '#fff', display: 'flex', alignItems: 'center', position: 'relative' }}>
              
              {/* 🇪🇹 ብሔራዊ ሰንደቅ ዓላማ ከመሃል ሰማያዊ ክብና ቢጫ ኮከብ (★) ጋር በ CSS */}
              <div className="ethiopian-flag-colors" style={{ width: '40px', height: '24px', borderRadius: '3px', overflow: 'hidden', display: 'flex', flexDirection: 'column', marginRight: '15px', flexShrink: 0, position: 'relative', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
                <div style={{ flex: 1, background: '#009c3a' }}></div>
                <div style={{ flex: 1, background: '#fed100' }}></div>
                <div style={{ flex: 1, background: '#ef3340' }}></div>
                {/* ማዕከላዊ ሰማያዊ ክብ እና ኮከብ */}
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '12px', height: '12px', background: '#0039a6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ color: '#fed100', fontSize: '9px', fontWeight: 'bold', lineHeight: 0, transform: 'translateY(-1px)' }}>★</div>
                </div>
              </div>

              {/* ጽሑፎች */}
              <div className="header-titles" style={{ textAlign: 'center', flex: 1, paddingRight: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', letterSpacing: '1px', fontWeight: 'bold', color: '#ffffff' }}>POESSA DIGITAL ID CARD</h3>
                <p style={{ fontSize: '11px', margin: '4px 0 0 0', fontWeight: '500', color: '#94b0c2', letterSpacing: '0.2px' }}>የፌዴራል ጡረታና ማህበራዊ ዋስትና ኤጀንሲ (Federal Pension & Social Security Agency)</p>
              </div>

              {/* የሁኔታ ማሳያ ባጅ */}
              <div className={`status-badge-view ${registeredData.status === 'Passive' ? 'badge-passive' : 'badge-active'}`} style={{ backgroundColor: registeredData.status === 'Passive' ? '#dc3545' : '#28a745', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', position: 'absolute', right: '20px' }}>
                {registeredData.status === 'Passive' ? "PASSIVE" : "ACTIVE"}
              </div>
            </div>

            {/* 👤 የካርዱ አካል */}
            <div className="id-card-body" style={{ padding: '20px', display: 'flex', gap: '25px', alignItems: 'center' }}>
              
              {/* የፎቶ ዞን */}
              <div className="id-photo-zone" style={{ textAlign: 'center' }}>
                <img src={registeredData.imageSrc || "https://via.placeholder.com/150"} alt="Pensioner" className="id-pensioner-img" style={{ width: '120px', height: '135px', borderRadius: '6px', objectFit: 'cover', border: '2px solid #162447', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }} onError={(e) => { e.target.src = "https://via.placeholder.com/150"; }} />
                
                {/* 🔴 የተሰጠበት ቀን ሳጥን - ዲዛይኑ ከተጠቃሚው ፍላጎት ጋር የተመሳሰለ ስስ ግራጫ/ውሃማ ሳጥን */}
                <div className="id-dates-box" style={{ marginTop: '8px', fontSize: '11px', color: '#333', background: '#e2e8f0', padding: '5px 8px', borderRadius: '5px', border: '1px solid #cbd5e1', fontWeight: 'bold', textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: '10px', color: '#dc2626' }}>የተሰጠበት ቀን / Issue:</p>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#111827' }}>{registeredData.issueDate ? registeredData.issueDate.substring(0,10) : 'N/A'}</p>
                </div>
              </div>

              {/* የጡረተኛው ዝርዝር መረጃ */}
              <div className="id-details-zone" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: '#1f2937' }}>
                <p style={{ margin: 0, paddingBottom: '2px' }}><span style={{ fontWeight: 'bold', color: '#4b5563', minWidth: '90px', display: 'inline-block' }}>ስም / Name:</span> <span style={{ fontWeight: 'bold', color: '#162447', fontSize: '14px' }}>{registeredData.nameAmh} / {registeredData.nameEng}</span></p>
                <p style={{ margin: 0, paddingBottom: '2px' }}><span style={{ fontWeight: 'bold', color: '#4b5563', minWidth: '90px', display: 'inline-block' }}>አይዲ / Pension ID:</span> <span style={{ fontWeight: 'bold', color: '#b91c1c' }}>{registeredData.pensionerId || 'N/A'}</span></p>
                <p style={{ margin: 0, paddingBottom: '2px' }}><span style={{ fontWeight: 'bold', color: '#4b5563', minWidth: '90px', display: 'inline-block' }}>ፋይዳ / FAYDA:</span> <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#000', fontSize: '14px', letterSpacing: '0.3px' }}>{registeredData.faydaNumber}</span></p>
                <p style={{ margin: 0, paddingBottom: '2px' }}><span style={{ fontWeight: 'bold', color: '#4b5563', minWidth: '90px', display: 'inline-block' }}>ቲን / TIN:</span> <span style={{ fontWeight: '500' }}>{registeredData.tin || '0000000000'}</span></p> 
                <p style={{ margin: 0, paddingBottom: '2px' }}><span style={{ fontWeight: 'bold', color: '#4b5563', minWidth: '90px', display: 'inline-block' }}>ስልክ / Phone:</span> <span style={{ fontWeight: '500' }}>{registeredData.phone}</span></p>
                <p style={{ margin: 0, paddingBottom: '2px' }}><span style={{ fontWeight: 'bold', color: '#4b5563', minWidth: '90px', display: 'inline-block' }}>አድራሻ / Address:</span> <span>{registeredData.addressAmh} | {registeredData.addressEng}</span></p>
                <p style={{ margin: 0, paddingBottom: '2px' }}><span style={{ fontWeight: 'bold', color: '#4b5563', minWidth: '90px', display: 'inline-block' }}>ባንክ / Bank:</span> <span style={{ fontWeight: '600' }}>{registeredData.bankNameAmh} ({registeredData.bankNameEng})</span></p>
                <p style={{ margin: 0 }}><span style={{ fontWeight: 'bold', color: '#4b5563', minWidth: '90px', display: 'inline-block' }}>ቅርንጫፍ / Branch:</span> <span style={{ fontWeight: '600', color: '#162447' }}>{registeredData.bankBranch || 'N/A'}</span></p>
                
                {registeredData.status === 'Passive' && registeredData.statusChangedDate && (
                  <p style={{ color: '#dc3545', fontSize: '11px', fontWeight: 'bold', margin: '5px 0 0 0', background: '#fdf2f2', padding: '4px', borderRadius: '4px', width: 'fit-content' }}>🚨 ህልፈት የተመዘገበበት፡ {new Date(registeredData.statusChangedDate).toLocaleDateString('et-ET')}</p>
                )}
              </div>

              {/* QR ኮድ ማህተም */}
              <div className="id-qr-zone" style={{ textAlign: 'center', paddingLeft: '5px' }}>
                <QRCodeSVG value={`${window.location.origin}/verify/${registeredData.faydaNumber}`} size={105} level={"H"} includeMargin={true} style={{ background: '#fff', padding: '4px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                <span className="qr-label" style={{ display: 'block', fontSize: '9px', fontWeight: 'bold', color: '#4b5563', marginTop: '6px', letterSpacing: '0.3px' }}>DIGITAL SIGNATURE</span>
              </div>
            </div>

            {/* 🪙 ጥቅሱ የገባበት ስስ የግራጫ ቀለም ፉተር ሰሌዳ */}
            <div className="id-card-footer" style={{ background: '#e2e8f0', color: '#111827', fontSize: '12px', textAlign: 'center', padding: '10px 0', letterSpacing: '0.5px', fontWeight: 'bold', borderTop: '1px solid #cbd5e1' }}>
              ዓላማችን የረካ ማህበራዊ ዋስትና ተጠቃሚ መፍጠር ነው!!
            </div>
          </div>

          {/* 📋 የጡረተኛ CRUD Log ፓነል (ሳይነካ የተቀመጠ) */}
          <div className="crud-audit-panel no-print" style={{ marginTop: '20px' }}>
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

      {/* 🚨 የጠፉ መረጃዎች ታሪክ ፓነል (ሳይነካ የተቀመጠ) */}
      <div className="crud-audit-panel no-print" style={{ marginTop: '30px', borderTop: '3px solid #dc3545', background: '#fff5f5' }}>
        <h4 style={{ color: '#c53030' }}>🚨 የጠፉ/የተደለዙ መረጃዎች የታሪክ መዝገብ (DELETED LOGS)</h4>
        {deletedLogs.length === 0 ? (
          <p style={{ color: '#666', fontSize: '13px', padding: '10px 0' }}>እስከ አሁን የጠፋ የጡረተኛ መረጃ የለም。</p>
        ) : (
          <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
            {deletedLogs.map((log, index) => (
              <div key={log._id || index} style={{ fontSize: '13px', padding: '10px', background: '#fff', borderRadius: '4px', borderLeft: '4px solid #dc3545', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
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
