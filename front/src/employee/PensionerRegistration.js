import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import './PensionerRegistration.css';

function PensionerRegistration() {
  const navigate = useNavigate();
  const [currentEmployee, setCurrentEmployee] = useState('የአይቲ ባለሙያ');

  // ሲስተሙ ሲከፈት የገባውን ባለሙያ ስም ከ localStorage መውሰድ
  useEffect(() => {
    const storedUser = localStorage.getItem('user') || localStorage.getItem('username') || 'የፖኤሳ ሰራተኛ';
    setCurrentEmployee(storedUser);
  }, []);

  // የምዝገባ ፎርም ስቴት (State)
  const [formData, setFormData] = useState({
    pensionId: '', name: '', tin: '', phone: '', age: '', gender: '',
    faydaNumber: '', poessaBranch: '', bankName: '', bankBranch: '', pensionAmount: '',
    address: '', issueDate: '', expiryDate: '' 
  });

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [registeredData, setRegisteredData] = useState(null); 
  const fileInputRef = useRef(null);

  // የፍለጋ እና ማስተካከያ ስቴቶች
  const [searchQuery, setSearchQuery] = useState('');
  const [searchStatus, setSearchStatus] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});

  // የምዝገባ ፎርም ለውጦች መቆጣጠሪያ
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'faydaNumber') {
      if (value.length > 16 || (value && !/^\d+$/.test(value))) return;
    }
    setFormData({ ...formData, [name]: value });
  };

  // የማስተካከያ ፎርም ለውጦች መቆጣጠሪያ
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData({ ...editData, [name]: value });
  };

  // የፎቶ መምረጫ
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setStatus('⚠️ የፎቶው መጠን ከ 2MB መብለጥ የለበትም!');
        return;
      }
      setStatus('');
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // ወደ ዳሽቦርድ መመለሻ
  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  // ከሲስተም መውጫ (Logout)
  const handleLogout = () => {
    if (window.confirm("እርግጠኛ ነዎት ከሲስተሙ መውጣት ይፈልጋሉ?")) {
      localStorage.clear();
      navigate('/login');
    }
  };

  // 🔍 1. በፋይዳ ወይም በስልክ ቁጥር መረጃ መፈለግ
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
        // ከዳታቤዝ የመጣውን ሙሉ መረጃ በስቴት ውስጥ መያዝ
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
          registeredBy: result.data.registeredBy || 'ያልታወቀ ባለሙያ',
          updatedBy: result.data.updatedBy || 'እስካሁን አልታረመም'
        });
        setEditData(result.data); // ለማስተካከያ ዝግጁ ማድረግ
        setSearchStatus('🎉 የጡረተኛው ሙሉ መረጃ ተገኝቷል!');
      } else {
        setSearchStatus(`❌ ${result.message}`);
      }
    } catch (err) {
      setSearchStatus('❌ የፍለጋ ስህተት፡ ከሰርቨር ጋር መገናኘት አልተቻለም።');
    }
  };

  // 📝 2. የተሳሳተ መረጃ ማሻሻል (Update)
  const handleUpdate = async (e) => {
    e.preventDefault();
    setSearchStatus('መረጃው እየታረመ ነው...');

    try {
      const response = await fetch(`https://poessa-digital-services-1.onrender.com/api/pensioners/update/${registeredData._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editData, employeeName: currentEmployee }),
      });

      const result = await response.json();

      if (result.success) {
        setRegisteredData({
          ...registeredData,
          ...result.data,
          imageSrc: result.data.photoUrl,
          updatedBy: currentEmployee
        });
        setIsEditing(false);
        setSearchStatus(`🎉 ${result.message}`);
      } else {
        setSearchStatus(`❌ ስህተት፡ ${result.message}`);
      }
    } catch (err) {
      setSearchStatus('❌ ስህተት፡ ማስተካከል አልተቻለም።');
    }
  };

  // 🗑️ 3. መረጃን ለዘላለም ማጥፋት (Delete)
  const handleDelete = async () => {
    if (!window.confirm("🚨 ይህንን የጡረተኛ መረጃ ከዳታቤዝ ውስጥ ለዘላለም ማጥፋት ይፈልጋሉ?")) return;

    setSearchStatus('መረጃው እየጠፋ ነው...');

    try {
      const response = await fetch(`https://poessa-digital-services-1.onrender.com/api/pensioners/delete/${registeredData._id}?employeeName=${currentEmployee}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setRegisteredData(null);
        setEditData({});
        setSearchQuery('');
        setSearchStatus(`🗑️ ${result.message}`);
      } else {
        setSearchStatus(`❌ ስህተት፡ ${result.message}`);
      }
    } catch (err) {
      setSearchStatus('❌ ስህተት፡ ማጥፋት አልተቻለም።');
    }
  };

  // 📥 4. አዲስ የጡረተኛ መረጃ መመዝገብ
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.faydaNumber.length !== 16) {
      setStatus('⚠️ እባክዎ ትክክለኛ የፋይዳ ቁጥር (16 ዲጂት) ያስገቡ!');
      return;
    }
    if (!image) {
      setStatus('⚠️ እባክዎ የጡረተኛውን ማነጻጸሪያ ፎቶ ይጫኑ!');
      return;
    }

    setStatus('የጡረተኛው መረጃ እና ፎቶ ወደ ዳታቤዝ እየተላከ ነው...');
    setLoading(true);

    const dataToSend = new FormData();
    dataToSend.append('photo', image);
    dataToSend.append('employeeName', currentEmployee);
    
    Object.keys(formData).forEach(key => {
      dataToSend.append(key, formData[key]);
    });

    try {
      const response = await fetch('https://poessa-digital-services-1.onrender.com/api/pensioners/register', {
        method: 'POST',
        body: dataToSend,
      });

      const result = await response.json();

      if (result.success) {
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
          registeredBy: currentEmployee
        });

        setStatus(`🎉 ${result.message}`);
        setFormData({
          pensionId: '', name: '', tin: '', phone: '', age: '', gender: '',
          faydaNumber: '', poessaBranch: '', bankName: '', bankBranch: '', pensionAmount: '',
          address: '', issueDate: '', expiryDate: ''
        });
        setImage(null);
        setImagePreview(null);
      } else {
        setStatus(`❌ ስህተት፡ ${result.message}`);
      }
    } catch (err) {
      setStatus('❌ ስህተት፡ ከሰርቨር ጋር መገናኘት አልተቻለም።');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="registration-container">
      
      {/* 🔝 የሰራተኛ መቆጣጠሪያ ባር (Navigation Bar) */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#2d3748', color: 'white', padding: '12px 20px', borderRadius: '6px', marginBottom: '25px' }}>
        <div>
          <span style={{ fontSize: '14px', color: '#cbd5e0' }}>👋 ሰላም፣ </span>
          <strong style={{ color: '#63b3ed', fontSize: '16px' }}>{currentEmployee}</strong>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={handleGoToDashboard} style={{ padding: '8px 16px', backgroundColor: '#4a5568', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>⬅️ ወደ Dashboard ተመለስ</button>
          <button onClick={handleLogout} style={{ padding: '8px 16px', backgroundColor: '#e53e3e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>🚪 Logout</button>
        </div>
      </div>

      {/* 🔍 የጡረተኛ መረጃ ፈልጎ ማውጫ ሳጥን */}
      <div className="search-section no-print" style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f0f4f8', borderRadius: '8px', border: '1px solid #d1d9e6' }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#1a365d' }}>🔍 የጡረተኛ መረጃ ማኔጅመንት (መፈለጊያ፣ ማስተካከያ እና ማጥፊያ)</h3>
        <p style={{ fontSize: '13px', color: '#4a5568', margin: '0 0 15px 0' }}>በአስፈላጊ ጊዜ የጡረተኛውን የፋይዳ ቁጥር ወይም ስልክ ቁጥር በመጠቀም ሙሉ መረጃውን ማየት ይችላሉ።</p>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="text" 
            placeholder="የፋይዳ ቁጥር ወይም ስልክ ቁጥር ያስገቡ..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e0' }}
          />
          <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#2b6cb0', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>ፈልግ</button>
        </form>
        {searchStatus && <p style={{ fontSize: '14px', marginTop: '10px', fontWeight: '500', color: '#2b6cb0' }}>{searchStatus}</p>}
      </div>

      {/* 📝 የተሳሳተ መረጃ ማስተካከያ ፎርም */}
      {isEditing && (
        <div className="edit-form-section no-print" style={{ padding: '20px', backgroundColor: '#fffaf0', borderRadius: '8px', border: '1px solid #feebc8', marginBottom: '30px' }}>
          <h3 style={{ color: '#dd6b20', marginTop: 0 }}>📝 የተሳሳተ መረጃ ማስተካከያ ፎርም</h3>
          <form onSubmit={handleUpdate} className="pensioner-form">
            <div className="form-grid">
              <div className="input-group"><label>ሙሉ ስም</label><input type="text" name="name" value={editData.name || ''} onChange={handleEditChange} required /></div>
              <div className="input-group"><label>ስልክ ቁጥር</label><input type="tel" name="phone" value={editData.phone || ''} onChange={handleEditChange} required /></div>
              <div className="input-group"><label>አድራሻ</label><input type="text" name="address" value={editData.address || ''} onChange={handleEditChange} required /></div>
              <div className="input-group"><label>የፖኤሳ ቅርንጫፍ</label><input type="text" name="poessaBranch" value={editData.poessaBranch || ''} onChange={handleEditChange} required /></div>
              <div className="input-group"><label>የባንክ ስም</label><input type="text" name="bankName" value={editData.bankName || ''} onChange={handleEditChange} required /></div>
              <div className="input-group"><label>የባንክ ቅርንጫፍ</label><input type="text" name="bankBranch" value={editData.bankBranch || ''} onChange={handleEditChange} required /></div>
              <div className="input-group"><label>የጡረታ አበል መጠን</label><input type="number" name="pensionAmount" value={editData.pensionAmount || ''} onChange={handleEditChange} required /></div>
              <div className="input-group"><label>የማብቂያ ጊዜ</label><input type="date" name="expiryDate" value={editData.expiryDate || ''} onChange={handleEditChange} required /></div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#38a169', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>ለውጦችን አስቀምጥ (Save)</button>
              <button type="button" onClick={() => setIsEditing(false)} style={{ padding: '10px 20px', backgroundColor: '#e5e7eb', color: 'black', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>አንሳ (Cancel)</button>
            </div>
          </form>
        </div>
      )}

      {/* 📥 አዲስ የጡረተኛ መመዝገቢያ ፎርም */}
      {!isEditing && (
        <div className="no-print">
          <h2 className="form-title">POESSA የጡረተኞች ምዝገባ ቅጽ</h2>
          <p className="form-subtitle">የሰራተኞች መመዝገቢያ ዴስክ (የQR መታወቂያ ማውጫ ጨምሮ)</p>

          <form onSubmit={handleSubmit} className="pensioner-form">
            <div className="image-upload-section">
              <div className="image-preview-box" onClick={() => fileInputRef.current.click()}>
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="preview-img" />
                ) : (
                  <div className="upload-placeholder">
                    <span className="upload-icon">📷</span>
                    <span>የጡረተኛውን ፎቶ </span>
                  </div>
                )}
              </div>
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} style={{ display: 'none' }} />
            </div>

            <div className="form-grid">
              <div className="input-group"><label>የጡረታ መለያ ቁጥር (Pension ID)</label><input type="text" name="pensionId" value={formData.pensionId} onChange={handleChange} placeholder="ምሳሌ፡ PENS/1234" required /></div>
              <div className="input-group"><label>ሙሉ ስም (Name)</label><input type="text" name="name" value={formData.name} onChange={handleChange} required /></div>
              <div className="input-group"><label>የፋይዳ ቁጥር (16-Digit Fayda No)</label><input type="text" name="faydaNumber" value={formData.faydaNumber} onChange={handleChange} placeholder="16 ዲጂት ቁጥር" required /></div>
              <div className="input-group"><label>የግብር ከፋይ መለያ (TIN)</label><input type="text" name="tin" value={formData.tin} onChange={handleChange} required /></div>
              <div className="input-group"><label>ስልክ ቁጥር (Phone)</label><input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="09..." required /></div>
              <div className="input-group"><label>ዕድሜ (Age)</label><input type="number" name="age" value={formData.age} onChange={handleChange} required /></div>
              <div className="input-group">
                <label>ጾታ (Gender)</label>
                <select name="gender" value={formData.gender} onChange={handleChange} required>
                  <option value="">ይምረጡ</option>
                  <option value="Male">ወንድ (Male)</option>
                  <option value="Female">ሴት (Female)</option>
                </select>
              </div>
              <div className="input-group"><label>አድራሻ (Address)</label><input type="text" name="address" value={formData.address} onChange={handleChange} placeholder="ክፍለ ከተማ፣ ወረዳ..." required /></div>
              <div className="input-group"><label>የተሰጠበት ቀን (Issue Date)</label><input type="date" name="issueDate" value={formData.issueDate} onChange={handleChange} required /></div>
              <div className="input-group"><label>የማብቂያ ጊዜ (Expiry Date)</label><input type="date" name="expiryDate" value={formData.expiryDate} onChange={handleChange} required /></div>
              <div className="input-group"><label>የፖኤሳ ቅርንጫፍ (POESSA Branch)</label><input type="text" name="poessaBranch" value={formData.poessaBranch} onChange={handleChange} required /></div>
              <div className="input-group"><label>የባንክ ስም (Bank Name)</label><input type="text" name="bankName" value={formData.bankName} onChange={handleChange} required /></div>
              <div className="input-group"><label>የባንክ ቅርንጫፍ (Bank Branch)</label><input type="text" name="bankBranch" value={formData.bankBranch} onChange={handleChange} required /></div>
              <div className="input-group"><label>የጡረታ አበል መጠን (Pension Amount)</label><input type="number" name="pensionAmount" value={formData.pensionAmount} onChange={handleChange} required /></div>
            </div>

            {status && <p className="status-message">{status}</p>}
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'በመመዝገብ ላይ ...' : 'የጡረተኛውን መረጃ መዝግብ'}
            </button>
          </form>
        </div>
      )}

      {/* 📋 💳 የተገኘው የጡረተኛ ሙሉ መረጃ እና ዲጂታል መታወቂያ ማሳያ */}
      {registeredData && (
        <div className="id-card-wrapper">
          
          {/* ማኔጅመንት አዝራሮች */}
          <div className="admin-actions no-print" style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginBottom: '20px' }}>
            <button onClick={() => setIsEditing(true)} style={{ padding: '10px 20px', backgroundColor: '#dd6b20', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>📝 መረጃውን አርም (Edit)</button>
            <button onClick={handleDelete} style={{ padding: '10px 20px', backgroundColor: '#e53e3e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>🗑️ ሙሉ በሙሉ አጥፋ (Delete)</button>
          </div>

          {/* 📋 አዲስ፡ የጡረተኛው ሙሉ መረጃ ሰሌዳ (ለባለሙያው በግልጽ እንዲታይ) */}
          <div className="full-pensioner-info no-print" style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e0', padding: '20px', borderRadius: '8px', marginBottom: '25px', textAlign: 'left' }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#2b6cb0', borderBottom: '2px solid #e2e8f0', paddingBottom: '5px' }}>📋 የጡረተኛው ሙሉ የሲስተም መረጃ ዝርዝር</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', fontSize: '14px' }}>
              <div><strong>ሙሉ ስም:</strong> {registeredData.name}</div>
              <div><strong>የጡረታ ID:</strong> {registeredData.pensionerId}</div>
              <div><strong>የፋይዳ ቁጥር:</strong> {registeredData.faydaNumber}</div>
              <div><strong>የግብር መለያ (TIN):</strong> {registeredData.tin}</div>
              <div><strong>ስልክ ቁጥር:</strong> {registeredData.phone}</div>
              <div><strong>ዕድሜ / ጾታ:</strong> {registeredData.age} / {registeredData.gender}</div>
              <div><strong>መኖሪያ አድራሻ:</strong> {registeredData.address || "ያልተጠቀሰ"}</div>
              <div><strong>የፖኤሳ ቅርንጫፍ:</strong> {registeredData.poessaBranch}</div>
              <div><strong>የባንክ ስም / ቅርንጫፍ:</strong> {registeredData.bankName} ({registeredData.bankBranch})</div>
              <div><strong>የጡረታ አበል መጠን:</strong> {registeredData.pensionAmount} ETB</div>
              <div><strong>የተሰጠበት ቀን:</strong> {registeredData.issueDate || "ያልተጠቀሰ"}</div>
              <div><strong>የማብቂያ ጊዜ:</strong> {registeredData.expiryDate || "ያልተጠቀሰ"}</div>
            </div>
            <div style={{ marginTop: '15px', paddingTop: '10px', borderTop: '1px dashed #cbd5e0', fontSize: '12px', color: '#718096', display: 'flex', justifyContent: 'space-between' }}>
              <span>👤 የመዘገበው ባለሙያ፦ <strong>{registeredData.registeredBy}</strong></span>
              <span>🔄 የመጨረሻ ማሻሻያ ያደረገው፦ <strong>{registeredData.updatedBy}</strong></span>
            </div>
          </div>

          {/* ዲጂታል መታወቂያ ካርድ (ለመታተም ዝግጁ የሆነው) */}
          <div className="id-card" id="pensioner-id-card">
            <div className="id-card-header">
              <h3>POESSA DIGITAL ID</h3>
            </div>
            
            <div className="id-card-body">
              <div className="id-photo-zone">
                <img src={registeredData.imageSrc} alt="Pensioner" className="id-pensioner-img" />
                <p className="id-num">{registeredData.pensionerId}</p>
              </div>

              <div className="id-details-zone">
                <p><strong>ስም:</strong> {registeredData.name}</p>
                <p><strong>FAYDA No:</strong> {registeredData.faydaNumber}</p>
                <p><strong>ስልክ ቁጥር:</strong> {registeredData.phone}</p>
                <p><strong>አድራሻ:</strong> {registeredData.address || "አዲስ አበባ"}</p>
                <p><strong>ቅርንጫፍ:</strong> {registeredData.poessaBranch}</p>
                <p style={{fontSize: '11px', marginTop: '5px'}}><strong>የተሰጠበት ቀን:</strong> {registeredData.issueDate}</p>
                <p style={{fontSize: '11px', color: 'red'}}><strong>የማብቂያ ጊዜ:</strong> {registeredData.expiryDate}</p>
              </div>

              <div className="id-qr-zone">
                <QRCodeSVG 
                  value={JSON.stringify({ id: registeredData.pensionerId, fayda: registeredData.faydaNumber, name: registeredData.name })} 
                  size={90}
                  bgColor={"#ffffff"}
                  fgColor={"#000000"}
                  level={"M"}
                />
                <span className="qr-label">SCAN TO VERIFY</span>
              </div>
            </div>
            
            <div className="id-card-footer">
              <p>የግል ድርጅት ሰራተኞች ማህበራዊ ዋስትና አስተዳደር</p>
            </div>
          </div>
          <button onClick={handlePrint} className="print-btn no-print">🖨️ መታወቂያውን አትም (Print ID)</button>
        </div>
      )}
    </div>
  );
}

export default PensionerRegistration;
