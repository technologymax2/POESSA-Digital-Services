import React from 'react';
import { useParams } from 'react-router-dom';
import './AgentVideoPage.css';

const AgentVideoPage = () => {
  const { tin } = useParams();

  return (
    <div className="agent-interface">
      {/* 1. የደንበኛ መረጃ ፓነል */}
      <aside className="client-info-panel">
        <div className="info-header">
          <h2>የደንበኛ መረጃ</h2>
          <span className="status-live">በመስመር ላይ</span>
        </div>
        
        <div className="info-body">
          <p><strong>TIN ቁጥር:</strong> {tin}</p>
          <p><strong>ስም:</strong> አበበ በለው</p>
          <p><strong>የተጠየቀ አገልግሎት:</strong> የህይወት ማረጋገጫ</p>
          <hr />
          <h3>የጉዳይ ታሪክ</h3>
          <ul>
            <li>የመጀመሪያ ጥሪ - በ 2026/05/20</li>
            <li>የተፈታ ጉዳይ - የሰነድ ማጣራት</li>
          </ul>
        </div>
        
        <button className="action-btn">ሰነዱን ያጽድቁ</button>
      </aside>

      {/* 2. የቪዲዮ ጥሪ ፓነል */}
      <main className="video-main-panel">
        <div className="video-container">
           {/* እዚህ Jitsi API ወይም የቪዲዮ ዥረት ይቀመጣል */}
           <div className="placeholder-video">
             <p>ቪዲዮ ጥሪው በስክሪኑ ላይ ይታያል...</p>
           </div>
        </div>
      </main>
    </div>
  );
};

export default AgentVideoPage;