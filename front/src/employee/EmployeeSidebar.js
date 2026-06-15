import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './EmployeeSidebar.css';

function EmployeeSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 1. ሁለቱንም ስም እና ምስል state ውስጥ እናስገባለን
  const [employeeName, setEmployeeName] = useState('የፖኤሳ ሰራተኛ');
  const [profilePic, setProfilePic] = useState('');

  useEffect(() => {
    // 2. ከlocalStorage አዲሶቹን ቁልፎች እንጠራለን
    const name = localStorage.getItem('fullName') || 'የፖኤሳ ሰራተኛ';
    const pic = localStorage.getItem('profilePic') || '';
    
    setEmployeeName(name);
    setProfilePic(pic);
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
        {/* 3. ምስሉን በስም ምትክ እናሳያለን (ካለ) */}
        {profilePic ? (
          <img src={profilePic} alt="Profile" className="profile-img" style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', marginBottom: '10px' }} />
        ) : (
          <div className="profile-icon">👤</div>
        )}
        
        {/* 4. እዚህ ስሙ በትክክል ይታያል */}
        <h4 className="employee-title">{employeeName}</h4>
        <span className="role-badge">ፈጻሚ ባለሙያ</span>
      </div>

      <hr className="sidebar-divider" />

      {/* የገጾች ዝርዝር... */}
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
      </div>

      <button className="sidebar-logout-btn" onClick={handleLogout}>
        🚪 ከሲስተም ውጣ (Logout)
      </button>
    </div>
  );
}

export default EmployeeSidebar;
