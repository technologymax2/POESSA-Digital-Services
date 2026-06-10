import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import './EmployeeDashboard.css';

const EmployeeDashboard = () => {
  // የቋንቋ ስቴት
  const [lang, setLang] = useState('am');
  const [collapsed, setCollapsed] = useState(false);

  const toggleLanguage = () => {
    setLang(prev => (prev === 'am' ? 'en' : 'am'));
  };

 

  return (
    <div className="dashboard-page">
      
      <Sidebar 
  currentLang={lang} 
  toggleLanguage={toggleLanguage}
  collapsed={collapsed}
  setCollapsed={setCollapsed}
/>

      <div className={`main-content ${collapsed ? 'collapsed' : ''}`}>
        <Header title={lang === 'am' ? "POESSA | ዲጂታል  አገልግሎቶች" : "POESSA | Digital Services"} />

        <main className="dashboard-body">
          <div className="stats-grid">
            <div className="stat-card">
              <h3>{lang === 'am' ? 'ያለፉ የህይወት ማረጋገጫ' : 'Expired Life Verifications'}</h3>
              <p className="stat-number">23</p>
            </div>
            {/* የተቀሩት ስታቲስቲክስ በዚሁ መሰረት ይቀያየራሉ */}
            <div className="stat-card">
              <h3>{lang === 'am' ? 'አዲስ የውክልና ጥያቄ' : 'New Delegation Requests'}</h3>
              <p className="stat-number">20</p>
            </div>
            <div className="stat-card">
              <h3>{lang === 'am' ? 'ጠቅላላ ተጠቃሚዎች' : 'Total Users'}</h3>
              <p className="stat-number">4,565</p>
            </div>
          </div>

          <div className="section-header">
            <h2>{lang === 'am' ? 'በቅርብ ጊዜ የተረጋገጡ ጡረተኞች' : 'Recently Verified Pensioners'}</h2>
          </div>

          
        </main>
      </div>
    </div>
  );
};

export default EmployeeDashboard;