import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import DashboardContent from "./DashboardContent";
import Footer from "../components/Footer";

const Dashboard = () => {
  const [lang, setLang] = useState("am");
  const [collapsed, setCollapsed] = useState(true);

  const toggleLanguage = () => {
    setLang((prev) => (prev === "am" ? "en" : "am"));
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden relative">
      {/* Mobile Menu Button (Hidden on desktop because sidebar is always visible via md:translate-x-0) */}
      {collapsed && (
        <button 
          className="fixed top-4 left-4 z-30 bg-[#162447] text-white p-2 rounded-lg text-xl shadow-md md:hidden cursor-pointer" 
          onClick={() => setCollapsed(false)}
        >
          ☰
        </button>
      )}

      {/* Sidebar Component */}
      <Sidebar
        currentLang={lang}
        toggleLanguage={toggleLanguage}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      {/* Main Content Area (Pushed right on desktop with md:pl-72 to make room for the sidebar) */}
      <div className="flex flex-col flex-1 h-full overflow-y-auto md:pl-72">
        <Header
          title={lang === "am" ? "POESSA | ዲጂታል አገልግሎቶች" : "POESSA | Digital Services"}
        />
        <div className="flex-1">
          <DashboardContent />
        </div>
        <Footer />
      </div>

      {/* Semi-transparent Overlay for mobile screens when the sidebar is open */}
      {!collapsed && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 md:hidden" 
          onClick={() => setCollapsed(true)} 
        />
      )}
    </div>
  );
};

export default Dashboard;
