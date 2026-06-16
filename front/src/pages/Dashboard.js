import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import DashboardContent from "./DashboardContent";
import Footer from "../components/Footer";
import "./Dashboard.css";

const Dashboard = () => {
  const [lang, setLang] = useState("am");
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

      {/* ሳይድባሩ ሲዘጋ ወይም ሲከፈት ዲዛይኑን በሲኤስኤስ ለማስተካከል ክላስ ስም ተጨምሮበታል */}
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

      {/* OVERLAY: በሞባይል ላይ ሜኑው ሲከፈት ከጀርባ ያለውን የዳሽቦርድ ክፍል ለማደብዘዝ */}
      {collapsed && window.innerWidth <= 768 && (
        <div 
          className="sidebar-mobile-overlay" 
          onClick={() => setCollapsed(false)} 
        />
      )}
    </div>
  );
};

export default Dashboard;
