import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './EmployeeSidebar.css';

const API_URL = "https://poessa-digital-services-1.onrender.com";

function EmployeeSidebar({ onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [employee, setEmployee] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_URL}/api/auth/verify`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.data.success) {
          setEmployee(res.data.user); 
        }
      } catch (err) {
        console.error("ዳታ መጫን አልተቻለም", err);
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="employee-sidebar">
      {/* የሜኑ መዝጊያ ኤክስ (X) ምልክት */}
      <button className="close-sidebar-btn" onClick={onClose}>✕</button>

      {/* ፕሮፋይል ክፍል */}
      <div className="sidebar-profile">
        <div className="profile-img-container">
          {employee?.profilePicture ? (
            <img src={employee.profilePicture} alt="Profile" className="sidebar-profile-img" />
          ) : (
            <div className="profile-icon">👤</div>
          )}
        </div>
        
        <div className="profile-info">
          <h4 className="employee-title">{employee?.fullName || "Mamaru Anmawu"}</h4>
          <span className="role-badge">employee</span>
        </div>
      </div>

      <hr className="sidebar-divider" />
      
      {/* 📋 የሜኑ ዝርዝር ክፍል */}
      <div className="sidebar-menu">
        
        {/* 📝 ዳሽቦርድ / ምዝገባ */}
        <button 
          className={`menu-item ${location.pathname === '/dashboard' ? 'active' : ''}`}
          onClick={() => navigate('/dashboard')}
        >
          <span className="menu-icon">📝</span>
          <span className="menu-text">ዳሽቦርድ / ምዝገባ</span>
        </button>

        {/* 📊 የማረጋገጫ ሪፖርት */}
        <button 
          className={`menu-item ${location.pathname === '/report' ? 'active' : ''}`}
          onClick={() => navigate('/report')}
        >
          <span className="menu-icon">📊</span>
          <span className="menu-text">የማረጋገጫ ሪፖርት</span>
        </button>

        {/* 🔍 መረጃ መፈለጊያና ማስታወቂያ */}
        <button 
          className={`menu-item ${location.pathname === '/search' ? 'active' : ''}`}
          onClick={() => navigate('/search')}
        >
          <span className="menu-icon">🔍</span>
          <span className="menu-text">መረጃ መፈለጊያና ማስታወቂያ</span>
        </button>
          {/* አዲሱን ሜኑ በ Sidebar ውስጥ አስገባ */}
{/* በ sidebar-menu ክፍል ውስጥ */}
<button 
  className={`menu-item ${location.pathname === '/agent-call-center' ? 'active' : ''}`}
  onClick={() => {
    navigate('/agent-call-center'); 
    if (onClose) onClose(); // sidebar-ውን ለመዝጋት
  }}
>
  <span className="menu-icon">🎥</span>
  <span className="menu-text">የጥሪ ማስተናገጃ</span>
</button>
      </div>

      {/* የቋንቋ መቀየሪያ በተን */}
      <div className="language-selector-container">
        <button className="language-btn">
          <span className="globe-icon">🌐</span> English
        </button>
      </div>


      {/* 🚪 ከሲስተም ውጣ (Logout) */}
      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          <span className="menu-icon">🚪</span>
          <span className="menu-text">ከሲስተም ውጣ</span>
        </button>
      </div>
    </div>
  );
}

export default EmployeeSidebar;
