import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Signup.css';

const Signup = () => {
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '' });
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Signup Data:', formData);
  };

  return (
    <div className="signup-page-container">
      {/* ወደ ዳሽቦርድ መመለሻ ቁልፍ */}
      <div className='signup-nav-btn-container'>
        <button 
          type="button" 
          onClick={() => navigate('/')} 
          className="signup-back-btn"
        >
          <strong>← ወደ ዋና ማውጫ</strong>
        </button>
      </div> 
      
      {/* የፎርም መጠቅለያ */}
      <div className="signup-form-wrapper"> 
        <form className="signup-form" onSubmit={handleSubmit}>
          <h2 className="signup-title">Create an Account</h2>
          
          <div className="signup-input-group">
            <label>Full Name</label>
            <input 
              type="text" 
              placeholder="Abebe Kebede"
              onChange={(e) => setFormData({...formData, fullName: e.target.value})}
              required 
            />
          </div>

          <div className="signup-input-group">
            <label>Email Address</label>
            <input 
              type="email" 
              placeholder="name@example.com"
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required 
            />
          </div>

          <div className="signup-input-group">
            <label>Password</label>
            <input 
              type="password" 
              placeholder="Create a password"
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required 
            />
          </div>

          <button type="submit" className="signup-submit-btn">Sign Up</button>
          
          <div className="signup-footer-text">
            <span>Already have an account? <a href="/login">Login</a></span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;