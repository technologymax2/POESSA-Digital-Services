import React, { useState } from "react";
import Sidebar from "./Sidebar";
import "./Dashboard.css";

// ማስታወሻ፦ ይህንን አካል ከዋናው የዳሽቦርድ ገጽህ መዋቅር ጋር አዛምደው
function Dashboard() {
  const [collapsed, setCollapsed] = useState(false);
  const [currentLang, setCurrentLang] = useState("am");

  const toggleLanguage = () => {
    setCurrentLang(currentLang === "am" ? "en" : "am");
  };

  return (
    <div className="dashboard-page">
      {/* ሳይድባር አካል */}
      <Sidebar
        currentLang={currentLang}
        toggleLanguage={toggleLanguage}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      {/* ዋናው ይዘት - ሳይድባሩ ሲከፈት 'collapsed' የሚለውን ክላስ ይይዛል */}
      <div className={`main-content ${collapsed ? "collapsed" : ""}`}>
        
        {/* የላይኛው የሊንክ/ሎግኢን አሞሌ */}
        <div className="top-navbar no-print">
          <div className="portal-brand-title">
            {currentLang === "am" ? "POESSA | ዲጂታል አገልግሎቶች" : "POESSA | Digital Services"}
          </div>
          <button className="login-nav-btn">Login</button>
        </div>

        {/* ካርዶቹ የሚቀመጡበት ዋናው ክፍል */}
        <main className="dashboard-body">
          <div className="stats-grid">
            
            {/* ካርድ 1 */}
            <div className="stat-card">
              <div className="employee-avatar">👤</div>
              <h3>{currentLang === "am" ? "የህይወት ማረጋገጫ" : "Liveness Proof"}</h3>
              <p className="card-sub-text">Liveness Proof Verification</p>
              <button className="details-btn">Action now</button>
            </div>

            {/* ካርድ 2 */}
            <div className="stat-card">
              <div className="employee-avatar">📄</div>
              <h3>{currentLang === "am" ? "የውክልና ሰነድ ማቅረቢያ" : "Proxy Document Submission"}</h3>
              <p className="card-sub-text">Proxy Document Submission</p>
              <button className="details-btn">Action now</button>
            </div>

            {/* ካርድ 3 */}
            <div className="stat-card">
              <div className="employee-avatar">📁</div>
              <h3>{currentLang === "am" ? "የጉዳይ ክትትል" : "Case Tracking"}</h3>
              <p className="card-sub-text">Case Tracking System</p>
              <button className="details-btn">Action now</button>
            </div>

          </div>

          {/* የታችኛው ትልቅ የቪዲዮ ጥሪ ካርድ */}
          <div className="video-call-wide-card">
            <div className="video-icon-box">📹</div>
            <h2>{currentLang === "am" ? "የቪዲዮ ጥሪ ድጋፍ" : "Video Call Support"}</h2>
            <p>{currentLang === "am" ? "ለጤና እና ለሌላ ድጋፍ ለሚፈልጉ ወገኖች" : "For health and other support seekers"}</p>
            <button className="video-start-btn">
              {currentLang === "am" ? "ቪዲዮ ጥሪ ጀምር" : "Start Video Call"}
            </button>
          </div>
        </main>
      </div>

      {/* OVERLAY: ስልክ ላይ ሳይድባሩ ሲከፈት ከጀርባ ያለውን ያደበዝዛል፣ ሲነካም ይዘጋል */}
      {collapsed && (
        <div 
          className="sidebar-mobile-overlay" 
          onClick={() => setCollapsed(false)} 
        />
      )}
    </div>
  );
}

export default Dashboard;
