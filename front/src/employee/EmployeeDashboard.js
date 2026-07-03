import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import PensionerRegistration from './PensionerRegistration';
import IdCardGenerationAndSearch from './IdCardGenerationAndSearch';
import Report from './Report';
import AgentVideoPage from './AgentVideoPage'; // የቪዲዮ ጥሪ ገጽ
import EmployeeSidebar from './EmployeeSidebar'; 
import './EmployeeDashboard.css';

function EmployeeDashboard() {
  const navigate = useNavigate();
  const [lang, setLang] = useState('am');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSubPage, setActiveSubPage] = useState('registration');
  const [currentEmployee, setCurrentEmployee] = useState({
    fullName: 'የፖኤሳ ሰራተኛ',
    role: 'ባለሙያ',
    profilePicture: null
  });

  useEffect(() => {
    // የተጠቃሚ መረጃን ከlocalStorage መጫን
    setCurrentEmployee({
      fullName: localStorage.getItem('fullName') || 'የፖኤሳ ሰራተኛ',
      role: localStorage.getItem('role') || 'ባለሙያ',
      profilePicture: localStorage.getItem('profilePic') || null
    });
  }, []);

  const handleLogout = () => {
    if (window.confirm(lang === 'am' ? 'እርግጠኛ ነዎት መውጣት ይፈልጋሉ?' : 'Are you sure you want to logout?')) {
      localStorage.clear();
      navigate('/login');
    }
  };

  return (
    <div className="employee-dashboard-page">
      
      {/* Mobile Top Bar */}
      <div className="mobile-top-bar no-print">
        <button className="menu-toggle-btn" onClick={() => setIsMobileMenuOpen(true)}>☰</button>
        <span className="mobile-portal-title">POESSA INTERNAL PORTAL</span>
      </div>

      {/* Sidebar - አዲሱ ኮምፖነንት በ props ይላካል */}
      {isMobileMenuOpen && (
        <div className="sidebar-overlay" onClick={() => setIsMobileMenuOpen(false)} />
      )}
      
      <div className={`sidebar-container ${isMobileMenuOpen ? 'open' : ''}`}>
        <EmployeeSidebar 
          activeSubPage={activeSubPage}
          onMenuClick={(page) => {
            setActiveSubPage(page);
            setIsMobileMenuOpen(false);
          }}
          onLogout={handleLogout}
          lang={lang}
          setLang={setLang}
          onClose={() => setIsMobileMenuOpen(false)}
          employee={currentEmployee}
        />
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="dashboard-header">
          <h2>{lang === 'am' ? 'እንኳን ደህና መጡ' : 'Welcome'}</h2>
          <p>{currentEmployee.fullName}</p>
        </div>

        <main className="dashboard-body">
          <div className="dynamic-content-area">
            {activeSubPage === 'registration' && <PensionerRegistration />}
            {activeSubPage === 'report' && <Report />}
            {activeSubPage === 'search' && <IdCardGenerationAndSearch />}
            {activeSubPage === 'calls' && <AgentVideoPage />}
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}

export default EmployeeDashboard;
