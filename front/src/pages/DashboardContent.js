import React from 'react';
import { Videocam } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom'; // ለማገናኘት አስፈላጊ
import './DashboardContent.css';

const DashboardContent = () => {
  const navigate = useNavigate(); // የገጽ መቀያየሪያ hook

  return (
    <div className="dashboard-content">
      {/* የቪዲዮ ጥሪ ባነር - ወደ VideoCallAccess ያገናኛል */}
      <div className="floating-banner">
        <div style={{ color: '#ffd700', marginBottom: '10px' }}>
          <Videocam style={{ fontSize: 50 }} />
        </div>
        <h3 style={{ color: 'white', marginBottom: '5px' }}>የቪዲዮ ጥሪ ድጋፍ</h3>
        <p style={{ color: '#dbe6f3', fontSize: '0.9rem' }}>
          ለጤና እና ለልዩ ድጋፍ ለሚፈልጉ ወገኖች
        </p>
        <button 
          className="video-btn" 
          onClick={() => navigate('/video-call')} // ወደ ተፈላጊው ገጽ ይወስዳል
        >
          ቪዲዮ ጥሪ ይጀምሩ
        </button>
      </div>
      
      {/* ሌሎች የዳሽቦርድ አገልግሎት ካርዶች */}
      <div className="action-cards-grid">
        <div className="action-card">
          <div className="icon-box">👤</div>
          <h3>የህይወት ማረጋገጫ</h3>
          <p>Liveness Proof</p>
          <button>Action now</button>
        </div>
        <div className="action-card">
          <div className="icon-box">📄</div>
          <h3>የውክልና ሰነድ ማቅረቢያ</h3>
          <p>Proxy Document Submission</p>
          <button>Action now</button>
        </div>
        <div className="action-card">
          <div className="icon-box">📂</div>
          <h3>የጉዳይ ክትትል</h3>
          <p>Case Tracking</p>
          <button>Action now</button>
        </div>
      </div>
    </div>
  );
};

export default DashboardContent;