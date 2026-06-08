import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import DashboardContent from './DashboardContent'
import './Dashboard.css';

const Dashboard = () => {
  // የቋንቋ ስቴት
  const [lang, setLang] = useState('am');
  const [collapsed, setCollapsed] = useState(false);

  const toggleLanguage = () => {
    setLang(prev => (prev === 'am' ? 'en' : 'am'));
  };


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


          <DashboardContent />
 
        </main>
      </div>
    </div>
  );
};

export default Dashboard;