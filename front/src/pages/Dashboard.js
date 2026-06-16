import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import DashboardContent from "./DashboardContent";
import Footer from "../components/Footer";
import "./Dashboard.css";

const Dashboard = () => {
  const [lang, setLang] = useState("am");
  // 💡 በዲፎልት desktop ላይ ተከፍቶ እንዲነሳ collapsed = false ይሁን
  const [collapsed, setCollapsed] = useState(false); 

  const toggleLanguage = () => {
    setLang((prev) => (prev === "am" ? "en" : "am"));
  };

  return (
    <div className="dashboard-page">
      <Sidebar
        currentLang={lang}
        toggleLanguage={toggleLanguage}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      <div className={`main-content ${collapsed ? "collapsed" : ""}`}>
        <Header
          title={
            lang === "am"
              ? "POESSA | ዲጂታል አገልግሎቶች"
              : "POESSA | Digital Services"
          }
        />

        <DashboardContent />
        <Footer />
      </div>

      {/* 💡 ማስተካከያ፡ ሳይድባሩ ክፍት ከሆነ (!collapsed) እና በስልክ ከሆነ Overlayው ይታያል */}
      {!collapsed && window.innerWidth <= 768 && (
        <div 
          className="sidebar-mobile-overlay" 
          onClick={() => setCollapsed(true)} // ሲነካ ሳይድባሩን ይዘጋዋል (true ያደርገዋል)
        />
      )}
    </div>
  );
};

export default Dashboard;
