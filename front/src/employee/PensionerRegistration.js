import React, { useState, useRef, useEffect } from 'react';
import './PensionerRegistration.css'; // የጋራ CSS

function PensionerRegistration() {
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
    // ሰራተኛው መግባቱን ማረጋገጫ
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
    
    // 🚨 ከስቴት መዘግየት ለማምለጥ በቀጥታ ከ localStorage መውሰድ ሰርቨር ስህተትን ይከላከላል
    const activeEmployee = localStorage.getItem('user') || localStorage.getItem('username') || currentEmployee;

    if (formData.faydaNumber.length !== 16) {
      setStatus('⚠️ እባክዎ ትክክለኛ የፋይዳ ቁጥር (16 ዲጂት) ያስገቡ!');
      return;
    }
    if (!image) {
      setStatus('⚠️ እባክዎ የጡረተኛውን ማነጻጸሪያ ፎቶ ይጫኑ!');
      return;
    }

    setStatus('⏳ የጡረተኛው መረጃ ወደ ሰርቨር እየተላከ ነው፣ እባክዎ ይጠብቁ...');
    setLoading(true);

    const dataToSend = new FormData();
    dataToSend.append('photo', image);
    dataToSend.append('employeeName', activeEmployee);
    Object.keys(formData).forEach(key => dataToSend.append(key, formData[key]));

    try {
      const response = await fetch('https://poessa-digital-services-1.onrender.com/api/pensioners/register', {
        method: 'POST',
        body: dataToSend, // 🚨 ማሳሰቢያ፡ FormData ሲላክ Headers (Content-Type) መጫን አያስፈልግም
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
        // 🚨 ሰርቨሩ ራሱ ውድቅ ካደረገው የሚመልሰውን ትክክለኛ ምክንያት እዚህ ያሳያል
        setStatus(`❌ የሰርቨር እምቢታ፡ ${result.message || 'ያልታወቀ ስህተት'}`);
      }
    } catch (err) {
      // 🚨 የኔትወርክ ወይም የሊንክ ስህተት ካለ እዚህ ይያዛል
      setStatus(`❌ ከሰርቨር ጋር መገናኘት አልተቻለም። ዝርዝር፡ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="registration-container no-print" style={{ boxShadow: 'none', padding: '0' }}>
      
      {/* 💡 አሰልቺው የ Route አዝራሮች ከዚህ ተወግደዋል፤ ምክንያቱም ዳሽቦርዱ ራሱ በቁልፍ ስለሚቆጣጠረው ኮዱን ንጹህ ያደርገዋል */}

      <h2 className="form-title">POESSA የጡረተኞች ምዝገባ ቅጽ</h2>
      <p className="form-subtitle">የሰራተኞች መመዝገቢያ ዴስክ | ፈጻሚ፡ <span style={{color: '#2b6cb0', fontWeight: 'bold'}}>{currentEmployee}</span></p>

      <form onSubmit={handleSubmit} className="pensioner-form">
        <div className="image-upload-section">
          <div className="image-preview-box" onClick={() => fileInputRef.current.click()} style={{ width: '130px', height: '150px' }}>
            {imagePreview ? <img src={imagePreview} alt="Preview" className="preview-img" /> : (
              <div className="upload-placeholder"><span className="upload-icon">📷</span><span>የጡረተኛውን ፎቶ ይጫኑ</span></div>
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

        {status && (
          <p className="status-message" style={{ 
            padding: '10px', 
            borderRadius: '4px', 
            backgroundColor: status.includes('❌') ? '#fff5f5' : '#f0fff4',
            color: status.includes('❌') ? '#e53e3e' : '#38a169',
            fontWeight: 'bold',
            border: status.includes('❌') ? '1px solid #fed7d7' : '1px solid #c6f6d5'
          }}>
            {status}
          </p>
        )}
        
        <button type="submit" className="submit-btn" disabled={loading} style={{ marginTop: '10px' }}>
          {loading ? '⏳ መረጃው እየተላከ ነው...' : '💾 የጡረተኛውን መረጃ መዝግብ'}
        </button>
      </form>
    </div>
  );
}

export default PensionerRegistration;
