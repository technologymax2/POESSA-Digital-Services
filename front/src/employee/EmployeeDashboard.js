import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import PensionerRegistration from './PensionerRegistration';
import IdCardGenerationAndSearch from './IdCardGenerationAndSearch';
import Report from './Report'; // 📊 በትክክል የመጣው የሪፖርት ኮምፖነንት
import './EmployeeDashboard.css';

function EmployeeDashboard() {
  const navigate = useNavigate();

  const [currentEmployee, setCurrentEmployee] = useState({
    username: 'የፖኤሳ ሰራተኛ',
    role: 'ባለሙያ',
    profilePic: null
  });

  const [lang, setLang] = useState('am');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSubPage, setActiveSubPage] = useState('registration');

  // Load employee info
  useEffect(() => {
    const storedUser =
      localStorage.getItem('fullName') ||
      localStorage.getItem('username') ||
      'የፖኤሳ ሰራተኛ';

    const storedRole =
      localStorage.getItem('role') ||
      'ባለሙያ';

    setCurrentEmployee({
      username: storedUser,
      role: storedRole,
      profilePic: localStorage.getItem('profilePic') || null
    });
  }, []);

  const handleLogout = () => {
    if (
      window.confirm(
        lang === 'am'
          ? 'እርግጠኛ ነዎት ከሲስተሙ መውጣት ይፈልጋሉ?'
          : 'Are you sure you want to logout?'
      )
    ) {
      localStorage.clear();
      navigate('/login');
    }
  };

  return (
    <div className="employee-dashboard-page">

      {/* Mobile Top Bar */}
      <div className="mobile-top-bar no-print">
        <button
          className="menu-toggle-btn"
          onClick={() => setIsMobileMenuOpen(true)}
        >
          ☰
        </button>
        <span className="mobile-portal-title">POESSA INTERNAL PORTAL</span>
      </div>

      {/* Sidebar */}
      <div className={`employee-sidebar no-print ${isMobileMenuOpen ? 'open' : ''}`}>
        <button
          className="close-menu-btn"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          ✕
        </button>

        <hr className="sidebar-hr" />

        {/* Employee Profile */}
        <div className="sidebar-profile-box">
          {currentEmployee.profilePic ? (
            <img src={currentEmployee.profilePic} alt="Profile" className="profile-img" />
          ) : (
            <div className="profile-placeholder">
              {currentEmployee.username ? currentEmployee.username.charAt(0).toUpperCase() : '👤'}
            </div>
          )}
          <div className="profile-info">
            <h4>{currentEmployee.username}</h4>
            <span className="role-tag">{currentEmployee.role}</span>
          </div>
        </div>

        <hr className="sidebar-hr" />

        {/* Menu Items */}
        <div className="sidebar-menu-items">
          <button
            className={`menu-btn-item ${activeSubPage === 'registration' ? 'active' : ''}`}
            onClick={() => {
              setActiveSubPage('registration');
              setIsMobileMenuOpen(false);
            }}
          >
            📝 {lang === 'am' ? 'ዳሽቦርድ / ምዝገባ' : 'Dashboard / Register'}
          </button>

          <button
            className={`menu-btn-item ${activeSubPage === 'report' ? 'active' : ''}`}
            onClick={() => {
              setActiveSubPage('report');
              setIsMobileMenuOpen(false);
            }}
          >
            📊 {lang === 'am' ? 'የማረጋገጫ ሪፖርት' : 'Verification Report'}
          </button>

          <button
            className={`menu-btn-item ${activeSubPage === 'search' ? 'active' : ''}`}
            onClick={() => {
              setActiveSubPage('search');
              setIsMobileMenuOpen(false);
            }}
          >
            🔍 {lang === 'am' ? 'መረጃ መፈለጊያና መታወቂያ' : 'Search & ID Card'}
          </button>
        </div>

        <button
          className="lang-switcher-btn"
          onClick={() => setLang(lang === 'am' ? 'en' : 'am')}
        >
          🌐 {lang === 'am' ? 'English' : 'አማርኛ'}
        </button>

        <button className="sidebar-logout-button" onClick={handleLogout}>
          🚪 {lang === 'am' ? 'ከሲስተም ውጣ' : 'Logout'}
        </button>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="dashboard-header">
          <div>
            <h2>እንኳን ደህና መጡ</h2>
            <p>{currentEmployee.username}</p>
          </div>
          {currentEmployee.profilePic ? (
            <img src={currentEmployee.profilePic} alt="Profile" className="dashboard-profile-image" />
          ) : (
            <div className="dashboard-profile-placeholder">
              {currentEmployee.username ? currentEmployee.username.charAt(0).toUpperCase() : 'U'}
            </div>
          )}
        </div>

        <main className="dashboard-body">
          <div className="dynamic-content-area">
            {activeSubPage === 'registration' && (
              <PensionerRegistration currentEmployee={currentEmployee.username} />
            )}
            {activeSubPage === 'report' && (
              <Report /> {/* 🛠️ እዚህ ጋር ስሙ ተስተካክሏል */}
            )}
            {activeSubPage === 'search' && (
              <IdCardGenerationAndSearch />
            )}
          </div>
        </main>

        <Footer />
      </div>

      {isMobileMenuOpen && (
        <div className="sidebar-overlay" onClick={() => setIsMobileMenuOpen(false)} />
      )}
    </div>
  );
}

export default EmployeeDashboard;
