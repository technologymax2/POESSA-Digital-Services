import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExitToApp, Videocam } from '@mui/icons-material';
import './VideoCallAccess.css';

const VideoCallAccess = () => {
  const [tin, setTin] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleStartCall = async () => {
    if (tin.length >= 10) {
      setLoading(true);
      // Backend integration here
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLoading(false);
      navigate(`/video-call-room/${tin}`);
    } else {
      alert('እባክዎ ትክክለኛ የTIN ቁጥር ያስገቡ (ቢያንስ 10 አሃዝ)።');
    }
  };

  return (
    <div className="access-container">
      <div className="access-card">
        <div className="card-header">
          <Videocam style={{ fontSize: 60, color: '#003366' }} />
          <h2>የቪዲዮ ጥሪ ድጋፍ</h2>
        </div>
        <input 
          type="text" 
          placeholder="TIN ቁጥር (ለምሳሌ: 0001234567)" 
          value={tin}
          onChange={(e) => setTin(e.target.value)}
          className="tin-input"
        />
        <button onClick={handleStartCall} className="action-btn" disabled={loading}>
          {loading ? 'እያገናኘን ነው...' : 'ጥሪ ይጀምሩ'}
        </button>
        <button onClick={() => navigate('/login')} className="action-btn logout-btn">
          <ExitToApp style={{ marginRight: '8px' }} /> መውጫ (Logout)
        </button>
      </div>
    </div>
  );
};

export default VideoCallAccess;