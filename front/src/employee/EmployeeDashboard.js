import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import PensionerRegistration from './PensionerRegistration'; // 📝 መመዝገቢያ ገጽ
import IdCardGenerationAndSearch from './IdCardGenerationAndSearch'; // 🔍 መታወቂያ እና ፍለጋ ገጽ
import './EmployeeDashboard.css';

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  
  // 👥 የሰራተኛ መረጃ ስቴት
  const [currentEmployee, setCurrentEmployee] = useState({
    username: 'የፖኤሳ ሰራተኛ',
    role: 'ባለሙያ',
    profilePic: null
  });

  // 🌍 የቋንቋ እና የሳይድባር ስቴቶች
  const [lang, setLang] = useState('am');
  const [collapsed, setCollapsed] = useState(false);

  // 🔄 የትኛው ገጽ በዳሽቦርዱ መሃል ላይ መታየት እንዳለበት የሚቆጣጠር ስቴት
  // (ማሳሰቢያ፡ React Router በመጠቀም App.js ላይ <Outlet /> ካደረግከው ይህ ስቴት አያስፈልግም፣ ነገር ግን እዚህ ዳሽቦርድ ላይ ቀጥታ ለመቀየር ይህ በጣም ቀላሉ መንገድ ነው)
  const [activeSubPage, setActiveSubPage] = useState('registration'); // 'registration' ወይም 'search'

  // 📥 ሲስተሙ ሲከፈት የገባውን ሰራተኛ መረጃ ከ localStorage መውሰድ
  useEffect(() => {
    const storedUser = localStorage.getItem('user') || localStorage.getItem('username') || 'የፖኤሳ ሰራተኛ';
    const storedRole = localStorage.getItem('role') || 'ባለሙያ';
    
    setCurrentEmployee({
      username: storedUser,
      role: storedRole,
      profilePic: localStorage.getItem('profilePic') || null
    });
  }, []);

  // 🚪 ከሲስተም መውጫ (Logout) ተግባር
  const handleLogout = () => {
    if (window.confirm(lang === 'am' ? "እርግጠኛ ነዎት ከሲስተሙ መውጣት ይፈልጋሉ?" : "Are you sure you want to logout?")) {
      localStorage.clear();
      navigate('/login');
    }
  };

  return (
    <div className="dashboard-page">
      
      {/* 🔝 የላይኛው የቀኝ ራስጌ የሰራተኛ መቆጣጠሪያ ባር (Top Navbar) */}
      <div className="dashboard-top-nav no-print" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#1a202c',
        color: 'white',
        padding: '10px 25px',
        borderBottom: '3px solid #3182ce'
      }}>
        <div className="nav-left">
          <h3 style={{ margin: 0, color: '#63b3ed', letterSpacing: '1px', fontSize: '18px' }}>
            POESSA INTERNAL PORTAL
          </h3>
        </div>

        <div className="nav-right" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          
          {/* 🌐 የቋንቋ መቀያየሪያ */}
          <button 
            onClick={() => setLang(lang === 'am' ? 'en' : 'am')}
            style={{ backgroundColor: '#4a5568', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
          >
            {lang === 'am' ? 'English 🌐' : 'አማርኛ 🌐'}
          </button>

          {/* 👤 የሰራተኛው መረጃ ሳጥን */}
          <div className="employee-profile-box" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {currentEmployee.profilePic ? (
              <img 
                src={currentEmployee.profilePic} 
                alt="Profile" 
                style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #63b3ed' }} 
              />
            ) : (
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: '#3182ce',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '15px',
                border: '2px solid #fff'
              }}>
                {currentEmployee.username.charAt(0).toUpperCase()}
              </div>
            )}
            
            <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff', lineHeight: '1.2' }}>{currentEmployee.username}</span>
              <span style={{ fontSize: '11px', color: '#a0aec0', marginTop: '2px' }}>{currentEmployee.role}</span>
            </div>
          </div>

          {/* 🚪 የLogout አዝራር */}
          <button 
            onClick={handleLogout} 
            className="logout-button"
            style={{
              padding: '8px 16px',
              backgroundColor: '#e53e3e',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 'bold'
            }}
          >
            {lang === 'am' ? '🚪 ውጣ' : '🚪 Logout'}
          </button>
        </div>
      </div>

      {/* 📂 ዋናው የይዘት አካል */}
      <div className={`main-content ${collapsed ? 'collapsed' : ''}`}>
        <Header title={lang === 'am' ? "POESSA | ዲጂታል አገልግሎቶች" : "POESSA | Digital Services"} />

        <main className="dashboard-body">
          
          {/* 📊 የስታቲስቲክስ ካርዶች ሰሌዳ */}
          <div className="stats-grid">
            <div className="stat-card">
              <h3>{lang === 'am' ? 'ያለፉ የህይወት ማረጋገጫ' : 'Expired Life Verifications'}</h3>
              <p className="stat-number">23</p>
            </div>
            <div className="stat-card">
              <h3>{lang === 'am' ? 'አዲስ የውክልና ጥያቄ' : 'New Delegation Requests'}</h3>
              <p className="stat-number">20</p>
            </div>
            <div className="stat-card">
              <h3>{lang === 'am' ? 'ጠቅላላ ተጠቃሚዎች' : 'Total Users'}</h3>
              <p className="stat-number">4,565</p>
            </div>
          </div>

          {/* 🔘 🔗 አዲስ፡ ሁለቱ ገፆች የሚገቡበት ዋና የሊንክ አዝራሮች (Navigation Hub) */}
          <div className="subpage-navigation-hub no-print" style={{
            display: 'flex',
            gap: '20px',
            margin: '30px 0',
            justifyContent: 'flex-start'
          }}>
            <button 
              onClick={() => setActiveSubPage('registration')}
              style={{
                padding: '14px 28px',
                fontSize: '15px',
                fontWeight: 'bold',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                backgroundColor: activeSubPage === 'registration' ? '#2b6cb0' : '#edf2f7',
                color: activeSubPage === 'registration' ? 'white' : '#2d3748',
                boxShadow: activeSubPage === 'registration' ? '0 4px 12px rgba(43, 108, 176, 0.3)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              📝 {lang === 'am' ? 'ወደ ጡረተኛ መመዝገቢያ ቅጽ' : 'Go to Registration Form'}
            </button>

            <button 
              onClick={() => setActiveSubPage('search')}
              style={{
                padding: '14px 28px',
                fontSize: '15px',
                fontWeight: 'bold',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                backgroundColor: activeSubPage === 'search' ? '#2b6cb0' : '#edf2f7',
                color: activeSubPage === 'search' ? 'white' : '#2d3748',
                boxShadow: activeSubPage === 'search' ? '0 4px 12px rgba(43, 108, 176, 0.3)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              🔍 {lang === 'am' ? 'ወደ መረጃ መፈለጊያ እና መታወቂያ ክፍል' : 'Go to Search & ID Section'}
            </button>
          </div>

          {/* 📝 🔍 ሁለቱ ገፆች በተለዋዋጭ ሁኔታ እዚህ ቦታ ላይ ይገባሉ (Dynamic Content Injection) */}
          <div className="registration-section-wrapper" style={{ backgroundColor: '#fff', padding: '5px', borderRadius: '8px' }}>
            {activeSubPage === 'registration' ? (
              <PensionerRegistration />
            ) : (
              <IdCardGenerationAndSearch />
            )}
          </div>

          {/* 🕒 በቅርብ ጊዜ የተረጋገጡ ጡረተኞች ዝርዝር ክፍል */}
          <div className="section-header" style={{ marginTop: '40px' }}>
            <h2>{lang === 'am' ? 'በቅርብ ጊዜ የተረጋገጡ ጡረተኞች' : 'Recently Verified Pensioners'}</h2>
          </div>

        </main>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
