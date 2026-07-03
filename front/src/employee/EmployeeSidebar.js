import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './EmployeeSidebar.css';

const API_URL = "https://poessa-digital-services-1.onrender.com";

function EmployeeSidebar({ onClose, activeSubPage, setActiveSubPage, setIsMobileMenuOpen }) {
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
      {/* የሜኑ መዝጊያ */}
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
      
      {/* የሜኑ ዝርዝር */}
      <div className="sidebar-menu">
        
        {/* ዳሽቦርድ */}
        <button 
          className={`menu-item ${activeSubPage === 'registration' ? 'active' : ''}`}
          onClick={() => {
            setActiveSubPage('registration');
            if (setIsMobileMenuOpen) setIsMobileMenuOpen(false);
            if (onClose) onClose();
          }}
        >
          <span className="menu-icon">📝</span>
          <span className="menu-text">ዳሽቦርድ / ምዝገባ</span>
        </button>

        {/* ሪፖርት */}
        <button 
          className={`menu-item ${activeSubPage === 'report' ? 'active' : ''}`}
          onClick={() => {
            setActiveSubPage('report');
            if (setIsMobileMenuOpen) setIsMobileMenuOpen(false);
            if (onClose) onClose();
          }}
        >
          <span className="menu-icon">📊</span>
          <span className="menu-text">የማረጋገጫ ሪፖርት</span>
        </button>

        {/* መረጃ መፈለጊያ */}
        <button 
          className={`menu-item ${activeSubPage === 'search' ? 'active' : ''}`}
          onClick={() => {
            setActiveSubPage('search');
            if (setIsMobileMenuOpen) setIsMobileMenuOpen(false);
            if (onClose) onClose();
          }}
        >
          <span className="menu-icon">🔍</span>
          <span className="menu-text">መረጃ መፈለጊያና ማስታወቂያ</span>
        </button>

        {/* አዲሱ የጥሪ ማስተናገጃ */}
        <button 
          className={`menu-item ${activeSubPage === 'call-center' ? 'active' : ''}`}
          onClick={() => {
            setActiveSubPage('call-center');
            if (setIsMobileMenuOpen) setIsMobileMenuOpen(false);
            if (onClose) onClose();
          }}
        >
          <span className="menu-icon">🎥</span>
          <span className="menu-text">የጥሪ ማስተናገጃ</span>
        </button>
      </div>

      {/* የቋንቋ መቀየሪያ */}
      <div className="language-selector-container">
        <button className="language-btn">
          <span className="globe-icon">🌐</span> English
        </button>
      </div>

      {/* Logout */}
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
