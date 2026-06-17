import React, { useState, useRef, useEffect } from 'react';
import './PensionerRegistration.css';

const IMGBB_API_KEY = "ebd592608f4dba1e8271bec8e920c408";

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
    const storedName = localStorage.getItem('fullName') || localStorage.getItem('username');
    if (storedName) setCurrentEmployee(storedName);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
        employeeName: currentEmployee 
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
        // Form ማጽዳት
        setFormData({ pensionerId: '', name: '', tin: '', phone: '', age: '', gender: '', faydaNumber: '', poessaBranch: '', bankName: '', bankBranch: '', pensionAmount: '', address: '', issueDate: '', expiryDate: '' });
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
          <div className="pr-input-group"><label>Pension ID</label><input type="text" name="pensionerId" value={formData.pensionerId} onChange={handleChange} required /></div>
          <div className="pr-input-group"><label>ሙሉ ስም</label><input type="text" name="name" value={formData.name} onChange={handleChange} required /></div>
          <div className="pr-input-group"><label>የፋይዳ ቁጥር</label><input type="text" name="faydaNumber" value={formData.faydaNumber} onChange={handleChange} required /></div>
          <div className="pr-input-group"><label>TIN ቁጥር</label><input type="text" name="tin" value={formData.tin} onChange={handleChange} required /></div>
          <div className="pr-input-group"><label>ስልክ ቁጥር</label><input type="tel" name="phone" value={formData.phone} onChange={handleChange} required /></div>
          <div className="pr-input-group"><label>ዕድሜ</label><input type="number" name="age" value={formData.age} onChange={handleChange} required /></div>
          <div className="pr-input-group"><label>ጾታ</label>
            <select name="gender" value={formData.gender} onChange={handleChange} required>
              <option value="">ይምረጡ</option>
              <option value="Male">ወንድ</option>
              <option value="Female">ሴት</option>
            </select>
          </div>
          <div className="pr-input-group"><label>አድራሻ</label><input type="text" name="address" value={formData.address} onChange={handleChange} required /></div>
          <div className="pr-input-group"><label>የተሰጠበት ቀን</label><input type="date" name="issueDate" value={formData.issueDate} onChange={handleChange} required /></div>
          <div className="pr-input-group"><label>የማብቂያ ቀን</label><input type="date" name="expiryDate" value={formData.expiryDate} onChange={handleChange} required /></div>
          <div className="pr-input-group"><label>ቅርንጫፍ</label><input type="text" name="poessaBranch" value={formData.poessaBranch} onChange={handleChange} required /></div>
          <div className="pr-input-group"><label>ባንክ</label><input type="text" name="bankName" value={formData.bankName} onChange={handleChange} required /></div>
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
