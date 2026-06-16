// src/components/Header.js
import React from 'react';
import { Link } from 'react-router-dom'; // ይህንን መስመር መጨመር ግዴታ ነው
import './Header.css';

const Header = ({ title, user }) => {
  return (
    <header className="dashboard-header">
      <div className="header-title">
        <h1>{title}</h1>
      </div>
      
      <div className="user-profile">
        {user ? (
          <>
            <span className="user-name">{user.name}</span>
            <div className="avatar">👤</div>
          </>
        ) : (
          <div className="auth-actions">
            <Link to="/login" className="auth-link login">Login</Link>
            
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
