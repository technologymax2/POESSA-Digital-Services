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
        const res = await axios.get(`${API_URL}/api/auth/verify`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.data.success) setEmployee(res.data.user);
      } catch (err) { console.error(err); }
    };
    fetchUserData();
  }, []);

  const handleLogout = () => { localStorage.clear(); navigate('/login'); };

  return (
    <div className="employee-sidebar">
      <button className="close-sidebar-btn" onClick={onClose}>✕</button>
      <div className="sidebar-profile">
        <div className="profile-img-container">
          {employee?.profilePicture ? <img src={employee.profilePicture} alt="Profile" className="sidebar-profile-img" /> : <div className="profile-icon">👤</div>}
        </div>
        <div className="profile-info">
          <h4 className="employee-title">{employee?.fullName || "Mamaru Anmawu"}</h4>
          <span className="role-badge">employee</span>
        </div>
      </div>
      <hr className="sidebar-divider" />
      <div className="sidebar-menu">
        <button className={`menu-item ${activeSubPage === 'registration' ? 'active' : ''}`} onClick={() => { setActiveSubPage('registration'); setIsMobileMenuOpen(false); }}>
          <span className="menu-icon">📝</span> ዳሽቦርድ / ምዝገባ
        </button>
        <button className={`menu-item ${activeSubPage === 'report' ? 'active' : ''}`} onClick={() => { setActiveSubPage('report'); setIsMobileMenuOpen(false); }}>
          <span className="menu-icon">📊</span> የማረጋገጫ ሪፖርት
        </button>
        <button className={`menu-item ${activeSubPage === 'search' ? 'active' : ''}`} onClick={() => { setActiveSubPage('search'); setIsMobileMenuOpen(false); }}>
          <span className="menu-icon">🔍</span> መረጃ መፈለጊያ
        </button>
        <button className={`menu-item ${activeSubPage === 'call-center' ? 'active' : ''}`} onClick={() => { setActiveSubPage('call-center'); setIsMobileMenuOpen(false); }}>
          <span className="menu-icon">🎥</span> የጥሪ ማስተናገጃ
        </button>
      </div>
      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>🚪 ከሲስተም ውጣ</button>
      </div>
    </div>
  );
}

export default EmployeeSidebar;
