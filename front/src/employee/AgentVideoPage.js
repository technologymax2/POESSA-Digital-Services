import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, CallEnd, Person, Warning } from '@mui/icons-material';
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
    setIsVerified(true);
    alert(`የጡረተኛው (TIN: ${tin}) ህልውና በስኬት ተረጋግጧል!`);
  };

  return (
    <div className="agent-interface">
      <aside className="client-info-panel">
        <div className="info-header">
          <h2><Person /> የጡረተኛው መረጃ</h2>
        </div>
        <p><strong>TIN ቁጥር:</strong> {tin}</p>
        <p><strong>ሁኔታ:</strong> <Warning /> ጽኑ ታማሚ</p>
        
        <button 
          className="action-btn-approve" 
          onClick={handleVerification}
          disabled={isVerified}
        >
          <CheckCircle /> {isVerified ? 'ተረጋግጧል' : 'በህይወት እንዳሉ ያረጋግጡ'}
        </button>

        <button className="action-btn-close" onClick={() => navigate('/dashboard')}>
          <CallEnd /> ጥሪውን ይዝጉ
        </button>
      </aside>
      
      <main className="video-main-panel">
        <div ref={jitsiContainer} className="video-stream" />
      </main>
    </div>
  );
};

export default AgentVideoPage;