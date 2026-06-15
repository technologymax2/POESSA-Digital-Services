import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './EmployeeSidebar.css';

function EmployeeSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [employeeName, setEmployeeName] = useState('የፖኤሳ ሰራተኛ');
  const [profilePic, setProfilePic] = useState('');

  useEffect(() => {
    // 1. መረጃውን ከlocalStorage እንጠራለን
    const storedFullName = localStorage.getItem('fullName');
    const storedUserRaw = localStorage.getItem('user'); // እዚህ ውስጥ ነው ችግር ያለበት

    // 2. ቅድሚያ fullName-ን እንጠቀማለን
    if (storedFullName && storedFullName !== "undefined") {
      setEmployeeName(storedFullName);
    } else if (storedUserRaw) {
      // 3. fullName ከሌለ 'user' የሚለውን object ፈትተን (parse) ስም እንፈልጋለን
      try {
        const userObj = JSON.parse(storedUserRaw);
        // መረጃው JSON ከሆነ ከውስጡ fullName-ን እንወስዳለን
        setEmployeeName(userObj.fullName || userObj.username || 'የፖኤሳ ሰራተኛ');
      } catch (e) {
        // መረጃው JSON ካልሆነ እንደ ተራ ጽሑፍ እንጠቀመዋለን
        setEmployeeName(storedUserRaw);
      }
    }

    // ምስሉን ከ localStorage እንወስዳለን
    const storedPic = localStorage.getItem('profilePic');
    if (storedPic && storedPic !== "undefined") {
      setProfilePic(storedPic);
    }
  }, []);

  const handleLogout = () => {
    if (window.confirm("🔒 ከሲስተሙ መውጣት ይፈልጋሉ?")) {
      localStorage.clear();
      navigate('/login');
    }
  };

  return (
    <div className="employee-sidebar">
      <div className="sidebar-profile">
        {profilePic ? (
          <img src={profilePic} alt="Profile" className="sidebar-profile-img" style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }} />
        ) : (
          <div className="profile-icon">👤</div>
        )}
        <h4 className="employee-title">{employeeName}</h4>
        <span className="role-badge">ፈጻሚ ባለሙያ</span>
      </div>

      <hr className="sidebar-divider" />

      <div className="sidebar-menu">
        <button className={`menu-item ${location.pathname.includes('pensioner-registration') ? 'active' : ''}`} onClick={() => navigate('/employee-dashboard/pensioner-registration')}>📝 አዲስ ጡረተኛ መመዝገቢያ</button>
        <button className={`menu-item ${location.pathname.includes('idcard-generation-search') ? 'active' : ''}`} onClick={() => navigate('/employee-dashboard/idcard-generation-search')}>🔍 መረጃ መፈለጊያና መታወቂያ</button>
      </div>

      <button className="sidebar-logout-btn" onClick={handleLogout}>🚪 ከሲስተም ውጣ (Logout)</button>
    </div>
  );
}

export default EmployeeSidebar;
