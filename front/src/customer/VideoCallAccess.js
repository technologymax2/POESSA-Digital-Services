import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExitToApp, Videocam } from '@mui/icons-material'; // አስፈላጊ አይኮኖች
import './VideoCallAccess.css';

const VideoCallAccess = () => {
  const [tin, setTin] = useState('');
  const navigate = useNavigate();

  const handleStartCall = () => {
    // TIN ቁጥር 10 አሃዝ መሆኑን ማረጋገጥ
    if (tin.length >= 10) {
      navigate(`/video-call-room/${tin}`);
    } else {
      alert('እባክዎ ትክክለኛ የTIN ቁጥር ያስገቡ። የ Tin አሃዝ ከ10 አያንስም');
    }
  };

  const handleLogout = () => {
    // እዚህ ቦታ ላይ የAuth Token (እንደ JWT) ማጥፊያ ኮድ ይገባል
    // localStorage.removeItem('userToken');
    navigate('/login'); // ወደ መግቢያ ገጽ መመለሻ
  };

  return (
    <div className="access-container">
      <div className="access-card">
        <div className="card-header">
          <Videocam style={{ fontSize: 60, color: '#003366' }} />
          <h2>የቪዲዮ ጥሪ ድጋፍ</h2>
          <p>እባክዎ ለመጀመር የTIN ቁጥርዎን ያስገቡ</p>
        </div>

        <input 
          type="text" 
          placeholder="TIN ቁጥር (ለምሳሌ: 0001234567)" 
          value={tin}
          onChange={(e) => setTin(e.target.value)}
          className="tin-input"
        />
        
        <button onClick={handleStartCall} className="action-btn call-btn">
          ጥሪ ይጀምሩ
        </button>
        
        <button onClick={handleLogout} className="action-btn logout-btn">
          <ExitToApp style={{ marginRight: '8px' }} /> Logout
        </button>
      </div>
    </div>
  );
};

export default VideoCallAccess;