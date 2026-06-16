import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import DashboardContent from "./DashboardContent";
import Footer from "../components/Footer";
import "./Dashboard.css";

const Dashboard = () => {
  const [lang, setLang] = useState("am");
  // በዲፎልት እውነተኛ ስክሪን እስኪለካ ድረስ ተዘግቶ (true) ይነሳ
  const [collapsed, setCollapsed] = useState(true); 

  // የስክሪኑን ስፋት በቋሚነት ለመከታተል
  useEffect(() => {
    const handleResize = () => {
      // ስክሪኑ ከ 1024px በላይ ከሆነ ሳይድባሩ ይከፈት፣ ካልሆነ ግን በራሱ ይዘጋ (collapsed ይሁን)
      if (window.innerWidth > 1024) {
        setCollapsed(false);
      } else {
        setCollapsed(true);
      }
    };

    // ገጹ ሲከፈት መጀመሪያ ለመለካት
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

      {/* OVERLAY: ሳይድባሩ ክፍት ከሆነ እና ስክሪኑ ከ 1024px በታች በሆነ ስልክ/ታብሌት ላይ ከጀርባ ያለውን ለማደብዘዝ */}
      {!collapsed && window.innerWidth <= 1024 && (
        <div 
          className="sidebar-mobile-overlay" 
          onClick={() => setCollapsed(true)} 
        />
      )}
    </div>
  );
};

export default Dashboard;
