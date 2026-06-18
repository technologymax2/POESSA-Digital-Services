import React, { useState, useRef, useEffect } from 'react';
import './PensionerRegistration.css';

const IMGBB_API_KEY = "ebd592608f4dba1e8271bec8e920c408";

function PensionerRegistration() {
  const [currentEmployee, setCurrentEmployee] = useState('የፖኤሳ ሰራተኛ');
  
  const [formData, setFormData] = useState({
    pensionerId: '', nameAmh: '', nameEng: '', tin: '', phone: '', age: '', gender: '',
    faydaNumber: '', poessaBranch: '', bankNameAmh: '', bankNameEng: '', bankBranch: '', pensionAmount: '',
    addressAmh: '', addressEng: '', issueDate: '', expiryDate: ''
  });

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const [validationErrors, setValidationErrors] = useState({});
  // 🔥 ልዩ የሆኑ ፊልዶች በዳታቤዝ ውስጥ መኖራቸውን መቆጣጠሪያ ስቴት
  const [duplicateErrors, setDuplicateErrors] = useState({ pensionerId: false, tin: false, faydaNumber: false });

  useEffect(() => {
    const storedName = localStorage.getItem('fullName') || localStorage.getItem('username');
    if (storedName) setCurrentEmployee(storedName);
  }, []);

  // 🔥 ቁጥሩ ቀድሞ መመዝገቡን ከሰርቨር ላይ ቼክ የሚያደርግ ፈንክሽን
  const checkDuplication = async (fieldName, value) => {
    if (!value || value.length < 5) return; // ቁጥሩ በጣም አጭር ከሆነ አይፈልግም

    try {
      // ማስታወሻ፡ የኤፒአይ ሊንኩን እንደ ሰርቨርህ route ማስተካከል ትችላለህ (ለምሳሌ፡ /api/pensioners/check-duplicate)
      const response = await fetch(`https://poessa-digital-services-1.onrender.com/api/pensioners/check-duplicate?field=${fieldName}&value=${value}`);
      const data = await response.json();
      
      if (data.exists) {
        setDuplicateErrors(prev => ({ ...prev, [fieldName]: true }));
        setValidationErrors(prev => ({ ...prev, [fieldName]: `⚠️ ይህ ${fieldName === 'pensionerId' ? 'Pension ID' : fieldName === 'tin' ? 'TIN ቁጥር' : 'የፋይዳ ቁጥር'} ቀድሞ ተመዝግቧል!` }));
      } else {
        setDuplicateErrors(prev => ({ ...prev, [fieldName]: false }));
        // ሌላ የዲጂት ብዛት ስህተት ከሌለ ብቻ ያጠፋዋል
        if (value.length === 10 || fieldName === 'faydaNumber') {
          setValidationErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[fieldName];
            return newErrors;
          });
        }
      }
    } catch (err) {
      console.error("የመደጋገም ማረጋገጫ ስህተት:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let errors = { ...validationErrors };

    if (['pensionerId', 'phone', 'tin'].includes(name)) {
      let cleanValue = value.replace(/\D/g, ''); 

      if (name === 'phone' && cleanValue.length > 0) {
        if (cleanValue[0] !== '0') {
          errors[name] = "⚠️ ስልክ ቁጥር በ '0' መጀመር አለበት!";
          setValidationErrors(errors);
          return;
        } else {
          delete errors[name];
        }
      }

      if (cleanValue.length > 10) {
        cleanValue = cleanValue.substring(0, 10);
      }

      if (cleanValue.length > 0 && cleanValue.length < 10) {
        errors[name] = `⚠️ ልክ 10 ዲጂት መሆን አለበት! (አሁን፡ ${cleanValue.length})`;
      } else {
        delete errors[name];
        // ቁጥሩ ልክ 10 ሲሞላ ብቻ በባክኤንድ እንዳይደገም ቼክ ያደርጋል
        if (name === 'pensionerId' || name === 'tin') {
          checkDuplication(name, cleanValue);
        }
      }

      setFormData(prev => ({ ...prev, [name]: cleanValue }));
    } 
    else if (['age', 'pensionAmount'].includes(name)) {
      if (value < 0) return;
      setFormData(prev => ({ ...prev, [name]: value }));
    } 
    else {
      setFormData(prev => ({ ...prev, [name]: value }));
      // ለፋይዳ ቁጥር (ፊደልና ቁጥር ሊኖረው ስለሚችል በተለየ ሁኔታ ቼክ ይደረጋል)
      if (name === 'faydaNumber') {
        checkDuplication(name, value);
      }
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

    // 🛑 የተደገመ መረጃ ካለ ፎርሙ እንዳይላክ በጽኑ መከልከል
    if (duplicateErrors.pensionerId || duplicateErrors.tin || duplicateErrors.faydaNumber) {
      setStatus('❌ እባክዎ የተደገሙ መረጃዎችን ያስተካክሉ!');
      return;
    }

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
      const imgData = new FormData();
      imgData.append('image', image);
      
      const imgRes = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: imgData,
      });
      const imgResult = await imgRes.json();
      if (!imgResult.success) throw new Error('ፎቶውን ወደ Cloud ማከማቻ መላክ አልተቻለም');

      const finalData = { 
        ...formData, 
        photoUrl: imgResult.data.url, 
        employeeName: currentEmployee,
        lastAction: 'Created',
        lastActionTime: new Date().toISOString()
      };

      const response = await fetch('https://poessa-digital-services-1.onrender.com/api/pensioners/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalData),
      });

      const result = await response.json();
      if (result.success) {
        setStatus('🎉 መረጃው በተሳካ ሁኔታ ተመዝግቧል!');
        setValidationErrors({});
        setDuplicateErrors({ pensionerId: false, tin: false, faydaNumber: false });
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
          <div className="pr-input-group">
            <label>Pension ID (10 Digits)</label>
            <input type="text" name="pensionerId" value={formData.pensionerId} onChange={handleChange} required style={{ borderColor: duplicateErrors.pensionerId ? 'red' : '' }} />
            {validationErrors.pensionerId && <span className="error-text" style={{color: 'red', fontSize: '11px', display:'block', marginTop:'3px'}}>{validationErrors.pensionerId}</span>}
          </div>
          <div className="pr-input-group">
            <label>TIN ቁጥር / TIN (10 Digits)</label>
            <input type="text" name="tin" value={formData.tin} onChange={handleChange} required style={{ borderColor: duplicateErrors.tin ? 'red' : '' }} />
            {validationErrors.tin && <span className="error-text" style={{color: 'red', fontSize: '11px', display:'block', marginTop:'3px'}}>{validationErrors.tin}</span>}
          </div>
          <div className="pr-input-group">
            <label>ስልክ ቁጥር / Phone (0... 10 Digits)</label>
            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required />
            {validationErrors.phone && <span className="error-text" style={{color: 'red', fontSize: '11px', display:'block', marginTop:'3px'}}>{validationErrors.phone}</span>}
          </div>
          <div className="pr-input-group">
            <label>የፋይዳ ቁጥር</label>
            <input type="text" name="faydaNumber" value={formData.faydaNumber} onChange={handleChange} required style={{ borderColor: duplicateErrors.faydaNumber ? 'red' : '' }} />
            {validationErrors.faydaNumber && <span className="error-text" style={{color: 'red', fontSize: '11px', display:'block', marginTop:'3px'}}>{validationErrors.faydaNumber}</span>}
          </div>

          <div className="pr-input-group"><label>Profiles ሙሉ ስም (አማርኛ)</label><input type="text" name="nameAmh" value={formData.nameAmh} onChange={handleChange} required /></div>
          <div className="pr-input-group"><label>Full Name (English)</label><input type="text" name="nameEng" value={formData.nameEng} onChange={handleChange} required /></div>

          <div className="pr-input-group"><label>አድራሻ (አማርኛ)</label><input type="text" name="addressAmh" value={formData.addressAmh} onChange={handleChange} required /></div>
          <div className="pr-input-group"><label>Address (English)</label><input type="text" name="addressEng" value={formData.addressEng} onChange={handleChange} required /></div>

          <div className="pr-input-group"><label>ባንክ ስም (አማርኛ)</label><input type="text" name="bankNameAmh" value={formData.bankNameAmh} onChange={handleChange} required /></div>
          <div className="pr-input-group"><label>Bank Name (English)</label><input type="text" name="bankNameEng" value={formData.bankNameEng} onChange={handleChange} required /></div>

          <div className="pr-input-group"><label>ዕድሜ</label><input type="number" name="age" min="0" value={formData.age} onChange={handleChange} required /></div>
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
          <div className="pr-input-group"><label>የጡረታ መጠን</label><input type="number" name="pensionAmount" min="0" value={formData.pensionAmount} onChange={handleChange} required /></div>
        </div>

        {status && <div className="pr-status-msg">{status}</div>}
        <button type="submit" className="pr-submit-btn" disabled={loading || duplicateErrors.pensionerId || duplicateErrors.tin || duplicateErrors.faydaNumber}>
          {loading ? 'እየተላከ ነው...' : 'መረጃውን መዝግብ'}
        </button>
      </form>
    </div>
  );
}

export default PensionerRegistration;
