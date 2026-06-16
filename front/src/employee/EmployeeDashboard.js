import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import PensionerRegistration from './PensionerRegistration';
import IdCardGenerationAndSearch from './IdCardGenerationAndSearch';
import './EmployeeDashboard.css';

function EmployeeDashboard() {
  const navigate = useNavigate();

  const [currentEmployee, setCurrentEmployee] = useState({
    username: 'á‹¨á–áŠ¤áˆ³ áˆ°áˆ«á‰°áŠ›',
    role: 'á‰£áˆˆáˆ™á‹«',
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
      'á‹¨á–áŠ¤áˆ³ áˆ°áˆ«á‰°áŠ›';

    const storedRole =
      localStorage.getItem('role') ||
      'á‰£áˆˆáˆ™á‹«';

    setCurrentEmployee({
      username: storedUser,
      role: storedRole,
      profilePic: localStorage.getItem('profilePic') || null
    });
  }, []);

  // Logout
  const handleLogout = () => {
    if (
      window.confirm(
        lang === 'am'
          ? 'áŠ¥áˆ­áŒáŒ áŠ› áŠá‹Žá‰µ áŠ¨áˆ²áˆµá‰°áˆ™ áˆ˜á‹áŒ£á‰µ á‹­áˆáˆáŒ‹áˆ‰?'
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
          â˜°
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
          âœ•
        </button>

        {/* Logo */}
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

        {/* Employee Profile */}
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
            ðŸ“ {lang === 'am'
              ? 'á‹³áˆ½á‰¦áˆ­á‹µ / áˆá‹áŒˆá‰£'
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
            ðŸ” {lang === 'am'
              ? 'áˆ˜áˆ¨áŒƒ áˆ˜áˆáˆˆáŒŠá‹«áŠ“ áˆ˜á‰³á‹ˆá‰‚á‹«'
              : 'Search & ID Card'}
          </button>

        </div>

        {/* Language Button */}
        <button
          className="lang-switcher-btn"
          onClick={() => setLang(lang === 'am' ? 'en' : 'am')}
        >
          ðŸŒ {lang === 'am' ? 'English' : 'áŠ áˆ›áˆ­áŠ›'}
        </button>

        {/* Logout */}
        <button
          className="sidebar-logout-button"
          onClick={handleLogout}
        >
          ðŸšª {lang === 'am'
            ? 'áŠ¨áˆ²áˆµá‰°áˆ á‹áŒ£'
            : 'Logout'}
        </button>

      </div>

      {/* Main Content */}
      <div className="main-content">

        {/* Welcome Section */}
        <div className="dashboard-header">

          <div>
            <h2>áŠ¥áŠ•áŠ³áŠ• á‹°áˆ…áŠ“ áˆ˜áŒ¡</h2>

            <p>
              {currentEmployee.username}
            </p>
          </div>

          {currentEmployee.profilePic ? (
            <img
              src={currentEmployee.profilePic}
              alt="Profile"
              className="dashboard-profile-image"
            />
          ) : (
            <div className="dashboard-profile-placeholder">
              {currentEmployee.username.charAt(0).toUpperCase()}
            </div>
          )}

        </div>

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
}

export default EmployeeDashboard;
