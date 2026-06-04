import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Login Data:', formData);
    // እዚህ የAPI ጥሪ (Authentication) ታደርጋለህ
  };

  return (
    <div className="login-container">
      <div className='signup-nav-btn-container'>
        <button 
        type="button" 
        onClick={() => navigate('/')} 
        className="back-to-dashboard-btn"
      >
         <strong>← ወደ ዋና ማውጫ</strong>
      </button>
      </div> 
      
  
      <div className="login-box"> 
        <form className="login-form" onSubmit={handleSubmit}>
          <h2>Login</h2>
          <div className="input-group">
            <label>Email Address</label>
            <input 
              type="email" 
              placeholder="name@example.com"
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required 
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input 
              type="password" 
              placeholder="••••••••"
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required 
            />
          </div>

          <button type="submit" className="login-btn">Login</button>
          
          <div className="login-footer">
            <span>Don't have an account? <a href="/signup">Sign up</a></span>
          </div>
        </form>
      </div>

     
    </div>
  );
};

export default Login;