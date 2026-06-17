import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import DashboardContent from "./DashboardContent";
import Footer from "../components/Footer";
import "./Dashboard.css";

const Dashboard = () => {
  const [lang, setLang] = useState("am");
  const [collapsed, setCollapsed] = useState(true);

  const toggleLanguage = () => {
    setLang((prev) => (prev === "am" ? "en" : "am"));
  };

  return (
    <div className="dashboard-page">
      {/* ሜኑ መክፈቻ (ስክሪኑ ላይ የሚታየው) */}
      {collapsed && (
        <button className="open-menu-btn" onClick={() => setCollapsed(false)}>
          ☰
        </button>
      )}

      <Sidebar
        currentLang={lang}
        toggleLanguage={toggleLanguage}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      <div className="main-content">
        <Header
          title={lang === "am" ? "POESSA | ዲጂታል አገልግሎቶች" : "POESSA | Digital Services"}
        />
        <DashboardContent />
        <Footer />
      </div>

      {/* ሳይድባሩ ክፍት ከሆነ የሚመጣው ማደብዘዣ */}
      {!collapsed && (
        <div className="sidebar-mobile-overlay" onClick={() => setCollapsed(true)} />
      )}
    </div>
  );
};

export default Dashboard;
