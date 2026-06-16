import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import DashboardContent from './DashboardContent';
import Footer from '../components/Footer';
import './Dashboard.css';

const Dashboard = () => {
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
      {/* collapsed በሆነ ጊዜ የmain-content ህዳግ (margin) እንዲቀንስ የተደረገበት ክፍል */}
      <div className={`main-content ${collapsed ? 'collapsed' : ''}`}>
        <Header title={lang === 'am' ? "POESSA | ዲጂታል አገልግሎቶች" : "POESSA | Digital Services"} />
        <DashboardContent />
        <Footer />
      </div>
    </div>
  );
};

export default Dashboard;
