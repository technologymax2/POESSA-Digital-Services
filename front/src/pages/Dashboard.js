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
    <div className="poessa-dashboard">
      {/* ሜኑ መክፈቻ */}
      {collapsed && (
        <button className="poessa-dashboard__menu-open-btn" onClick={() => setCollapsed(false)}>
          ☰
        </button>
      )}

      <Sidebar
        currentLang={lang}
        toggleLanguage={toggleLanguage}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      <div className="poessa-dashboard__main-content">
        <Header
          title={lang === "am" ? "POESSA | ዲጂታል አገልግሎቶች" : "POESSA | Digital Services"}
        />
        <DashboardContent />
        <Footer />
      </div>

      {/* ማደብዘዣ (Overlay) */}
      {!collapsed && (
        <div className="poessa-dashboard__overlay" onClick={() => setCollapsed(true)} />
      )}
    </div>
  );
};

export default Dashboard;
