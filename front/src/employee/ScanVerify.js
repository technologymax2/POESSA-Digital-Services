import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

import './ScanVerify.css';

function ScanVerify() {
  const { faydaNum } = useParams(); 
  const [pensioner, setPensioner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVerifiedData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`https://poessa-digital-services.vercel.app/api/pensioners/verify/${faydaNum}`);
        
        // 🚨 ባክኤንድህ የሚመልሰው success: true እና data: pensioner ስለሆነ response.data.data እንላለን
        if (response.data && response.data.success && response.data.data) {
          setPensioner(response.data.data);
          setError(null);
        } else {
          setError("የጡረተኛው መረጃ አልተገኘም።");
        }
      } catch (err) {
        console.error("Verification Error:", err);
        setError("የጡረተኛው መረጃ አልተገኘም ወይም ትክክለኛ መታወቂያ አይደለም።");
      } finally {
        setLoading(false);
      }
    };

    if (faydaNum) {
      fetchVerifiedData();
    }
  }, [faydaNum]);

  if (loading) {
    return (
      <div className="verify-loading-container">
        <div className="verify-spinner"></div>
        <p>የመታወቂያውን ትክክለኛነት በመመርመር ላይ...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="verify-error-container">
        <span className="error-icon">❌</span>
        <h3>የማረጋገጫ ስህተት (Verification Failed)</h3>
        <p>{error}</p>
        <small>የፋይዳ ቁጥር፦ {faydaNum}</small>
      </div>
    );
  }

  return (
    <div className="scan-verify-page">
      <div className="success-badge-header">
        <span className="success-icon">✓</span>
        <h2>የተረጋገጠ ዲጂታል መታወቂያ</h2>
        <p>Verified POESSA Digital ID</p>
      </div>

      {pensioner && (
        <div className={`verified-id-card ${pensioner.status?.toLowerCase() === 'passive' ? 'pensioner-dead' : ''}`}>
          
          <div className="verified-card-header">
            <div className="header-titles">
              <h3>POESSA DIGITAL ID CARD</h3>
              <p>የፌደራል የጡረታ ማህበራዊ ዋስትና ኤጀንሲ</p>
            </div>
            <span className={`status-badge-view ${pensioner.status?.toLowerCase() === 'active' ? 'badge-active' : 'badge-passive'}`}>
              {pensioner.status || 'Active'}
            </span>
          </div>

          <div className="verified-card-body">
            <div className="verified-photo-zone">
              {/* 🚨 ከባክኤንድህ የሚመጣው 'photoUrl' የተባለው ቁልፍ ነው */}
              <img 
                src={pensioner.photoUrl || "https://via.placeholder.com/150"} 
                alt="Pensioner" 
                className="verified-pensioner-img" 
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/150";
                }}
              />
              <div className="verified-dates-box">
                <p>የተሰጠበት፦ {pensioner.createdAt ? pensioner.createdAt.split('T')[0] : 'N/A'}</p>
                <p>የሚያበቃው፦ {pensioner.expiryDate || 'N/A'}</p>
              </div>
            </div>

            {/* 🚨 የፊልድ ስሞች ከእርስዎUserPensioner ሞዴል ጋር ተገጣጥመዋል */}
            <div className="verified-details-zone">
              <p>
                <span className="lbl">ስም / Name:</span>
                <span className="val val-name">{pensioner.name || pensioner.fullName || 'N/A'}</span>
              </p>
              <p>
                <span className="lbl">ፋይዳ / FAYDA:</span>
                <span className="val">{pensioner.faydaNumber || faydaNum}</span>
              </p>
              <p>
                <span className="lbl">ቲን / TIN:</span>
                <span className="val">{pensioner.tinNumber || pensioner.tin || 'N/A'}</span>
              </p>
              <p>
                <span className="lbl">ስልክ / Phone:</span>
                <span className="val">{pensioner.phone || pensioner.phoneNumber || 'N/A'}</span>
              </p>
              <p>
                <span className="lbl">አድራሻ / Addr:</span>
                <span className="val">{pensioner.address || 'N/A'}</span>
              </p>
              <p>
                <span className="lbl">ቅርንጫፍ / Br:</span>
                <span className="val">{pensioner.branch || 'N/A'}</span>
              </p>
            </div>
          </div>

          <div className="verified-card-footer">
            <p>የአይዲ ባለቤትነትን በስካን ማረጋገጫ ሰሌዳ | POESSA 2026</p>
          </div>
        </div>
      )}

      <div className="verify-action-footer">
        <p>© 2026 POESSA. All Rights Reserved.</p>
      </div>
    </div>
  );
}

export default ScanVerify;
