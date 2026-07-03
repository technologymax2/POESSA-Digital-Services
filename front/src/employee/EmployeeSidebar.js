import React from 'react';
import './EmployeeSidebar.css';

function EmployeeSidebar({ activeSubPage, onMenuClick, onLogout, lang, setLang, onClose, employee }) {
  
  // የሜኑ ዝርዝሮች
  const menuItems = [
    { id: 'registration', labelAm: 'ዳሽቦርድ / ምዝገባ', labelEn: 'Dashboard / Register', icon: '📝' },
    { id: 'report', labelAm: 'የማረጋገጫ ሪፖርት', labelEn: 'Verification Report', icon: '📊' },
    { id: 'search', labelAm: 'መረጃ መፈለጊያ', labelEn: 'Search & ID', icon: '🔍' },
    { id: 'calls', labelAm: 'የጥሪ ማስተናገጃ', labelEn: 'Call Management', icon: '📹' }
  ];

  return (
    <div className="employee-sidebar">
      {/* የሜኑ መዝጊያ */}
      <button className="close-sidebar-btn" onClick={onClose}>✕</button>

      {/* ፕሮፋይል ክፍል */}
      <div className="sidebar-profile">
        <div className="profile-icon">
            {employee?.profilePicture ? <img src={employee.profilePicture} alt="Profile" /> : '👤'}
        </div>
        <div className="profile-info">
          <h4 className="employee-title">{employee?.fullName || "የፖኤሳ ሰራተኛ"}</h4>
          <span className="role-badge">{employee?.role || "ባለሙያ"}</span>
        </div>
      </div>

      <hr className="sidebar-divider" />

      {/* የሜኑ ዝርዝር */}
      <div className="sidebar-menu">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`menu-item ${activeSubPage === item.id ? 'active' : ''}`}
            onClick={() => {
              onMenuClick(item.id);
              onClose();
            }}
          >
            <span className="menu-icon">{item.icon}</span>
            <span className="menu-text">{lang === 'am' ? item.labelAm : item.labelEn}</span>
          </button>
        ))}
      </div>

      {/* የቋንቋ መቀየሪያ */}
      <div className="language-selector-container">
        <button className="language-btn" onClick={() => setLang(lang === 'am' ? 'en' : 'am')}>
          <span className="globe-icon">🌐</span> {lang === 'am' ? 'English' : 'አማርኛ'}
        </button>
      </div>

      {/* መውጫ */}
      <div className="sidebar-footer">
        <button className="logout-btn" onClick={onLogout}>
          <span className="menu-icon">🚪</span>
          <span className="menu-text">{lang === 'am' ? 'ከሲስተም ውጣ' : 'Logout'}</span>
        </button>
      </div>
    </div>
  );
}

export default EmployeeSidebar;
