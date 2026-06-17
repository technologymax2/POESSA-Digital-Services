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
        setRegisteredData({
          ...result.data,
          imageSrc: result.data.photoUrl,
        });
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

  const handleDelete = async () => {
    if (!window.confirm("🚨 ይህንን መረጃ ማጥፋት ይፈልጋሉ?")) return;
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
    <h3>📝 የጡረተኛ መረጃ ማስተካከያ ፎርም</h3>
    <form onSubmit={handleUpdate} className="pensioner-form">
      <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        
        <div className="input-group">
          <label>ሙሉ ስም (Full Name)</label>
          <input type="text" name="name" value={editData.name || ''} onChange={handleEditChange} required style={{width: '100%', padding: '8px'}} />
        </div>
        
        <div className="input-group">
          <label>የፋይዳ ቁጥር (FAYDA No)</label>
          <input type="text" name="faydaNumber" value={editData.faydaNumber || ''} onChange={handleEditChange} required style={{width: '100%', padding: '8px'}} />
        </div>
        
        <div className="input-group">
          <label>ቲን ቁጥር (TIN Number)</label>
          <input type="text" name="tin" value={editData.tin || ''} onChange={handleEditChange} required style={{width: '100%', padding: '8px'}} />
        </div>
        
        <div className="input-group">
          <label>ስልክ ቁጥር (Phone Number)</label>
          <input type="tel" name="phone" value={editData.phone || ''} onChange={handleEditChange} required style={{width: '100%', padding: '8px'}} />
        </div>
        
        <div className="input-group">
          <label>አድራሻ (Address)</label>
          <input type="text" name="address" value={editData.address || ''} onChange={handleEditChange} required style={{width: '100%', padding: '8px'}} />
        </div>
        
        <div className="input-group">
          <label>የቅርንጫፍ ስም (POESSA Branch)</label>
          <input type="text" name="poessaBranch" value={editData.poessaBranch || ''} onChange={handleEditChange} required style={{width: '100%', padding: '8px'}} />
        </div>
        
        <div className="input-group">
          <label>የጡረታ አበል መጠን (Pension Amount)</label>
          <input type="number" name="pensionAmount" value={editData.pensionAmount || ''} onChange={handleEditChange} required style={{width: '100%', padding: '8px'}} />
        </div>

      </div>
      
      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
        <button type="submit" className="save-btn">ለውጦችን አስቀምጥ (Save Changes)</button>
        <button type="button" onClick={() => setIsEditing(false)} className="cancel-btn">አንሳ (Cancel)</button>
      </div>
    </form>
  </div>
)}
      {registeredData && !isEditing && (
        <div className="id-card-wrapper-section">
          <div className="admin-actions no-print">
            <button onClick={() => setIsEditing(true)} className="edit-action-btn">📝 አርም</button>
            <button onClick={handleDelete} className="delete-action-btn">🗑️ አጥፋ</button>
          </div>

          <div className="id-card" id="pensioner-id-card">
            <div className="id-card-header"><h3>POESSA DIGITAL ID</h3></div>
            <div className="id-card-body">
              <div className="id-photo-zone">
                <img src={registeredData.imageSrc} alt="Pensioner" className="id-pensioner-img" />
                <p className="id-num">{registeredData.issueDate}</p>
              </div>
              <div className="id-details-zone">
  <p><strong>ስም:</strong> {registeredData.name}</p>
  <p><strong>FAYDA No:</strong> {registeredData.faydaNumber}</p>
  <p><strong>ቲን (TIN):</strong> {registeredData.tin}</p> 
  <p><strong>ስልክ:</strong> {registeredData.phone}</p>
  <p><strong>አድራሻ:</strong> {registeredData.address}</p>
  <p><strong>ቅርንጫፍ:</strong> {registeredData.poessaBranch}</p>
</div>
              <div className="id-qr-zone">
                <QRCodeSVG 
                  value={JSON.stringify({ 
                    id: registeredData.pensionerId, 
                    name: registeredData.name, 
                    tin: registeredData.tin 
                  })} 
                  size={90} 
                />
                <span className="qr-label">SCAN TO VERIFY</span>
              </div>
            </div>
            <div className="id-card-footer"><p>ያገለገሉ ዜጎችን በማገልገላችን ኩራት ይሰማናል</p></div>
          </div>
          <button onClick={() => window.print()} className="print-btn no-print">🖨️ አትም (Print ID)</button>
        </div>
      )}
    </div>
  );
}

export default IdCardGenerationAndSearch;
