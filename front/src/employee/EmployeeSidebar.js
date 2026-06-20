import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios'; // አክሲዮስን ተጠቀም
import './EmployeeSidebar.css';

const API_URL = "https://poessa-digital-services-1.onrender.com";

function EmployeeSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [employee, setEmployee] = useState(null); // መረጃውን እዚህ እናስቀምጣለን

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        // ተጠቃሚን በ ID የሚለይበትን Endpoint ወይም Verify የሚለውን ጥራ
        const res = await axios.get(`${API_URL}/api/auth/verify`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // እዚህ ጋር ከ Backend የመጣውን ትክክለኛ መረጃ ለስቴት እንሰጠዋለን
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
      <div className="sidebar-profile">
        {/* ከAPI የመጣውን ንጹህ መረጃ መጠቀም */}
        {employee?.profilePicture ? (
          <img src={employee.profilePicture} alt="Profile" className="sidebar-profile-img" />
        ) : (
          <div className="profile-icon">👤</div>
        )}
        
        {/* ኢሜይል ሳይሆን ሙሉ ስም */}
        <h4 className="employee-title">{employee?.fullName || "ስም እየተጫነ ነው..."}</h4>
        <span className="role-badge">ፈጻሚ ባለሙያ</span>
      </div>

      <hr className="sidebar-divider" />
      
      {/* 📋 የሜኑ ዝርዝር ክፍል */}
      <div className="sidebar-menu">
        {/* ካሉህ ሌሎች ሜኑዎች ጎን ለጎን ይህንን አዲሱን የሪፖርት ማውጫ እንጨምራለን */}
        <button 
          className={`menu-item ${location.pathname === '/report' ? 'active' : ''}`}
          onClick={() => navigate('/report')}
        >
          <span className="menu-icon">📊</span>
          <span className="menu-text">የማረጋገጫ ሪፖርት</span>
        </button>

        {/* 🚪 የመውጫ በተን (Logout) */}
        <button className="menu-item logout-btn" onClick={handleLogout}>
          <span className="menu-icon">🚪</span>
          <span className="menu-text">ውጣ</span>
        </button>
      </div>
    </div>
  );
}

export default EmployeeSidebar;
