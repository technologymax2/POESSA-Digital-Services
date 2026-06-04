import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import './Dashboard.css';

const Dashboard = () => {
  // የቋንቋ ስቴት
  const [lang, setLang] = useState('am');
  const [collapsed, setCollapsed] = useState(false);

  const toggleLanguage = () => {
    setLang(prev => (prev === 'am' ? 'en' : 'am'));
  };

  const employees = [
    { id: 1, name: 'አቶ አበበ በለ', pensionId: '1220056', match: '95%' },
    { id: 2, name: 'ወ/ሮ አልማዝ ታደሰ', pensionId: '1220057', match: '98%' },
    { id: 3, name: 'አቶ ተስፋዬ አለሙ', pensionId: '1220058', match: '92%' },
    { id: 4, name: 'ወ/ሮ ሰላማዊት አየለ', pensionId: '1220059', match: '97%' }
  ];

  return (
    <div className="dashboard-page">
      {/* Sidebar ላይ props ማለፍ */}
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

          <div className="employees-grid">
            {employees.map((employee) => (
              <div key={employee.id} className="employee-card">
                <div className="employee-avatar">{employee.name.charAt(0)}</div>
                <h4>{employee.name}</h4>
                <p className="employee-id">Pension ID: {employee.pensionId}</p>
                <span className="status-badge">{employee.match} MATCH</span>
                <button className="details-btn">
                  {lang === 'am' ? 'ዝርዝር ይመልከቱ' : 'View Details'}
                </button>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;