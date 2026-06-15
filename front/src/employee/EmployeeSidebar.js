import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './EmployeeSidebar.css';

function EmployeeSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [employeeName, setEmployeeName] = useState('የፖኤሳ ሰራተኛ');
  const [profilePic, setProfilePic] = useState('');

  useEffect(() => {
    // 1. መረጃውን ከlocalStorage እንወስዳለን
    const storedFullName = localStorage.getItem('fullName');
    const storedPic = localStorage.getItem('profilePic');
    const storedUserRaw = localStorage.getItem('user');

    // 2. fullName በራሱ ቁልፍ ከተቀመጠ እሱን ቅድሚያ እንሰጣለን
    if (storedFullName && storedFullName !== "undefined") {
      setEmployeeName(storedFullName);
    } else if (storedUserRaw) {
      // 3. ካልሆነ ግን 'user' በሚለው ቁልፍ ውስጥ ያለውን JSON እንፈታለን
      try {
        const userObj = JSON.parse(storedUserRaw);
        setEmployeeName(userObj.fullName || userObj.username || 'የፖኤሳ ሰራተኛ');
      } catch (e) {
        setEmployeeName('የፖኤሳ ሰራተኛ');
      }
    }

    // 4. የምስል መረጃ
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
        {/* ምስሉን በአግባቡ ማሳያ */}
        {profilePic ? (
          <img 
            src={profilePic} 
            alt="Profile" 
            className="sidebar-profile-img" 
            style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', marginBottom: '10px' }} 
          />
        ) : (
          <div className="profile-icon" style={{ fontSize: '40px', marginBottom: '10px' }}>👤</div>
        )}
        
        <h4 className="employee-title">{employeeName}</h4>
        <span className="role-badge">ፈጻሚ ባለሙያ</span>
      </div>

      <hr className="sidebar-divider" />

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

        <button className="menu-item disabled" disabled>
          📞 የቪዲዮ ጥሪዎች (በቅርቡ)
        </button>
      </div>

      <button className="sidebar-logout-btn" onClick={handleLogout}>
        🚪 ከሲስተም ውጣ (Logout)
      </button>
    </div>
  );
}

export default EmployeeSidebar;
