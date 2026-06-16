import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PensionerRegistration from './PensionerRegistration';
import IdCardGenerationAndSearch from './IdCardGenerationAndSearch';
import './EmployeeDashboard.css';

const EmployeeDashboard = () => {
  const navigate = useNavigate();

  // 👤 Current Employee
  const [currentEmployee, setCurrentEmployee] = useState({
    username: 'የፖኤሳ ሰራተኛ',
    role: 'ባለሙያ',
    profilePic: null
  });

  // 🌍 Language
  const [lang, setLang] = useState('am');

  // 📱 Mobile Sidebar
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 📄 Active Page
  const [activeSubPage, setActiveSubPage] = useState('registration');

  // 📥 Load Employee Info
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

  // 🚪 Logout
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
    <div className="dashboard-page">

      {/* Mobile Header */}
      <div className="mobile-top-bar no-print">
        <button
          className="menu-toggle-btn"
          onClick={() => setIsMobileMenuOpen(true)}
        >
          ☰
        </button>

        <span className="mobile-portal-title">
          POESSA INTERNAL PORTAL
        </span>
      </div>

      {/* Sidebar */}
      <div className={`employee-sidebar no-print ${isMobileMenuOpen ? 'open' : ''}`}>

        <button
          className="close-menu-btn"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          ✕
        </button>

        {/* Brand */}
        <div className="sidebar-brand-area">
          <div className="avatar-circle">P</div>

          <div className="brand-text-wrapper">
            <h3>POESSA</h3>
            <span className="brand-subtext">
              Digital Services
            </span>
          </div>
        </div>

        <hr className="sidebar-hr" />

        {/* Profile */}
        <div className="sidebar-profile-box">
          {currentEmployee.profilePic ? (
            <img
              src={currentEmployee.profilePic}
              alt="Profile"
              className="profile-img"
            />
          ) : (
            <div className="profile-placeholder">
              {currentEmployee.username.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="profile-info">
            <h4>{currentEmployee.username}</h4>
            <span className="role-tag">
              {currentEmployee.role}
            </span>
          </div>
        </div>

        <hr className="sidebar-hr" />

        {/* Menu */}
        <div className="sidebar-menu-items">

          <button
            className={`menu-btn-item ${
              activeSubPage === 'registration' ? 'active' : ''
            }`}
            onClick={() => {
              setActiveSubPage('registration');
              setIsMobileMenuOpen(false);
            }}
          >
            📝 {lang === 'am'
              ? 'ዳሽቦርድ / ምዝገባ'
              : 'Dashboard / Register'}
          </button>

          <button
            className={`menu-btn-item ${
              activeSubPage === 'search' ? 'active' : ''
            }`}
            onClick={() => {
              setActiveSubPage('search');
              setIsMobileMenuOpen(false);
            }}
          >
            🔍 {lang === 'am'
              ? 'መረጃ መፈለጊያና መታወቂያ'
              : 'Search & ID Card'}
          </button>

        </div>

        {/* Language */}
        <button
          className="lang-switcher-btn"
          onClick={() =>
            setLang(lang === 'am' ? 'en' : 'am')
          }
        >
          🌐 {lang === 'am' ? 'English' : 'አማርኛ'}
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="sidebar-logout-button"
        >
          🚪 {lang === 'am'
            ? 'ከሲስተም ውጣ'
            : 'Logout'}
        </button>

      </div>

      {/* Main Content */}
      <div className="main-content">

        <Header
          title={
            lang === 'am'
              ? 'POESSA | ዲጂታል አገልግሎቶች'
              : 'POESSA | Digital Services'
          }
        />

        <main className="dashboard-body">
          <div className="dynamic-content-area">

            {activeSubPage === 'registration' ? (
              <PensionerRegistration
                currentEmployee={currentEmployee.username}
              />
            ) : (
              <IdCardGenerationAndSearch />
            )}

          </div>
        </main>

        <Footer />
      </div>

      {/* Overlay */}
      {isMobileMenuOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default EmployeeDashboard;
