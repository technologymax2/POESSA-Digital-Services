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
        const response = await axios.get(`https://poessa-digital-services-1.onrender.com/api/pensioners/search?query=${faydaNum}`);
        
        if (response.data && response.data.success && response.data.data) {
          setPensioner(response.data.data);
          setError(null);
        } else {
          setError("የጡረተኛው መረጃ በሲስተሙ ላይ አልተገኘም።");
        }
      } catch (err) {
        console.error("Verification Network Error:", err);
        setError("የጡረተኛው መረጃ አልተገኘም ወይም የሰርቨር ግንኙነት ተቋርጧል።");
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
    <div className="scan-verify-page" style={{ padding: '20px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* 🟢 ትልቁ አረንጓዴ የሪቪው ምልክት እና የላይኛው ርዕስ */}
      <div className="success-badge-header" style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div className="success-icon-circle" style={{ width: '70px', height: '70px', backgroundColor: '#4ade80', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px auto', boxShadow: '0 4px 10px rgba(74, 222, 128, 0.3)' }}>
          <span style={{ color: 'white', fontSize: '35px', fontWeight: 'bold' }}>✓</span>
        </div>
        <h2 style={{ color: '#162447', margin: '0 0 5px 0', fontSize: '24px', fontWeight: 'bold' }}>የተረጋገጠ ዲጂታል መታወቂያ</h2>
        <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>Verified POESSA Digital ID</p>
      </div>

      {pensioner && (
        /* 🪪 ዋናው ካርድ - ከምስል 1000004956.jpg ጋር ፍጹም አንድ አይነት የተደረገ */
        <div className={`verified-id-card ${pensioner.status?.toLowerCase() === 'passive' ? 'pensioner-dead' : ''}`} style={{ border: '2px solid #162447', borderRadius: '12px', overflow: 'hidden', width: '100%', maxWidth: '430px', background: '#ffffff', boxShadow: '0 10px 25px rgba(0,0,0,0.08)', boxSizing: 'border-box' }}>
          
          {/* 💙 ሰማያዊው የሄደር ክፍል */}
          <div className="verified-card-header" style={{ background: '#162447', padding: '15px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
            
            {/* 🇪🇹 በኮምፒውተርም ሆነ በስልክ የሚሰራ ንፁህ የCSS ባንዲራ */}
            <div className="ethiopian-flag-css" style={{ width: '38px', height: '24px', borderRadius: '2px', overflow: 'hidden', display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'relative', boxShadow: '0 1px 2px rgba(0,0,0,0.3)', marginRight: '10px' }}>
              <div style={{ flex: 1, background: '#009c3a' }}></div>
              <div style={{ flex: 1, background: '#fed100' }}></div>
              <div style={{ flex: 1, background: '#ef3340' }}></div>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '10px', height: '10px', background: '#0039a6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ color: '#fed100', fontSize: '8px', fontWeight: 'bold', lineHeight: 0, transform: 'translateY(-1px)' }}>★</div>
              </div>
            </div>

            <div className="header-titles" style={{ flex: 1 }}>
              <h3 style={{ margin: 0, fontSize: '15px', letterSpacing: '0.5px', fontWeight: 'bold' }}>POESSA DIGITAL ID CARD</h3>
              <p style={{ fontSize: '10px', margin: '2px 0 0 0', color: '#cbd5e1' }}>የፌደራል የጡረታ ማህበራዊ ዋስትና ኤጀንሲ</p>
            </div>
            
            <span className={`status-badge-view ${pensioner.status?.toLowerCase() === 'active' ? 'badge-active' : 'badge-passive'}`} style={{ backgroundColor: pensioner.status?.toLowerCase() === 'passive' ? '#dc3545' : '#4ade80', color: 'white', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' }}>
              {pensioner.status || 'Active'}
            </span>
          </div>

          {/* 👤 የካርዱ አካል */}
          <div className="verified-card-body" style={{ padding: '15px', display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
            
            {/* የግራ ፎቶ እና የተሰጠበት ቀን ዞን (የማብቂያ ጊዜ ተወግዷል) */}
            <div className="verified-photo-zone" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '110px' }}>
              <img 
                src={pensioner.photoUrl || "https://via.placeholder.com/150"} 
                alt="Pensioner" 
                className="verified-pensioner-img" 
                style={{ width: '100px', height: '110px', borderRadius: '6px', objectFit: 'cover', border: '1px solid #cbd5e1' }}
                onError={(e) => { e.target.src = "https://via.placeholder.com/150"; }}
              />
              <div className="verified-dates-box" style={{ marginTop: '8px', fontSize: '9px', backgroundColor: '#f8fafc', padding: '6px', borderRadius: '6px', border: '1px solid #e2e8f0', width: '100%', boxSizing: 'border-box', textAlign: 'center', lineHeight: '1.4' }}>
                <p style={{ margin: 0, color: '#64748b' }}>የተሰጠበት፦ <span style={{ fontWeight: 'bold', color: '#334155', display: 'block', fontSize: '10px', marginTop: '2px' }}>{pensioner.issueDate ? pensioner.issueDate.substring(0,10) : '2026-06-18'}</span></p>
              </div>
            </div>

            {/* 📝 የቀኝ መረጃዎች ዞን */}
            <div className="verified-details-zone" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: '#334155' }}>
              <p style={{ margin: 0, display: 'flex', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>
                <span className="lbl" style={{ color: '#64748b', width: '75px', flexShrink: 0 }}>ስም / Name:</span>
                <span className="val val-name" style={{ fontWeight: 'bold', color: '#0f172a' }}>
                  {pensioner.nameAmh || pensioner.name || 'N/A'} {pensioner.nameEng ? `/ ${pensioner.nameEng}` : ''}
                </span>
              </p>
              <p style={{ margin: 0, display: 'flex', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>
                <span className="lbl" style={{ color: '#64748b', width: '75px', flexShrink: 0 }}>ፋይዳ / FAYDA:</span>
                <span className="val" style={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#0f172a' }}>{pensioner.faydaNumber || faydaNum}</span>
              </p>
              <p style={{ margin: 0, display: 'flex', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>
                <span className="lbl" style={{ color: '#64748b', width: '75px', flexShrink: 0 }}>ቲን / TIN:</span>
                <span className="val" style={{ fontWeight: '500' }}>{pensioner.tin || '0000987665'}</span>
              </p>
              <p style={{ margin: 0, display: 'flex', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>
                <span className="lbl" style={{ color: '#64748b', width: '75px', flexShrink: 0 }}>ስልክ / Phone:</span>
                <span className="val" style={{ fontWeight: '500' }}>{pensioner.phone || '0989860376'}</span>
              </p>
              <p style={{ margin: 0, display: 'flex', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>
                <span className="lbl" style={{ color: '#64748b', width: '75px', flexShrink: 0 }}>አድራሻ / Addr:</span>
                <span className="val" style={{ fontWeight: '500' }}>
                  {pensioner.addressAmh || pensioner.address || 'N/A'} {pensioner.addressEng ? `| ${pensioner.addressEng}` : ''}
                </span>
              </p>
              <p style={{ margin: 0, display: 'flex' }}>
                <span className="lbl" style={{ color: '#64748b', width: '75px', flexShrink: 0 }}>ቅርንጫፍ / Br:</span>
                <span className="val" style={{ fontWeight: '600', color: '#162447' }}>{pensioner.poessaBranch || 'Debub Addis Ababa'}</span>
              </p>
            </div>
          </div>

          {/* 🪙 የበታች ጥቅስ ፉተር (ከምስል 1000004956.jpg ጋር ፍጹም ተመሳሳይ) */}
          <div className="verified-card-footer" style={{ background: '#f1f5f9', padding: '12px', textAlign: 'center', fontSize: '11px', color: '#475569', borderTop: '1px solid #e2e8f0', fontWeight: '500' }}>
            <p style={{ margin: 0 }}>የአይዲ ባለቤትነትን በስካን ማረጋገጫ ሰሌዳ | POESSA 2026</p>
          </div>
        </div>
      )}

      {/* የኮፒራይት ፉተር */}
      <div className="verify-action-footer" style={{ marginTop: '25px', color: '#94a3b8', fontSize: '12px' }}>
        <p>© 2026 POESSA. All Rights Reserved.</p>
      </div>
    </div>
  );
}

export default ScanVerify;
