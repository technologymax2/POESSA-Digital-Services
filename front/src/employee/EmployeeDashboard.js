import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import PensionerRegistration from './PensionerRegistration';
import IdCardGenerationAndSearch from './IdCardGenerationAndSearch';
import Report from './Report';
import AgentVideoPage from './AgentVideoPage';
import EmployeeSidebar from './EmployeeSidebar'; 
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

  useEffect(() => {
    const storedUser = localStorage.getItem('fullName') || localStorage.getItem('username') || 'የፖኤሳ ሰራተኛ';
    const storedRole = localStorage.getItem('role') || 'ባለሙያ';
    setCurrentEmployee({
      username: storedUser,
      role: storedRole,
      profilePic: localStorage.getItem('profilePic') || null
    });
  }, []);

  return (
    <div className="employee-dashboard-page">
      <div className="mobile-top-bar no-print">
        <button className="menu-toggle-btn" onClick={() => setIsMobileMenuOpen(true)}>☰</button>
        <span className="mobile-portal-title">POESSA INTERNAL PORTAL</span>
      </div>

      <div className={`sidebar-container no-print ${isMobileMenuOpen ? 'open' : ''}`}>
        <EmployeeSidebar 
          onClose={() => setIsMobileMenuOpen(false)} 
          activeSubPage={activeSubPage}
          setActiveSubPage={setActiveSubPage}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />
      </div>

      <div className="main-content">
        <div className="dashboard-header">
          <div>
            <h2>{lang === 'am' ? 'እንኳን ደህና መጡ' : 'Welcome'}</h2>
            <p>{currentEmployee.username}</p>
          </div>
        </div>

        <main className="dashboard-body">
          <div className="dynamic-content-area">
            {activeSubPage === 'registration' && <PensionerRegistration currentEmployee={currentEmployee.username} />}
            {activeSubPage === 'report' && <Report />}
            {activeSubPage === 'search' && <IdCardGenerationAndSearch />}
            {activeSubPage === 'call-center' && <AgentVideoPage />}
          </div>
        </main>
        <Footer />
      </div>

      {isMobileMenuOpen && <div className="sidebar-overlay" onClick={() => setIsMobileMenuOpen(false)} />}
    </div>
  );
}

export default EmployeeDashboard;
