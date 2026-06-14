import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import PensionerRegistration from './PensionerRegistration'; // 📝 መመዝገቢያ ገጽ
import IdCardGenerationAndSearch from './IdCardGenerationAndSearch'; // 🔍 መታወቂያ እና ፍለጋ ገጽ
import './EmployeeDashboard.css';

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  
  // 👥 የሰራተኛ መረጃ ስቴት
  const [currentEmployee, setCurrentEmployee] = useState({
    username: 'የፖኤሳ ሰራተኛ',
    role: 'ባለሙያ',
    profilePic: null
  });

  // 🌍 የቋንቋ እና የሳይድባር ስቴቶች
  const [lang, setLang] = useState('am');
  const [collapsed, setCollapsed] = useState(false);

  // 🔄 🚨 'registration' በ default መጀመሪያ እንዲከፈት ተደርጓል
  const [activeSubPage, setActiveSubPage] = useState('registration'); 

  // 📥 የገባውን ሰራተኛ መረጃ ከ localStorage መውሰድ
  useEffect(() => {
    const storedUser = localStorage.getItem('user') || localStorage.getItem('username') || 'የፖኤሳ ሰራተኛ';
    const storedRole = localStorage.getItem('role') || 'ባለሙያ';
    
    setCurrentEmployee({
      username: storedUser,
      role: storedRole,
      profilePic: localStorage.getItem('profilePic') || null
    });
  }, []);

  // 🚪 ከሲስተም መውጫ (Logout) ተግባር
  const handleLogout = () => {
    if (window.confirm(lang === 'am' ? "እርግጠኛ ነዎት ከሲስተሙ መውጣት ይፈልጋሉ?" : "Are you sure you want to logout?")) {
      localStorage.clear();
      navigate('/login');
    }
  };

  return (
    <div className="dashboard-container" style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f7fafc' }}>
      
      {/* ⬅️ 👤 አዲሱ የጎን ሜኑ ክፍል (Employee Sidebar) */}
      <div className={`employee-sidebar no-print ${collapsed ? 'collapsed' : ''}`} style={{
        width: collapsed ? '80px' : '280px',
        backgroundColor: '#1a202c',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 15px',
        transition: 'all 0.3s ease',
        boxShadow: '3px 0 10px rgba(0,0,0,0.1)'
      }}>
        {/* የፖርታል ርዕስ */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          {!collapsed && <h3 style={{ margin: 0, color: '#63b3ed', fontSize: '16px', letterSpacing: '1px' }}>POESSA INTERNAL PORTAL</h3>}
          <button onClick={() => setCollapsed(!collapsed)} style={{ background: 'none', border: 'none', color: '#a0aec0', cursor: 'pointer', marginTop: '10px', fontSize: '18px' }}>
            {collapsed ? '➡️' : '⬅️'}
          </button>
        </div>

        <hr style={{ border: '0', borderTop: '1px solid #2d3748', margin: '10px 0' }} />

        {/* የሰራተኛው ፕሮፋይል ማሳያ */}
        <div className="sidebar-profile" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '15px 0' }}>
          {currentEmployee.profilePic ? (
            <img src={currentEmployee.profilePic} alt="Profile" style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #3182ce' }} />
          ) : (
            <div style={{ width: '55px', height: '55px', borderRadius: '50%', backgroundColor: '#3182ce', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '20px', border: '2px solid #fff' }}>
              {currentEmployee.username.charAt(0).toUpperCase()}
            </div>
          )}
          {!collapsed && (
            <div style={{ textAlign: 'center' }}>
              <h4 style={{ margin: '5px 0 0 0', fontSize: '15px', color: '#fff' }}>{currentEmployee.username}</h4>
              <span style={{ fontSize: '11px', color: '#a0aec0', backgroundColor: '#2d3748', padding: '2px 8px', borderRadius: '10px', display: 'inline-block', marginTop: '4px' }}>{currentEmployee.role}</span>
            </div>
          )}
        </div>

        <hr style={{ border: '0', borderTop: '1px solid #2d3748', margin: '15px 0' }} />

        {/* 🧭 የገጾች ዝርዝር ማውጫ (Navigation Items) */}
        <div className="sidebar-menu" style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <button 
            onClick={() => setActiveSubPage('registration')}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 15px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', textAlign: 'left', fontWeight: '6px',
              backgroundColor: activeSubPage === 'registration' ? '#2b6cb0' : 'transparent',
              color: activeSubPage === 'registration' ? 'white' : '#a0aec0',
              transition: 'all 0.2s'
            }}
          >
            <span>📝</span> {!collapsed && (lang === 'am' ? 'አዲስ ጡረተኛ መመዝገቢያ' : 'Pensioner Registration')}
          </button>

          <button 
            onClick={() => setActiveSubPage('search')}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 15px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', textAlign: 'left', fontWeight: '6px',
              backgroundColor: activeSubPage === 'search' ? '#2b6cb0' : 'transparent',
              color: activeSubPage === 'search' ? 'white' : '#a0aec0',
              transition: 'all 0.2s'
            }}
          >
            <span>🔍</span> {!collapsed && (lang === 'am' ? 'መረጃ መፈለጊያና መታወቂያ' : 'Search & ID Card')}
          </button>

          {/* 🚀 ወደፊት ለሚሰሩ ገጾች አስቀድሞ የተዘጋጀ (Placeholder) */}
          <button disabled style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 15px', border: 'none', borderRadius: '6px', fontSize: '14px', textAlign: 'left', backgroundColor: 'transparent', color: '#4a5568', cursor: 'not-allowed' }}>
            <span>📞</span> {!collapsed && (lang === 'am' ? 'የቪዲዮ ጥሪዎች (በቅርቡ)' : 'Video Calls (Soon)')}
          </button>
        </div>

        {/* 🌐 የቋንቋ መቀያየሪያ በሳይድባሩ ስር */}
        {!collapsed && (
          <button onClick={() => setLang(lang === 'am' ? 'en' : 'am')} style={{ backgroundColor: '#2d3748', color: 'white', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', marginBottom: '10px' }}>
            {lang === 'am' ? 'English 🌐' : 'አማርኛ 🌐'}
          </button>
        )}

        {/* 🚪 ከሲስተም መውጫ ቁልፍ */}
        <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start', gap: '12px', width: '100%', padding: '12px 15px', backgroundColor: '#e53e3e', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>
          <span>🚪</span> {!collapsed && (lang === 'am' ? 'ከሲስተም ውጣ' : 'Logout')}
        </button>
      </div>

      {/* ➡️ 📂 የቀኝ ጎን ዋናው የይዘት አካል (Main Content Area) */}
      <div className="main-content-wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        <div style={{ padding: '20px 30px', flex: 1, overflowY: 'auto' }}>
          <Header title={lang === 'am' ? "POESSA | ዲጂታል አገልግሎቶች" : "POESSA | Digital Services"} />

          {/* 📊 የስታቲስቲክስ ካርዶች ሰሌዳ */}
          <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', margin: '20px 0' }}>
            <div className="stat-card" style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '4px solid #e53e3e' }}>
              <h3 style={{ margin: 0, fontSize: '14px', color: '#718096' }}>{lang === 'am' ? 'ያለፉ የህይወት ማረጋገጫ' : 'Expired Life Verifications'}</h3>
              <p className="stat-number" style={{ margin: '10px 0 0 0', fontSize: '28px', fontWeight: 'bold', color: '#2d3748' }}>23</p>
            </div>
            <div className="stat-card" style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '4px solid #dd6b20' }}>
              <h3 style={{ margin: 0, fontSize: '14px', color: '#718096' }}>{lang === 'am' ? 'አዲስ የውክልና ጥያቄ' : 'New Delegation Requests'}</h3>
              <p className="stat-number" style={{ margin: '10px 0 0 0', fontSize: '28px', fontWeight: 'bold', color: '#2d3748' }}>20</p>
            </div>
            <div className="stat-card" style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '4px solid #3182ce' }}>
              <h3 style={{ margin: 0, fontSize: '14px', color: '#718096' }}>{lang === 'am' ? 'ጠቅላላ ተጠቃሚዎች' : 'Total Users'}</h3>
              <p className="stat-number" style={{ margin: '10px 0 0 0', fontSize: '28px', fontWeight: 'bold', color: '#2d3748' }}>4,565</p>
            </div>
          </div>

          {/* 📝 🔍 ሁለቱ ገፆች በተለዋዋጭ ሁኔታ እዚህ ቦታ ላይ ይገባሉ */}
          <div className="dynamic-subpage-holder" style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginTop: '25px' }}>
            {activeSubPage === 'registration' ? (
              <PensionerRegistration />
            ) : (
              <IdCardGenerationAndSearch />
            )}
          </div>

          {/* 🕒 በቅርብ ጊዜ የተረጋገጡ ጡረተኞች ዝርዝር ክፍል */}
          <div className="section-header" style={{ marginTop: '40px' }}>
            <h2 style={{ fontSize: '18px', color: '#2d3748' }}>{lang === 'am' ? 'በቅርብ ጊዜ የተረጋገጡ ጡረተኞች' : 'Recently Verified Pensioners'}</h2>
          </div>

        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
