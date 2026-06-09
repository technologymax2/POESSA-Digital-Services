import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, CallEnd, Person } from '@mui/icons-material';
import './AgentVideoPage.css';

const AgentVideoPage = () => {
  const { tin } = useParams();
  const navigate = useNavigate();
  const jitsiContainer = useRef(null);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const domain = 'meet.jit.si';
    const options = {
      roomName: `POESSA-Call-${tin}`,
      width: '100%',
      height: '100%',
      parentNode: jitsiContainer.current
    };
    const api = new window.JitsiMeetExternalAPI(domain, options);
    return () => api.dispose();
  }, [tin]);

  const handleVerification = () => {
    // እዚህ ላይ Backend API በመጠቀም ዳታቤዙን ያዘምኑ
    setIsVerified(true);
    alert(`TIN: ${tin} - በህይወት መኖራቸው ተረጋግጧል!`);
  };

  return (
    <div className="agent-interface">
      <aside className="client-info-panel">
        <h2><Person /> የጡረተኛው መረጃ</h2>
        <p><strong>TIN ቁጥር:</strong> {tin}</p>
        <button className="verify-btn" onClick={handleVerification} disabled={isVerified}>
          <CheckCircle /> {isVerified ? 'ተረጋግጧል' : 'በህይወት እንዳሉ ያረጋግጡ'}
        </button>
        <button className="close-btn" onClick={() => navigate('/dashboard')}>ጥሪውን ይዝጉ</button>
      </aside>
      <main className="video-main-panel">
        <div ref={jitsiContainer} className="video-stream" />
      </main>
    </div>
  );
};

export default AgentVideoPage;