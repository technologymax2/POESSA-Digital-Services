import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as faceapi from 'face-api.js'; // face-api.js መጫኑን ያረጋግጡ (npm install face-api.js)
import './PensionerRegistration.css';

const IMGBB_API_KEY = "ebd592608f4dba1e8271bec8e920c408";

function PensionerRegistration() {
  const [currentEmployee, setCurrentEmployee] = useState('የፖኤሳ ሰራተኛ');
  const [modelsLoaded, setModelsLoaded] = useState(false);
  
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

  // 1. የፊት ማወቂያ ሞዴሎችን መጫን
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models'; // የሞዴል ፋይሎቹ በ public/models ውስጥ መኖር አለባቸው
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
      ]);
      setModelsLoaded(true);
    };
    loadModels();
    
    const storedName = localStorage.getItem('fullName') || localStorage.getItem('username');
    if (storedName) setCurrentEmployee(storedName);
  }, []);

  const debounceCheck = useCallback((fieldName, value) => {
    if (!value || value.length < 5) return;
    setCheckingStatus(prev => ({ ...prev, [fieldName]: true }));
    const handler = setTimeout(async () => {
      try {
        const response = await fetch(`https://poessa-digital-services-1.onrender.com/api/pensioners/check-duplicate?field=${fieldName}&value=${value}`);
        const data = await response.json();
        if (data.exists) {
          setDuplicateErrors(prev => ({ ...prev, [fieldName]: true }));
          setValidationErrors(prev => ({ ...prev, [fieldName]: `⚠️ ይህ ${fieldName} ቀድሞ ተመዝግቧል!` }));
        } else {
          setDuplicateErrors(prev => ({ ...prev, [fieldName]: false }));
          setValidationErrors(prev => { const newErrors = { ...prev }; delete newErrors[fieldName]; return newErrors; });
        }
      } catch (err) { console.error(err); } finally { setCheckingStatus(prev => ({ ...prev, [fieldName]: false })); }
    }, 500);
    return () => clearTimeout(handler);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (['pensionerId', 'tin', 'faydaNumber'].includes(name)) debounceCheck(name, value);
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
    if (!image) return setStatus('⚠️ እባክዎ ፎቶ ይምረጡ!');
    if (!modelsLoaded) return setStatus('⏳ ሞዴል እየተጫነ ነው፣ እባክዎ ይጠብቁ...');

    setLoading(true);
    setStatus('⏳ ፊትን በመተንተን እና መረጃ በመመዝገብ ላይ...');

    try {
      // 2. ፊትን መተንተን እና Face Descriptor ማውጣት
      const imgElement = document.createElement('img');
      imgElement.src = imagePreview;
      await new Promise((resolve) => (imgElement.onload = resolve));
      
      const detection = await faceapi.detectSingleFace(imgElement, new faceapi.TinyFaceDetectorOptions())
                                     .withFaceLandmarks()
                                     .withFaceDescriptor();

      if (!detection) throw new Error("ፊት በግልጽ አልተገኘም! እባክዎ ጥራት ያለው ፎቶ ይጠቀሙ።");

      // 3. ፎቶን ወደ ImgBB መላክ
      const imgData = new FormData();
      imgData.append('image', image);
      const imgRes = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: 'POST', body: imgData });
      const imgResult = await imgRes.json();
      if (!imgResult.success) throw new Error('ፎቶውን ወደ Cloud መላክ አልተቻለም');

      // 4. መረጃን ከ faceDescriptor ጋር ወደ ዳታቤዝ መላክ
      const finalData = { 
        ...formData, 
        photoUrl: imgResult.data.url, 
        faceDescriptor: Array.from(detection.descriptor), // 🌟 ዋናው ክፍል
        employeeName: currentEmployee,
        lastAction: 'Created',
        lastActionTime: new Date().toISOString()
      };

      const response = await fetch('https://poessa-digital-services-1.onrender.com/api/pensioners/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalData),
      });

      if (response.ok) {
        setStatus('🎉 መረጃው በተሳካ ሁኔታ ተመዝግቧል!');
        setFormData({ pensionerId: '', nameAmh: '', nameEng: '', tin: '', phone: '', age: '', gender: '', faydaNumber: '', poessaBranch: '', bankNameAmh: '', bankNameEng: '', bankBranch: '', pensionAmount: '', addressAmh: '', addressEng: '', issueDate: '', expiryDate: '' });
        setImage(null); setImagePreview(null);
      } else {
        throw new Error("መረጃ መላክ አልተቻለም");
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
