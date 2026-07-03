import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './EmployeeSidebar.css';

const API_URL = "https://poessa-digital-services-1.onrender.com";

function EmployeeSidebar({ onClose, activeSubPage, setActiveSubPage, setIsMobileMenuOpen }) {
  const navigate = useNavigate();
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

  // ሜኑ ሲመረጥ የሚጠራ ፋንክሽን
  const handleMenuClick = (page) => {
    setActiveSubPage(page);
    if (setIsMobileMenuOpen) setIsMobileMenuOpen(false);
  };

  return (
    <div className="employee-sidebar">
      <button className="close-sidebar-btn" onClick={onClose}>✕</button>

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
      
      <div className="sidebar-menu">
        <button className={`menu-item ${activeSubPage === 'registration' ? 'active' : ''}`} onClick={() => handleMenuClick('registration')}>
          <span className="menu-icon">📝</span> <span className="menu-text">ዳሽቦርድ / ምዝገባ</span>
        </button>

        <button className={`menu-item ${activeSubPage === 'report' ? 'active' : ''}`} onClick={() => handleMenuClick('report')}>
          <span className="menu-icon">📊</span> <span className="menu-text">የማረጋገጫ ሪፖርት</span>
        </button>

        <button className={`menu-item ${activeSubPage === 'search' ? 'active' : ''}`} onClick={() => handleMenuClick('search')}>
          <span className="menu-icon">🔍</span> <span className="menu-text">መረጃ መፈለጊያ</span>
        </button>

        <button className={`menu-item ${activeSubPage === 'call-center' ? 'active' : ''}`} onClick={() => handleMenuClick('call-center')}>
          <span className="menu-icon">🎥</span> <span className="menu-text">የጥሪ ማስተናገጃ</span>
        </button>
      </div>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          <span className="menu-icon">🚪</span> <span className="menu-text">ከሲስተም ውጣ</span>
        </button>
      </div>
    </div>
  );
}

export default EmployeeSidebar;
