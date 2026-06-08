import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './VideoCallAccess.css';

const VideoCallAccess = () => {
  const [tin, setTin] = useState('');
  const navigate = useNavigate();

  const handleStartCall = () => {
    if (tin.length >= 10) { // የTIN ቁጥር ትክክለኛነት ማረጋገጫ
      navigate(`/video-call-room/${tin}`);
    } else {
      alert('እባክዎ ትክክለኛ የTIN ቁጥር ያስገቡ። የ Tin አሃዝ ከ10 አያንስም');
    }
  };

  return (
    <div className="access-container">
      <div className="access-card">
        <h2>የቪዲዮ ጥሪ ድጋፍ</h2>
        <p>እባክዎ ለመጀመር የTIN ቁጥርዎን ያስገቡ</p>
        <input 
          type="text" 
          placeholder="TIN ቁጥር (ለምሳሌ: 0001234567)" 
          value={tin}
          onChange={(e) => setTin(e.target.value)}
        />
        <button onClick={handleStartCall}>ጥሪ ይጀምሩ</button>
      </div>
    </div>
  );
};

export default VideoCallAccess;