import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import PensionerRegistration from './PensionerRegistration';
import IdCardGenerationAndSearch from './IdCardGenerationAndSearch';
import Report from './Report'; 
import CallCenterComponent from './CallCenterComponent'; // የጥሪ ማስተናገጃ ኮምፖነንት
import EmployeeSidebar from './EmployeeSidebar'; // አዲሱ የተስተካከለ Sidebar
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

      {/* Sidebar: አሁን የተስተካከሉትን props ለ EmployeeSidebar እየላክን ነው */}
      <div className={`sidebar-container no-print ${isMobileMenuOpen ? 'open' : ''}`}>
        <EmployeeSidebar 
          onClose={() => setIsMobileMenuOpen(false)} 
          activeSubPage={activeSubPage}
          setActiveSubPage={setActiveSubPage}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="dashboard-header">
          <div>
            <h2>{lang === 'am' ? 'እንኳን ደህና መጡ' : 'Welcome'}</h2>
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
              <Report /> 
            )}
            {activeSubPage === 'search' && (
              <IdCardGenerationAndSearch />
            )}
            {activeSubPage === 'call-center' && (
              <CallCenterComponent /> 
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
