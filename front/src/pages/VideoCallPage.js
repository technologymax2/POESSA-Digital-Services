import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './VideoCallPage.css';

const VideoCallPage = () => {
  const { tin } = useParams();
  const navigate = useNavigate();
  const jitsiContainer = useRef(null);

  useEffect(() => {
    const domain = 'meet.jit.si';
    const options = {
      roomName: `POESSA-Call-${tin}`,
      width: '100%',
      height: '100%',
      parentNode: jitsiContainer.current,
      configOverwrite: { prejoinPageEnabled: false }
    };
    const api = new window.JitsiMeetExternalAPI(domain, options);
    return () => api.dispose();
  }, [tin]);

  return (
    <div className="video-page-container">
      <div className="video-header">
        <h3>የቪዲዮ ድጋፍ - TIN: {tin}</h3>
        <button className="close-btn" onClick={() => navigate('/')}>ጥሪውን ይዝጉ</button>
      </div>
      <div ref={jitsiContainer} className="video-stream" />
    </div>
  );
};

export default VideoCallPage;