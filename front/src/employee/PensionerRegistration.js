import React, { useState, useRef, useEffect, useCallback } from 'react';
import './PensionerRegistration.css';
import * as faceapi from "face-api.js";


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
  const [duplicateErrors, setDuplicateErrors] = useState({ pensionerId: false, tin: false, faydaNumber: false });
  
  const [checkingStatus, setCheckingStatus] = useState({ pensionerId: false, tin: false, faydaNumber: false });

  useEffect(() => {
    const storedName = localStorage.getItem('fullName') || localStorage.getItem('username');
    if (storedName) setCurrentEmployee(storedName);
  }, []);


useEffect(() => {

async function loadModels(){

const MODEL_URL="/models";

await Promise.all([

faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),

faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),

faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)

]);

}

loadModels();

},[]);
  
  // 🔄 1. Debounce የተደረገ የደገሜታ ማረጋገጫ ፈንክሽን
  const debounceCheck = useCallback((fieldName, value) => {
    if (!value || value.length < 5) return;

    setCheckingStatus(prev => ({ ...prev, [fieldName]: true }));

    const handler = setTimeout(async () => {
      try {
        const response = await fetch(`https://poessa-digital-services-1.onrender.com/api/pensioners/check-duplicate?field=${fieldName}&value=${value}`);
        const data = await response.json();
        
        if (data.exists) {
          setDuplicateErrors(prev => ({ ...prev, [fieldName]: true }));
          setValidationErrors(prev => ({ ...prev, [fieldName]: `⚠️ ይህ ${fieldName === 'pensionerId' ? 'Pension ID' : fieldName === 'tin' ? 'TIN ቁጥር' : 'የፋይዳ ቁጥር'} ቀድሞ ተመዝግቧል!` }));
        } else {
          setDuplicateErrors(prev => ({ ...prev, [fieldName]: false }));
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
      } finally {
        setCheckingStatus(prev => ({ ...prev, [fieldName]: false }));
      }
    }, 500);

    return () => clearTimeout(handler);
  }, []);

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
        if ((name === 'pensionerId' || name === 'tin') && cleanValue.length === 10) {
          debounceCheck(name, cleanValue);
        }
      }

      setFormData(prev => ({ ...prev, [name]: cleanValue }));
    } 
    else if (['age', 'pensionAmount'].includes(name)) {
      if (value < 0) return;
      setFormData(prev => ({ ...prev, [name]: value }));
    } 
    else if (name === 'expiryDate' && formData.issueDate && value < formData.issueDate) {
      errors.expiryDate = "⚠️ የማብቂያ ቀን ከተሰጠበት ቀን ቀድሞ ሊሆን አይችልም!";
      setValidationErrors(errors);
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    else {
      if (name === 'expiryDate') delete errors.expiryDate;
      setFormData(prev => ({ ...prev, [name]: value }));
      if (name === 'faydaNumber') {
        debounceCheck(name, value);
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

    if (duplicateErrors.pensionerId || duplicateErrors.tin || duplicateErrors.faydaNumber || validationErrors.expiryDate) {
      setStatus('❌ እባክዎ የፎርሙን ስህተቶች ያስተካክሉ!');
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

const imgElement=document.createElement("img");

imgElement.src=imagePreview;

await new Promise((resolve)=>{
 imgElement.onload=resolve;
});
if (!faceapi.nets.faceRecognitionNet.params) {

   throw new Error("Face model not loaded");

}
const detection=await faceapi
.detectSingleFace(
 imgElement,
 new faceapi.TinyFaceDetectorOptions()
)
.withFaceLandmarks()
.withFaceDescriptor();

if(!detection){

 throw new Error("ፊት አልተገኘም");

}

const faceDescriptor=
Array.from(
 detection.descriptor
);



    
    try {
      const imgData = new FormData();
      imgData.append('image', image);
      
      const imgRes = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: imgData,
      });
      
      const imgResult = await imgRes.json();
      if (!imgResult.success) throw new Error('ፎቶውን ወደ Cloud ማከማቻ መላክ አልተቻለም');

      // 🌟 የፎቶው ሊንክ 'photoUrl' ተብሎ በዳታቤዝ ውስጥ ይቀመጣል
      const finalData = {
  ...formData,

  photoUrl: imgResult.data.url,

  registeredBy: currentEmployee,

  employeeName: currentEmployee,

  lastAction: "Created",

  faceDescriptor,

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
            {checkingStatus.pensionerId && <span style={{color: 'orange', fontSize: '11px'}}>⏳ በመፈለግ ላይ...</span>}
            {validationErrors.pensionerId && <span className="error-text" style={{color: 'red', fontSize: '11px', display:'block', marginTop:'3px'}}>{validationErrors.pensionerId}</span>}
          </div>

          <div className="pr-input-group">
            <label>TIN ቁጥር / TIN (10 Digits)</label>
            <input type="text" name="tin" value={formData.tin} onChange={handleChange} required style={{ borderColor: duplicateErrors.tin ? 'red' : '' }} />
            {checkingStatus.tin && <span style={{color: 'orange', fontSize: '11px'}}>⏳ በመፈለግ ላይ...</span>}
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
            {checkingStatus.faydaNumber && <span style={{color: 'orange', fontSize: '11px'}}>⏳ በመፈለግ ላይ...</span>}
            {validationErrors.faydaNumber && <span className="error-text" style={{color: 'red', fontSize: '11px', display:'block', marginTop:'3px'}}>{validationErrors.faydaNumber}</span>}
          </div>

          <div className="pr-input-group"><label>Profiles/ሙሉ ስም (አማርኛ)</label><input type="text" name="nameAmh" value={formData.nameAmh} onChange={handleChange} required /></div>
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
          
          <div className="pr-input-group">
            <label>የማብቂያ ቀን</label>
            <input type="date" name="expiryDate" value={formData.expiryDate} onChange={handleChange} required style={{ borderColor: validationErrors.expiryDate ? 'red' : '' }} />
            {validationErrors.expiryDate && <span className="error-text" style={{color: 'red', fontSize: '11px', display:'block', marginTop:'3px'}}>{validationErrors.expiryDate}</span>}
          </div>

          <div className="pr-input-group"><label>ቅርንጫፍ</label><input type="text" name="poessaBranch" value={formData.poessaBranch} onChange={handleChange} required /></div>
          <div className="pr-input-group"><label>ባንክ ቅርንጫፍ</label><input type="text" name="bankBranch" value={formData.bankBranch} onChange={handleChange} required /></div>
          <div className="pr-input-group"><label>የጡረታ መጠን</label><input type="number" name="pensionAmount" min="0" value={formData.pensionAmount} onChange={handleChange} required /></div>
        </div>

        {status && <div className="pr-status-msg">{status}</div>}
        
        <button type="submit" className="pr-submit-btn" disabled={loading || duplicateErrors.pensionerId || duplicateErrors.tin || duplicateErrors.faydaNumber || validationErrors.expiryDate}>
          {loading ? 'እየተላከ ነው...' : 'መረጃውን መዝግብ'}
        </button>
      </form>
    </div>
  );
}

export default PensionerRegistration;
