import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // 📱 ለሞባይል ሜኑ መቆጣጠሪያ

  // 🔄 'registration' በ default መጀመሪያ እንዲከፈት ተደርጓል
  const [activeSubPage, setActiveSubPage] = useState('registration'); 

  // 📥 የገባውን ሰራተኛ መረጃ መውሰድ
  useEffect(() => {
    const storedUser = localStorage.getItem('user') || localStorage.getItem('username') || 'የፖኤሳ ሰራተኛ';
    const storedRole = localStorage.getItem('role') || 'ባለሙያ';
    
    setCurrentEmployee({
      username: storedUser,
      role: storedRole,
      profilePic: localStorage.getItem('profilePic') || null
    });
  }, []);

  // 🚪 ከሲስተም መውጫ (Logout)
  const handleLogout = () => {
    if (window.confirm(lang === 'am' ? "እርግጠኛ ነዎት ከሲስተሙ መውጣት ይፈልጋሉ?" : "Are you sure you want to logout?")) {
      localStorage.clear();
      navigate('/login');
    }
  };

  return (
    <div className="dashboard-page">
      
      {/* 📱 🔝 የሞባይል የላይኛው ባር (Header Bar for Mobile) */}
      <div className="mobile-top-bar no-print">
        {/* ☰ Menu Icon ቁልፍ */}
        <button 
          className="menu-toggle-btn" 
          onClick={() => setIsMobileMenuOpen(true)}
          aria-label="Open Menu"
        >
          ☰
        </button>
        <span className="mobile-portal-title">POESSA INTERNAL PORTAL</span>
      </div>

      {/* ⬅️ 👤 የጎን ሜኑ ክፍል (Sidebar Drawer) */}
      <div className={`employee-sidebar no-print ${isMobileMenuOpen ? 'open' : ''}`}>
        
        {/* ✕ Close Icon ቁልፍ (በፎቶህ ላይ እንዳለው በላይኛው ቀኝ በኩል) */}
        <button 
          className="close-menu-btn" 
          onClick={() => setIsMobileMenuOpen(false)}
          aria-label="Close Menu"
        >
          ✕
        </button>

        {/* የፖርታል አርማ ወይም ርዕስ */}
        <div className="sidebar-brand-area">
          <div className="avatar-circle">P</div>
          <div className="brand-text-wrapper">
            <h3>POESSA</h3>
            <span className="brand-subtext">Digital Services</span>
          </div>
        </div>

        <hr className="sidebar-hr" />

        {/* የሰራተኛው ፕሮፋይል ማሳያ */}
        <div className="sidebar-profile-box">
          {currentEmployee.profilePic ? (
            <img src={currentEmployee.profilePic} alt="Profile" className="profile-img" />
          ) : (
            <div className="profile-placeholder">
              {currentEmployee.username.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="profile-info">
            <h4>{currentEmployee.username}</h4>
            <span className="role-tag">{currentEmployee.role}</span>
          </div>
        </div>

        <hr className="sidebar-hr" />

        {/* 🧭 የገጾች ዝርዝር ማውጫ (Navigation Links) */}
        <div className="sidebar-menu-items">
          <button 
            onClick={() => { setActiveSubPage('registration'); setIsMobileMenuOpen(false); }}
            className={`menu-btn-item ${activeSubPage === 'registration' ? 'active' : ''}`}
          >
            <span className="menu-icon">📝</span> 
            <span className="menu-text">{lang === 'am' ? 'ዳሽቦርድ / ምዝገባ' : 'Dashboard / Register'}</span>
          </button>

          <button 
            onClick={() => { setActiveSubPage('search'); setIsMobileMenuOpen(false); }}
            className={`menu-btn-item ${activeSubPage === 'search' ? 'active' : ''}`}
          >
            <span className="menu-icon">🔍</span> 
            <span className="menu-text">{lang === 'am' ? 'መረጃ መፈለጊያና መታወቂያ' : 'Search & ID Card'}</span>
          </button>

          <button disabled className="menu-btn-item disabled">
            <span className="menu-icon">📜</span> 
            <span className="menu-text">{lang === 'am' ? 'ውክልናዎች' : 'Delegations'}</span>
          </button>

          <button disabled className="menu-btn-item disabled">
            <span className="menu-icon">🛡️</span> 
            <span className="menu-text">{lang === 'am' ? 'የህይወት ማረጋገጫ' : 'Life Verification'}</span>
          </button>

          <button disabled className="menu-btn-item disabled">
            <span className="menu-icon">📊</span> 
            <span className="menu-text">{lang === 'am' ? 'ሪፖርቶች' : 'Reports'}</span>
          </button>

          <button disabled className="menu-btn-item disabled">
            <span className="menu-icon">📞</span> 
            <span className="menu-text">{lang === 'am' ? 'የጥሪ ማስተናገጃ' : 'Call Center'}</span>
          </button>
        </div>

        {/* 🌐 የቋንቋ መቀያየሪያ */}
        <button className="lang-switcher-btn" onClick={() => setLang(lang === 'am' ? 'en' : 'am')}>
          🌐 {lang === 'am' ? 'English' : 'አማርኛ'}
        </button>

        {/* 🚪 ከሲስተም መውጫ ቁልፍ */}
        <button onClick={handleLogout} className="sidebar-logout-button">
          <span>🚪</span> {lang === 'am' ? 'ከሲስተም ውጣ' : 'Logout'}
        </button>
      </div>

      {/* ➡️ 📂 የቀኝ ጎን ዋናው የይዘት አካል (Main Content Area) */  .....................................................................}
      <div className="main-content">
        <Header title={lang === 'am' ? "POESSA | ዲጂታል አገልግሎቶች" : "POESSA | Digital Services"} />

        <main className="dashboard-body">
          {/* 📝 🔍 ሁለቱ ገፆች በተለዋዋጭ ሁኔታ እዚህ ቦታ ላይ ይገባሉ */}
          <div className="dynamic-content-area">
            {activeSubPage === 'registration' ? (
              <PensionerRegistration />
            ) : (
              <IdCardGenerationAndSearch />
            )}
          </div>
        </main>

        <Footer />
      </div>

      {/* 📱 ሜኑው ሲከፈት ከጀርባ ያለውን ገጽ ጨለምለም የሚያደርግ (Overlay background) */}
      {isMobileMenuOpen && <div className="sidebar-overlay" onClick={() => setIsMobileMenuOpen(false)}></div>}
    </div>
  );
};

export default EmployeeDashboard;
