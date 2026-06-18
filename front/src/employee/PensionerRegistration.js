import React, { useState, useRef, useEffect } from 'react';
import './PensionerRegistration.css';

const IMGBB_API_KEY = "ebd592608f4dba1e8271bec8e920c408";

function PensionerRegistration() {
  const [currentEmployee, setCurrentEmployee] = useState('የፖኤሳ ሰራተኛ');
  
  // 🔥 ባለሁለት ቋንቋ ፊልዶችን ባካተተ መልኩ የተሻሻለ formData
  const [formData, setFormData] = useState({
    pensionerId: '', 
    nameAmh: '', nameEng: '', 
    tin: '', phone: '', age: '', gender: '',
    faydaNumber: '', poessaBranch: '', 
    bankNameAmh: '', bankNameEng: '', 
    bankBranch: '', pensionAmount: '',
    addressAmh: '', addressEng: '', 
    issueDate: '', expiryDate: ''
  });

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  // 🔥 ለቫሊዴሽን ስህተቶች መልዕክት ማስቀመጫ ስቴት
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    const storedName = localStorage.getItem('fullName') || localStorage.getItem('username');
    if (storedName) setCurrentEmployee(storedName);
  }, []);

  // 🔥 ጥብቅ የቁጥር እና የርዝመት ቫሊዴሽን የሚሰራው የሪል-ታይም መቆጣጠሪያ
  const handleChange = (e) => {
  const { name, value } = e.target;
  let errors = { ...validationErrors };

  // 🔢 ቁጥር ብቻ እና ልክ 10 ዲጂት መሆን ያለባቸው ፊልዶች ህግ (Pension ID, TIN, Phone)
  if (['pensionerId', 'phone', 'tin'].includes(name)) {
    let cleanValue = value.replace(/\D/g, ''); // ከቁጥር ውጪ ያሉትን ያጠፋል

    // 📱 ለስልክ ቁጥር ልዩ ህግ
    if (name === 'phone' && cleanValue.length > 0) {
      if (cleanValue[0] !== '0') {
        errors[name] = "⚠️ ስልክ ቁጥር በ '0' መጀመር አለበት!";
        setValidationErrors(errors);
        return; // ወደ ስቴት እንዳይገባ እዚሁ ይቆማል
      } else {
        delete errors[name]; // በ '0' ከጀመረ የቀደመውን ስህተት ያጠፋል
      }
    }

    // 🛑 ከ 10 ዲጂት በላይ እንዳይሄድ መገደብ
    if (cleanValue.length > 10) {
      cleanValue = cleanValue.substring(0, 10);
    }

    // የዲጂት ብዛት ማረጋገጫ
    if (cleanValue.length > 0 && cleanValue.length < 10) {
      errors[name] = `⚠️ ልክ 10 ዲጂት መሆን አለበት! (አሁን፡ ${cleanValue.length})`;
    } else {
      delete errors[name]; // ልክ 10 ሲሞላ ስህተቱን ያጸዳል
    }

    setFormData(prev => ({ ...prev, [name]: cleanValue }));
  } 
  // ⛔ ለዕድሜ እና ለጡረታ መጠን (አሉታዊ ቁጥር ለመከላከል)
  else if (['age', 'pensionAmount'].includes(name)) {
    if (value < 0) return; // ከዜሮ በታች መጻፍ አይቻልም
    setFormData(prev => ({ ...prev, [name]: value }));
  } 
  // ✍️ ለሌሎች መደበኛ የጽሑፍ ፊልዶች
  else {
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  setValidationErrors(errors);
};


  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
      setStatus('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!image) {
      setStatus('⚠️ እባክዎ የጡረተኛውን ፎቶ ይምረጡ!');
      return;
    }

    // 🛑 ፎርሙ ከመላኩ በፊት እያንዳንዱ ቁጥር ልክ 10 ዲጂት መሆኑን የመጨረሻ ማረጋገጫ
    const requiredNumbers = ['pensionerId', 'phone', 'tin'];
    let finalErrors = {};
    
    requiredNumbers.forEach(field => {
      if (!formData[field] || formData[field].length !== 10) {
        finalErrors[field] = "⚠️ ይህ መረጃ ልክ 10 ዲጂት መሆን አለበት!";
      }
    });

    if (Object.keys(finalErrors).length > 0) {
      setValidationErrors(finalErrors);
      setStatus('❌ እባክዎ የፎርሙን ስህተቶች ያስተካክሉ!');
      return;
    }

    setLoading(true);
    setStatus('⏳ መረጃው በመመዝገብ ላይ ነው...');

    try {
      // 1. ፎቶውን ወደ ImgBB መላክ
      const imgData = new FormData();
      imgData.append('image', image);
      
      const imgRes = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: imgData,
      });
      const imgResult = await imgRes.json();
      
      if (!imgResult.success) throw new Error('ፎቶውን ወደ Cloud ማከማቻ መላክ አልተቻለም');

      // 2. የተገኘውን ሊንክ ከ formData ጋር ማዋሃድ
      const finalData = { 
        ...formData, 
        photoUrl: imgResult.data.url, 
        employeeName: currentEmployee,
        lastAction: 'Created',
        lastActionTime: new Date().toISOString()
      };

      // 3. ወደ ሰርቨር መላክ
      const response = await fetch('https://poessa-digital-services-1.onrender.com/api/pensioners/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalData),
      });

      const result = await response.json();
      if (result.success) {
        setStatus('🎉 መረጃው በተሳካ ሁኔታ ተመዝግቧል!');
        setValidationErrors({});
        // Form ማጽዳት (ሁሉንም አዳዲስ ባለሁለት ቋንቋ ፊልዶች ጨምሮ)
        setFormData({ 
          pensionerId: '', nameAmh: '', nameEng: '', tin: '', phone: '', age: '', gender: '',
          faydaNumber: '', poessaBranch: '', bankNameAmh: '', bankNameEng: '', bankBranch: '', pensionAmount: '',
          addressAmh: '', addressEng: '', issueDate: '', expiryDate: '' 
        });
        setImage(null);
        setImagePreview(null);
      } else {
        setStatus(`❌ ስህተት፡ ${result.message}`);
      }
    } catch (err) {
      setStatus(`❌ ስህተት፡ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pr-reg-container">
      <h2 className="pr-form-title">POESSA የጡረተኞች ምዝገባ</h2>
      <p>ፈጻሚ ባለሙያ: <strong>{currentEmployee}</strong></p>

      <form onSubmit={handleSubmit} className="pr-main-form">
        <div className="pr-image-section">
          <div className="pr-image-box" onClick={() => fileInputRef.current?.click()}>
            {imagePreview ? <img src={imagePreview} alt="Preview" className="pr-preview-img" /> : 
              <div className="pr-placeholder">📷 ፎቶ ይምረጡ</div>}
          </div>
          <input type="file" ref={fileInputRef} onChange={handleImageChange} style={{ display: 'none' }} accept="image/*" />
        </div>

        <div className="pr-grid">
          {/* ጥብቅ የቁጥር ቫሊዴሽን ያላቸው ፊልዶች */}
          <div className="pr-input-group">
            <label>Pension ID (10 Digits)</label>
            <input type="text" name="pensionerId" value={formData.pensionerId} onChange={handleChange} required />
            {validationErrors.pensionerId && <span className="error-text" style={{color: 'red', fontSize: '11px', display:'block', marginTop:'3px'}}>{validationErrors.pensionerId}</span>}
          </div>
          <div className="pr-input-group">
            <label>TIN ቁጥር / TIN (10 Digits)</label>
            <input type="text" name="tin" value={formData.tin} onChange={handleChange} required />
            {validationErrors.tin && <span className="error-text" style={{color: 'red', fontSize: '11px', display:'block', marginTop:'3px'}}>{validationErrors.tin}</span>}
          </div>
          <div className="pr-input-group">
            <label>ስልክ ቁጥር / Phone (0... 10 Digits)</label>
            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required />
            {validationErrors.phone && <span className="error-text" style={{color: 'red', fontSize: '11px', display:'block', marginTop:'3px'}}>{validationErrors.phone}</span>}
          </div>
          <div className="pr-input-group"><label>የፋይዳ ቁጥር</label><input type="text" name="faydaNumber" value={formData.faydaNumber} onChange={handleChange} required /></div>

          {/* 🌐 ባለሁለት ቋንቋ ፊልዶች ክፍል */}
          <div className="pr-input-group"><label>ሙሉ ስም (አማርኛ)</label><input type="text" name="nameAmh" value={formData.nameAmh} onChange={handleChange} required /></div>
          <div className="pr-input-group"><label>Full Name (English)</label><input type="text" name="nameEng" value={formData.nameEng} onChange={handleChange} required /></div>

          <div className="pr-input-group"><label>አድራሻ (አማርኛ)</label><input type="text" name="addressAmh" value={formData.addressAmh} onChange={handleChange} required /></div>
          <div className="pr-input-group"><label>Address (English)</label><input type="text" name="addressEng" value={formData.addressEng} onChange={handleChange} required /></div>

          <div className="pr-input-group"><label>ባንክ ስም (አማርኛ)</label><input type="text" name="bankNameAmh" value={formData.bankNameAmh} onChange={handleChange} required /></div>
          <div className="pr-input-group"><label>Bank Name (English)</label><input type="text" name="bankNameEng" value={formData.bankNameEng} onChange={handleChange} required /></div>

          {/* የቀሩት መደበኛ ፊልዶች */}
          <div className="pr-input-group"><label>ዕድሜ</label><input type="number" name="age" value={formData.age} onChange={handleChange} required /></div>
          <div className="pr-input-group"><label>ጾታ</label>
            <select name="gender" value={formData.gender} onChange={handleChange} required>
              <option value="">ይምረጡ</option>
              <option value="Male">ወንድ / Male</option>
              <option value="Female">ሴት / Female</option>
            </select>
          </div>
          <div className="pr-input-group"><label>የተሰጠበት ቀን</label><input type="date" name="issueDate" value={formData.issueDate} onChange={handleChange} required /></div>
          <div className="pr-input-group"><label>የማብቂያ ቀን</label><input type="date" name="expiryDate" value={formData.expiryDate} onChange={handleChange} required /></div>
          <div className="pr-input-group"><label>ቅርንጫፍ</label><input type="text" name="poessaBranch" value={formData.poessaBranch} onChange={handleChange} required /></div>
          <div className="pr-input-group"><label>ባንክ ቅርንጫፍ</label><input type="text" name="bankBranch" value={formData.bankBranch} onChange={handleChange} required /></div>
          <div className="pr-input-group"><label>የጡረታ መጠን</label><input type="number" name="pensionAmount" value={formData.pensionAmount} onChange={handleChange} required /></div>
        </div>

        {status && <div className="pr-status-msg">{status}</div>}
        <button type="submit" className="pr-submit-btn" disabled={loading}>
          {loading ? 'እየተላከ ነው...' : 'መረጃውን መዝግብ'}
        </button>
      </form>
    </div>
  );
}

export default PensionerRegistration;
