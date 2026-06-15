import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './EmployeeSidebar.css'; // የስታይል ፋይል

function EmployeeSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [employeeName, setEmployeeName] = useState('የፖኤሳ ሰራተኛ');

  useEffect(() => {
    const storedUser = localStorage.getItem('user') || localStorage.getItem('username') || 'የፖኤሳ ሰራተኛ';
    setEmployeeName(storedUser);
  }, []);

  const handleLogout = () => {
    if (window.confirm("🔒 ከሲስተሙ መውጣት ይፈልጋሉ?")) {
      localStorage.clear();
      navigate('/login'); // ወደ መግቢያ ገጽ ይመልሰዋል
    }
  };

  return (
    <div className="employee-sidebar">
      {/* 👤 የሰራተኛው ፕሮፋይል አጭር መግለጫ */}
      <div className="sidebar-profile">
        <div className="profile-icon">👤</div>
        <h4 className="employee-title">{employeeName}</h4>
        <span className="role-badge">ፈጻሚ ባለሙያ</span>
      </div>

      <hr className="sidebar-divider" />

      {/* 🧭 የገጾች ዝርዝር (Navigation Links) */}
      <div className="sidebar-menu">
        <button 
          className={`menu-item ${location.pathname.includes('pensioner-registration') ? 'active' : ''}`}
          onClick={() => navigate('/employee-dashboard/pensioner-registration')}
        >
          📝 አዲስ ጡረተኛ መመዝገቢያ
        </button>

        <button 
          className={`menu-item ${location.pathname.includes('idcard-generation-search') ? 'active' : ''}`}
          onClick={() => navigate('/employee-dashboard/idcard-generation-search')}
        >
          🔍 መረጃ መፈለጊያና መታወቂያ
        </button>

        {/* 🚀 ወደፊት ለሚጨመሩ ገጾች ማሳያ (placeholder) */}
        <button className="menu-item disabled" disabled>
          📞 የቪዲዮ ጥሪዎች (በቅርቡ)
        </button>
      </div>

      {/* 🚪 መውጫ ቁልፍ */}
      <button className="sidebar-logout-btn" onClick={handleLogout}>
        🚪 ከሲስተም ውጣ (Logout)
      </button>
    </div>
  );
}

export default EmployeeSidebar;
