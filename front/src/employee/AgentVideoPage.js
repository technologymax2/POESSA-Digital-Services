import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ExitToApp, CheckCircle, Person } from '@mui/icons-material';
import './AgentVideoPage.css';

const AgentVideoPage = () => {
  const { tin } = useParams();
  const navigate = useNavigate();
  const jitsiContainer = useRef(null);

  useEffect(() => {
    // Jitsi Meet ውቅር
    const domain = 'meet.jit.si';
    const options = {
      roomName: `POESSA-Call-${tin}`,
      width: '100%',
      height: '100%',
      parentNode: jitsiContainer.current,
      userInfo: { displayName: 'የደንበኛ ድጋፍ ኦፊሰር' }
    };
    const api = new window.JitsiMeetExternalAPI(domain, options);
    return () => api.dispose();
  }, [tin]);

  const handleLogout = () => {
    // የAuth መረጃዎችን ማጽዳት (ለምሳሌ: localStorage.removeItem('token'))
    navigate('/login');
  };

  return (
    <div className="agent-interface">
      {/* 1. የደንበኛ መረጃ ፓነል */}
      <aside className="client-info-panel">
        <div className="info-header">
          <h2><Person /> ደንበኛ</h2>
          <span className="status-live">በመስመር ላይ</span>
        </div>
        
        <div className="info-body">
          <p><strong>TIN ቁጥር:</strong> {tin}</p>
          <p><strong>ስም:</strong> አበበ በለው</p>
          <p><strong>አገልግሎት:</strong> የህይወት ማረጋገጫ</p>
          <hr />
          <h3>የጉዳይ ታሪክ</h3>
          <ul>
            <li>የመጀመሪያ ጥሪ - 2026/05/20</li>
          </ul>
        </div>
        
        <button className="action-btn-approve"><CheckCircle /> ሰነዱን ያጽድቁ</button>
        <button className="action-btn-logout" onClick={handleLogout}><ExitToApp /> ውጣ (Logout)</button>
      </aside>

      {/* 2. የቪዲዮ ጥሪ ፓነል */}
      <main className="video-main-panel">
        <div ref={jitsiContainer} className="video-container" />
      </main>
    </div>
  );
};

export default AgentVideoPage;