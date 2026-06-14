import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './PensionerRegistration.css'; // የጋራ CSS

function PensionerRegistration() {
  const navigate = useNavigate();
  const [currentEmployee, setCurrentEmployee] = useState('የፖኤሳ ሰራተኛ');
  
  const [formData, setFormData] = useState({
    pensionId: '', name: '', tin: '', phone: '', age: '', gender: '',
    faydaNumber: '', poessaBranch: '', bankName: '', bankBranch: '', pensionAmount: '',
    address: '', issueDate: '', expiryDate: '' 
  });

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user') || localStorage.getItem('username') || 'የፖኤሳ ሰራተኛ';
    setCurrentEmployee(storedUser);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'faydaNumber') {
      if (value.length > 16 || (value && !/^\d+$/.test(value))) return;
    }
    setFormData({ ...formData, [name]: value });
  };

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

    setStatus('የጡረተኛው መረጃ እየተላከ ነው...');
    setLoading(true);

    const dataToSend = new FormData();
    dataToSend.append('photo', image);
    dataToSend.append('employeeName', currentEmployee);
    Object.keys(formData).forEach(key => dataToSend.append(key, formData[key]));

    try {
      const response = await fetch('https://poessa-digital-services-1.onrender.com/api/pensioners/register', {
        method: 'POST',
        body: dataToSend,
      });
      const result = await response.json();
      if (result.success) {
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
      setStatus('❌ ከሰርቨር ጋር መገናኘት አልተቻለም።');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="registration-container no-print">
      
      {/* 🔝 Heading Route Navigation */}
      <div className="heading-route-tabs">
        <button className="route-btn active" onClick={() => navigate('/pensioner-registration')}>
          📝 አዲስ ጡረተኛ መመዝገቢያ ቅጽ
        </button>
        <button className="route-btn" onClick={() => navigate('/idcard-generation-search')}>
          🔍 መረጃ መፈለጊያ እና መታወቂያ ማውጫ
        </button>
      </div>

      <h2 className="form-title">POESSA የጡረተኞች ምዝገባ ቅጽ</h2>
      <p className="form-subtitle">የሰራተኞች መመዝገቢያ ዴስክ</p>

      <form onSubmit={handleSubmit} className="pensioner-form">
        <div className="image-upload-section">
          <div className="image-preview-box" onClick={() => fileInputRef.current.click()}>
            {imagePreview ? <img src={imagePreview} alt="Preview" className="preview-img" /> : (
              <div className="upload-placeholder"><span className="upload-icon">📷</span><span>የጡረተኛውን ፎቶ እዚህ ይጫኑ</span></div>
            )}
          </div>
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} style={{ display: 'none' }} />
        </div>

        <div className="form-grid">
          <div className="input-group"><label>የጡረታ መለያ ቁጥር (Pension ID)</label><input type="text" name="pensionId" value={formData.pensionId} onChange={handleChange} required /></div>
          <div className="input-group"><label>ሙሉ ስም (Name)</label><input type="text" name="name" value={formData.name} onChange={handleChange} required /></div>
          <div className="input-group"><label>የፋይዳ ቁጥር (16-Digit Fayda No)</label><input type="text" name="faydaNumber" value={formData.faydaNumber} onChange={handleChange} required /></div>
          <div className="input-group"><label>የግብር ከፋይ መለያ (TIN)</label><input type="text" name="tin" value={formData.tin} onChange={handleChange} required /></div>
          <div className="input-group"><label>ስልክ ቁጥር (Phone)</label><input type="tel" name="phone" value={formData.phone} onChange={handleChange} required /></div>
          <div className="input-group"><label>ዕድሜ (Age)</label><input type="number" name="age" value={formData.age} onChange={handleChange} required /></div>
          <div className="input-group">
            <label>ጾታ (Gender)</label>
            <select name="gender" value={formData.gender} onChange={handleChange} required>
              <option value="">ይምረጡ</option>
              <option value="Male">ወንድ (Male)</option>
              <option value="Female">ሴት (Female)</option>
            </select>
          </div>
          <div className="input-group"><label>አድራሻ (Address)</label><input type="text" name="address" value={formData.address} onChange={handleChange} required /></div>
          <div className="input-group"><label>የተሰጠበት ቀን</label><input type="date" name="issueDate" value={formData.issueDate} onChange={handleChange} required /></div>
          <div className="input-group"><label>የማብቂያ ጊዜ</label><input type="date" name="expiryDate" value={formData.expiryDate} onChange={handleChange} required /></div>
          <div className="input-group"><label>የፖኤሳ ቅርንጫፍ</label><input type="text" name="poessaBranch" value={formData.poessaBranch} onChange={handleChange} required /></div>
          <div className="input-group"><label>የባንክ ስም</label><input type="text" name="bankName" value={formData.bankName} onChange={handleChange} required /></div>
          <div className="input-group"><label>የባንክ ቅርንጫፍ</label><input type="text" name="bankBranch" value={formData.bankBranch} onChange={handleChange} required /></div>
          <div className="input-group"><label>የጡረታ አበል መጠን</label><input type="number" name="pensionAmount" value={formData.pensionAmount} onChange={handleChange} required /></div>
        </div>

        {status && <p className="status-message">{status}</p>}
        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'እባክዎ ይጠብቁ...' : 'የጡረተኛውን መረጃ መዝግብ'}
        </button>
      </form>
    </div>
  );
}

export default PensionerRegistration;
