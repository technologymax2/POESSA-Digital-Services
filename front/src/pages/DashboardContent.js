import React from 'react';
import { Videocam } from '@mui/icons-material';
import './DashboardContent.css';

const DashboardContent = () => {
  return (
    <div className="dashboard-content">
     
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

      {/* Floating Video Call Banner */}
      <div className="floating-banner">
        <Videocam style={{ fontSize: 40 }} />
        <h3>ለታማሚ እና ለአእምሮ ሁኔታ ላላቸው ሰዎች</h3>
        <p>(For sick and mentally challenged people - call here directly)</p>
        <button className="video-btn">Start Video Call</button>
      </div>
    </div>
  );
};

export default DashboardContent;