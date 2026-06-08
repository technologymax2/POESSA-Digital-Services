import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './VideoCallPage.css';

const VideoCallPage = () => {
  const { tin } = useParams(); // ከURL የመጣውን TIN ቁጥር ይይዛል
  const navigate = useNavigate();
  const jitsiContainer = useRef(null);

  useEffect(() => {
    // Jitsi Meet API ውቅር
    const domain = 'meet.jit.si';
    const options = {
      roomName: `POESSA-Call-${tin}`, // ለእያንዳንዱ ደንበኛ ልዩ የጥሪ ክፍል
      width: '100%',
      height: '100%',
      parentNode: jitsiContainer.current,
      userInfo: {
        displayName: `Customer TIN: ${tin}`
      }
    };

    const api = new window.JitsiMeetExternalAPI(domain, options);

    return () => api.dispose(); // ገጹ ሲዘጋ ጥሪውን ይዘጋል
  }, [tin]);

  return (
    <div className="video-page-container">
      <div className="video-header">
        <h3>ለደንበኛ TIN: {tin} ድጋፍ እየሰጡ ነው</h3>
        <button onClick={() => navigate('/dashboard')}>ጥሪውን ይዝጉ</button>
      </div>
      
      {/* የቪዲዮ ጥሪው እዚህ ነው የሚታየው */}
      <div ref={jitsiContainer} className="video-stream" />
    </div>
  );
};

export default VideoCallPage;