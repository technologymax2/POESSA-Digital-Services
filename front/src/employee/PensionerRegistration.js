import React, { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react'; // QR ኮድ ለመፍጠር
import './PensionerRegistration.css';

function PensionerRegistration() {
  const [formData, setFormData] = useState({
    name: '', tin: '', phone: '', age: '', gender: '',
    faydaNumber: '', poessaBranch: '', bankName: '', bankBranch: '', pensionAmount: ''
  });

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [status, setStatus] = useState('');
  const [registeredData, setRegisteredData] = useState(null); // ለተመዘገበው ሰው መታወቂያ ማሳያ
  const fileInputRef = useRef(null);

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

    setStatus('የጡረተኛው መረጃ እየተመዘገበ ነው...');

    try {
      // ለጊዜው ዳታው በተሳካ ሁኔታ ተመዘገበ ብለን ለመታወቂያው እናዘጋጀዋለን
      // ወደፊት ከ Backend ሲመጣ እውነተኛ የጡረተኛ ID (የሰርቨር መታወቂያ ቁጥር) እዚህ ይተካል
      setRegisteredData({
        ...formData,
        pensionerId: `PENS-${Math.floor(100000 + Math.random() * 900000)}`, // ጊዜያዊ ቁጥር
        imageSrc: imagePreview
      });

      setStatus('🎉 የጡረተኛው መረጃ በተሳካ ሁኔታ ተመዝግቧል! መታወቂያው ከታች ተፈጥሯል።');
      
      // ፎርሙን ባዶ ማድረግ
      setFormData({
        name: '', tin: '', phone: '', age: '', gender: '',
        faydaNumber: '', poessaBranch: '', bankName: '', bankBranch: '', pensionAmount: ''
      });
      setImage(null);
      setImagePreview(null);
    } catch (err) {
      setStatus('❌ ስህተት፡ መመዝገብ አልተቻለም።');
    }
  };

  // መታወቂያውን ብቻ ለይቶ ለመፕሪንት (ለማተም)
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="registration-container">
      <div className="no-print">
        <h2 className="form-title">POESSA የጡረተኞች ምዝገባ ቅጽ</h2>
        <p className="form-subtitle">የሰራተኞች መመዝገቢያ ዴስክ (የQR መታወቂያ ማውጫ ጨምሮ)</p>

        <form onSubmit={handleSubmit} className="pensioner-form">
          {/* የፎቶ መጫኛ ክፍል */}
          <div className="image-upload-section">
            <div className="image-preview-box" onClick={() => fileInputRef.current.click()}>
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="preview-img" />
              ) : (
                <div className="upload-placeholder">
                  <span className="upload-icon">📷</span>
                  <span>የጡረተኛውን ፎቶ እዚህ ይጫኑ</span>
                </div>
              )}
            </div>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} style={{ display: 'none' }} />
          </div>

          {/* የፎርም ፊልዶች */}
          <div className="form-grid">
            <div className="input-group"><label>ሙሉ ስም (Name)</label><input type="text" name="name" value={formData.name} onChange={handleChange} required /></div>
            <div className="input-group"><label>የፋይዳ ቁጥር (16-Digit Fayda No)</label><input type="text" name="faydaNumber" value={formData.faydaNumber} onChange={handleChange} placeholder="16 ዲጂት ቁጥር" required /></div>
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
            <div className="input-group"><label>የፖኤሳ ቅርንጫፍ (POESSA Branch)</label><input type="text" name="poessaBranch" value={formData.poessaBranch} onChange={handleChange} required /></div>
            <div className="input-group"><label>የባንክ ስም (Bank Name)</label><input type="text" name="bankName" value={formData.bankName} onChange={handleChange} required /></div>
            <div className="input-group"><label>የባንክ ቅርንጫፍ (Bank Branch)</label><input type="text" name="bankBranch" value={formData.bankBranch} onChange={handleChange} required /></div>
            <div className="input-group"><label>የጡረታ አበል መጠን (Pension Amount)</label><input type="number" name="pensionAmount" value={formData.pensionAmount} onChange={handleChange} required /></div>
          </div>

          {status && <p className="status-message">{status}</p>}
          <button type="submit" className="submit-btn">የጡረተኛውን መረጃ መዝግብ</button>
        </form>
      </div>

      {/* 💳 የ QR ኮድ መታወቂያ ካርድ (የሚታየው ምዝገባ ሲጠናቀቅ ብቻ ነው) */}
      {registeredData && (
        <div className="id-card-wrapper">
          <div className="id-card" id="pensioner-id-card">
            <div className="id-card-header">
              <h3>POESSA DIGITAL ID</h3>
              <p>የጡረተኞች የህይወት ማረጋገጫ ሲስተም</p>
            </div>
            
            <div className="id-card-body">
              <div className="id-photo-zone">
                <img src={registeredData.imageSrc} alt="Pensioner" className="id-pensioner-img" />
                <p className="id-num">{registeredData.pensionerId}</p>
              </div>

              <div className="id-details-zone">
                <p><strong>ስም:</strong> {registeredData.name}</p>
                <p><strong>FAYDA No:</strong> {registeredData.faydaNumber}</p>
                <p><strong>ቅርንጫፍ:</strong> {registeredData.poessaBranch}</p>
                <p><strong>ባንክ:</strong> {registeredData.bankName}</p>
                <p><strong>አበል:</strong> {registeredData.pensionAmount} ብር</p>
              </div>

              <div className="id-qr-zone">
                {/* QR ኮዱ በውስጡ የጡረተኛውን መለያ ቁጥር ይይዛል */}
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
              <p>ይህ ካርድ በህይወት መኖርን በዲጂታል መንገድ ለማረጋገጫነት ያገለግላል።</p>
            </div>
          </div>
          <button onClick={handlePrint} className="print-btn no-print">🖨️ መታወቂያውን አትም (Print ID)</button>
        </div>
      )}
    </div>
  );
}

export default PensionerRegistration;
