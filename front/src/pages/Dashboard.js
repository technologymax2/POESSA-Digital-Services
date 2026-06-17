import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import DashboardContent from "./DashboardContent";
import Footer from "../components/Footer";
import "./Dashboard.css";

const Dashboard = () => {
  const [lang, setLang] = useState("am");
  // ሜኑ በዲፎልት ተዘግቶ ይነሳል (true = ተዘግቷል / false = ተከፍቷል)
  const [collapsed, setCollapsed] = useState(true); 

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

      {/* ሳይድባሩ ሲከፈት 'sidebar-open' የሚለው class ይጨመራል */}
      <div className={`main-content ${!collapsed ? "sidebar-open" : ""}`}>
        <Header
          title={lang === "am" ? "POESSA | ዲጂታል አገልግሎቶች" : "POESSA | Digital Services"}
        />
        <DashboardContent />
        <Footer />
      </div>

      {/* OVERLAY: ሳይድባሩ ክፍት ከሆነ ብቻ ይምጣ */}
      {!collapsed && (
        <div 
          className="sidebar-mobile-overlay" 
          onClick={() => setCollapsed(true)} 
        />
      )}
    </div>
  );
};

export default Dashboard;
