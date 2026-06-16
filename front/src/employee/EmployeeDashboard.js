import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Footer from '../components/Footer';
import PensionerRegistration from './PensionerRegistration';
import IdCardGenerationAndSearch from './IdCardGenerationAndSearch';
import './EmployeeDashboard.css';

const API_URL = "https://poessa-digital-services-1.onrender.com";

function EmployeeDashboard() {
  const navigate = useNavigate();

  // Unified application state variables
  const [currentEmployee, setCurrentEmployee] = useState({
    username: 'የፖኤሳ ሰራተኛ',
    role: 'ባለሙያ',
    profilePic: null
  });
  
  const [lang, setLang] = useState('am');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSubPage, setActiveSubPage] = useState('registration');
  const [loading, setLoading] = useState(true);

  // Load employee info from both API and localStorage fallback
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const res = await axios.get(`${API_URL}/api/auth/verify`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (res.data && res.data.success) {
            setCurrentEmployee({
              username: res.data.user.fullName || res.data.user.username || 'የፖኤሳ ሰራተኛ',
              role: 'ፈጻሚ ባለሙያ',
              profilePic: res.data.user.profilePicture || null
            });
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.error("API data load failed, falling back to local storage:", err);
      }

      // Fallback logic if API fails or token is missing
      const storedUser = localStorage.getItem('fullName') || localStorage.getItem('username') || 'የፖኤሳ ሰራተኛ';
      const storedRole = localStorage.getItem('role') || 'ባለሙያ';
      const storedPic = localStorage.getItem('profilePic') || null;

      setCurrentEmployee({
        username: storedUser,
        role: storedRole,
        profilePic: storedPic
      });
      setLoading(false);
    };

    fetchUserData();
  }, []);

  // System Logout Utility
  const handleLogout = () => {
    const confirmationMessage = lang === 'am' 
      ? 'እርግጠኛ ነዎት ከሲስተሙ መውጣት ይፈልጋሉ?' 
      : 'Are you sure you want to logout?';

    if (window.confirm(confirmationMessage)) {
      localStorage.clear();
      navigate('/login');
    }
  };

  return React.createElement(
    'div',
    { className: 'employee-dashboard-page' },

    /* Mobile Top Navigation bar */
    React.createElement(
      'div',
      { className: 'mobile-top-bar no-print' },
      React.createElement(
        'button',
        { className: 'menu-toggle-btn', onClick: () => setIsMobileMenuOpen(true) },
        '☰'
      ),
      React.createElement('span', { className: 'mobile-portal-title' }, 'POESSA INTERNAL PORTAL')
    ),

    /* Primary Sidebar Container */
    React.createElement(
      'aside',
      { className: `employee-sidebar no-print ${isMobileMenuOpen ? 'open' : ''}` },
      
      React.createElement(
        'button',
        { className: 'close-menu-btn', onClick: () => setIsMobileMenuOpen(false) },
        '✕'
      ),

      /* Brand/Logo Area */
      React.createElement(
        'div',
        { className: 'sidebar-brand-area' },
        React.createElement('div', { className: 'avatar-circle' }, 'P'),
        React.createElement(
          'div',
          { className: 'brand-text-wrapper' },
          React.createElement('h3', null, 'POESSA'),
          React.createElement('span', { className: 'brand-subtext' }, 'Digital Services')
        )
      ),

      React.createElement('hr', { className: 'sidebar-hr' }),

      /* Dynamic Employee Profile section */
      React.createElement(
        'div',
        { className: 'sidebar-profile-box' },
        currentEmployee.profilePic
          ? React.createElement('img', { src: currentEmployee.profilePic, alt: 'Profile', className: 'profile-img' })
          : React.createElement(
              'div',
              { className: 'profile-placeholder' },
              currentEmployee.username ? currentEmployee.username.charAt(0).toUpperCase() : '👤'
            ),
        React.createElement(
          'div',
          { className: 'profile-info' },
          React.createElement('h4', null, loading ? '...' : currentEmployee.username),
          React.createElement('span', { className: 'role-tag' }, currentEmployee.role)
        )
      ),

      React.createElement('hr', { className: 'sidebar-hr' }),

      /* Dashboard Actions Links */
      React.createElement(
        'nav',
        { className: 'sidebar-menu-items' },
        React.createElement(
          'button',
          {
            className: `menu-btn-item ${activeSubPage === 'registration' ? 'active' : ''}`,
            onClick: () => {
              setActiveSubPage('registration');
              setIsMobileMenuOpen(false);
            }
          },
          `📝 ${lang === 'am' ? 'ዳሽቦርድ / ምዝገባ' : 'Dashboard / Register'}`
        ),
        React.createElement(
          'button',
          {
            className: `menu-btn-item ${activeSubPage === 'search' ? 'active' : ''}`,
            onClick: () => {
              setActiveSubPage('search');
              setIsMobileMenuOpen(false);
            }
          },
          `🔍 ${lang === 'am' ? 'መረጃ መፈለጊያና መታወቂያ' : 'Search & ID Card'}`
        )
      ),

      /* Language Selection Switcher */
      React.createElement(
        'button',
        { className: 'lang-switcher-btn', onClick: () => setLang(lang === 'am' ? 'en' : 'am') },
        `🌐 ${lang === 'am' ? 'English' : 'አማርኛ'}`
      ),

      /* Session Termination Button */
      React.createElement(
        'button',
        { className: 'sidebar-logout-button', onClick: handleLogout },
        `🚪 ${lang === 'am' ? 'ከሲስተም ውጣ' : 'Logout'}`
      )
    ),

    /* Main Dynamic View Content Workspace Area */
    React.createElement(
      'div',
      { className: 'main-content' },
      
      React.createElement(
        'header',
        { className: 'dashboard-header' },
        React.createElement(
          'div',
          { null: null },
          React.createElement('h2', null, lang === 'am' ? 'እንኳን ደህና መጡ' : 'Welcome'),
          React.createElement('p', null, loading ? '...' : currentEmployee.username)
        ),
        currentEmployee.profilePic
          ? React.createElement('img', { src: currentEmployee.profilePic, alt: 'Profile', className: 'dashboard-profile-image' })
          : React.createElement(
              'div',
              { className: 'dashboard-profile-placeholder' },
              currentEmployee.username ? currentEmployee.username.charAt(0).toUpperCase() : 'U'
            )
      ),

      React.createElement(
        'main',
        { className: 'dashboard-body' },
        React.createElement(
          'div',
          { className: 'dynamic-content-area' },
          activeSubPage === 'registration'
            ? React.createElement(PensionerRegistration, { currentEmployee: currentEmployee.username })
            : React.createElement(IdCardGenerationAndSearch, null)
        )
      ),

      React.createElement(Footer, null)
    ),

    /* Side Overlay backdrop for mobile rendering viewports */
    isMobileMenuOpen && React.createElement('div', { className: 'sidebar-overlay', onClick: () => setIsMobileMenuOpen(false) })
  );
}

export default EmployeeDashboard;
