import React, { useState, useRef, useEffect } from 'react';
import './PensionerRegistration.css'; 

function PensionerRegistration() {
  const [currentEmployee, setCurrentEmployee] = useState('የፖኤሳ ሰራተኛ');
  
  const [formData, setFormData] = useState({
    pensionerId: '', name: '', tin: '', phone: '', age: '', gender: '',
    faydaNumber: '', poessaBranch: '', bankName: '', bankBranch: '', pensionAmount: '',
    address: '', issueDate: '', expiryDate: '' 
  });

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // ከLocalStorage ትክክለኛውን ስም ብቻ እንዲወስድ ይደረጋል
    const storedName = localStorage.getItem('fullName') || localStorage.getItem('username');
    if (storedName) setCurrentEmployee(storedName);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'faydaNumber' && value.length > 16) return;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { 
        setStatus('⚠️ የፎቶው መጠን ከ 2MB መብለጥ የለበትም!');
        return;
      }
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
      setStatus('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.faydaNumber.length !== 16) {
      setStatus('⚠️ እባክዎ ትክክለኛ የፋይዳ ቁጥር (16 ዲጂት) ያስገቡ!');
      return;
    }
    if (!image) {
      setStatus('⚠️ እባክዎ የጡረተኛውን ፎቶ ይጫኑ!');
      return;
    }

    setLoading(true);
    setStatus('⏳ መረጃው ወደ ሰርቨር እየተላከ ነው...');

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
        setStatus(`🎉 ${result.message}`);
        setFormData({ pensionerId: '', name: '', tin: '', phone: '', age: '', gender: '', faydaNumber: '', poessaBranch: '', bankName: '', bankBranch: '', pensionAmount: '', address: '', issueDate: '', expiryDate: '' });
        setImage(null); setImagePreview(null);
      } else {
        setStatus(`❌ ስህተት፡ ${result.message}`);
      }
    } catch (err) {
      setStatus(`❌ ከሰርቨር ጋር መገናኘት አልተቻለም።`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pr-reg-container">
      <h2 className="pr-form-title">POESSA የጡረተኞች ምዝገባ</h2>
      <p className="pr-form-subtitle">ፈጻሚ ባለሙያ: <strong>{currentEmployee}</strong></p>

      <form onSubmit={handleSubmit} className="pr-main-form">
        <div className="pr-image-section">
          <div className="pr-image-box" onClick={() => fileInputRef.current?.click()}>
            {imagePreview ? <img src={imagePreview} alt="Preview" className="pr-preview-img" /> : 
              <div className="pr-placeholder">📷 ፎቶ ይምረጡ</div>}
          </div>
          <input type="file" ref={fileInputRef} onChange={handleImageChange} style={{ display: 'none' }} />
        </div>

        <div className="pr-grid">
          {/* ለሁሉም input-ዎች ተመሳሳይ የሆነ className መጠቀም */}
          <div className="pr-input-group"><label>Pension ID</label><input type="text" name="pensionerId" value={formData.pensionerId} onChange={handleChange} required /></div>
          <div className="pr-input-group"><label>ሙሉ ስም</label><input type="text" name="name" value={formData.name} onChange={handleChange} required /></div>
          <div className="pr-input-group"><label>የፋይዳ ቁጥር</label><input type="text" name="faydaNumber" value={formData.faydaNumber} onChange={handleChange} required /></div>
          <div className="pr-input-group"><label>TIN ቁጥር</label><input type="text" name="tin" value={formData.tin} onChange={handleChange} required /></div>
          <div className="pr-input-group"><label>ስልክ ቁጥር</label><input type="tel" name="phone" value={formData.phone} onChange={handleChange} required /></div>
          <div className="pr-input-group"><label>ዕድሜ</label><input type="number" name="age" value={formData.age} onChange={handleChange} required /></div>
          <div className="pr-input-group"><label>ጾታ</label><select name="gender" value={formData.gender} onChange={handleChange} required><option value="">ይምረጡ</option><option value="Male">ወንድ</option><option value="Female">ሴት</option></select></div>
          <div className="pr-input-group"><label>አድራሻ</label><input type="text" name="address" value={formData.address} onChange={handleChange} required /></div>
          <div className="pr-input-group"><label>የተሰጠበት ቀን</label><input type="date" name="issueDate" value={formData.issueDate} onChange={handleChange} required /></div>
          <div className="pr-input-group"><label>የማብቂያ ቀን</label><input type="date" name="expiryDate" value={formData.expiryDate} onChange={handleChange} required /></div>
          <div className="pr-input-group"><label>ቅርንጫፍ</label><input type="text" name="poessaBranch" value={formData.poessaBranch} onChange={handleChange} required /></div>
          <div className="pr-input-group"><label>ባንክ</label><input type="text" name="bankName" value={formData.bankName} onChange={handleChange} required /></div>
          <div className="pr-input-group"><label>ባንክ ቅርንጫፍ</label><input type="text" name="bankBranch" value={formData.bankBranch} onChange={handleChange} required /></div>
          <div className="pr-input-group"><label>የጡረታ መጠን</label><input type="number" name="pensionAmount" value={formData.pensionAmount} onChange={handleChange} required /></div>
        </div>

        {status && <div className="pr-status-msg">{status}</div>}
        <button type="submit" className="pr-submit-btn" disabled={loading}>{loading ? 'እየተላከ ነው...' : 'መረጃውን መዝግብ'}</button>
      </form>
    </div>
  );
}
export default PensionerRegistration;
