// src/components/Sidebar.jsx

import React from "react";
import { useNavigate } from "react-router-dom";
import { 
  Dashboard, Description, VerifiedUser, Assessment, 
  Settings, Close 
} from "@mui/icons-material";
import LanguageSwitcher from "./LanguageSwitcher";

const Sidebar = ({ currentLang, toggleLanguage, collapsed, setCollapsed }) => {
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
    setCollapsed(true);
  };

  const handleLivenessNavigation = () => {
    navigate("/verify");
    setCollapsed(true);
  };

  return (
    <aside 
      className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 ${
        collapsed ? "-translate-x-full" : "translate-x-0"
      }`}
    >
      {/* ሄደር ክፍል */}
      <div className="flex items-center justify-between p-5 bg-[#162447] text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white text-[#162447] font-bold flex items-center justify-center text-xl shadow">
            P
          </div>
          <div>
            <h2 className="font-bold text-lg leading-tight">POESSA</h2>
            <p className="text-xs text-gray-300">Digital Services</p>
          </div>
        </div>
        <button 
          className="md:hidden text-white hover:text-gray-200 transition cursor-pointer" 
          onClick={() => setCollapsed(true)}
        >
          <Close style={{ fontSize: "28px" }} />
        </button>
      </div>

      {/* ዋና ሜኑዎች */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <div 
          onClick={() => handleNavigation("/dashboard")}
          className="flex items-center gap-3.5 px-4 py-3 text-gray-700 hover:bg-[#162447] hover:text-white rounded-xl font-medium transition cursor-pointer group"
        >
          <Dashboard className="text-gray-500 group-hover:text-white transition" /> 
          <span>{currentLang === "am" ? "ዳሽቦርድ" : "Dashboard"}</span>
        </div>

        <div 
          onClick={() => handleNavigation("/report")}
          className="flex items-center gap-3.5 px-4 py-3 text-gray-700 hover:bg-[#162447] hover:text-white rounded-xl font-medium transition cursor-pointer group"
        >
          <Description className="text-gray-500 group-hover:text-white transition" /> 
          <span>{currentLang === "am" ? "ሪፖርቶች" : "Reports"}</span>
        </div>
        
        <div 
          onClick={handleLivenessNavigation}
          className="flex items-center gap-3.5 px-4 py-3 text-gray-700 hover:bg-[#162447] hover:text-white rounded-xl font-medium transition cursor-pointer group"
        >
          <VerifiedUser className="text-gray-500 group-hover:text-white transition" /> 
          <span>{currentLang === "am" ? "የህይወት ማረጋገጫ" : "Life Verification"}</span>
        </div>

        <div 
          onClick={() => handleNavigation("/admin-dashboard")}
          className="flex items-center gap-3.5 px-4 py-3 text-gray-700 hover:bg-[#162447] hover:text-white rounded-xl font-medium transition cursor-pointer group"
        >
          <Assessment className="text-gray-500 group-hover:text-white transition" /> 
          <span>{currentLang === "am" ? "አስተዳደር" : "Admin"}</span>
        </div>
      </nav>

      {/* የግርጌ ክፍል (Footer) */}
      <div className="p-4 border-t border-gray-100 space-y-2">
        <div className="px-2 py-1">
           <LanguageSwitcher currentLang={currentLang} toggleLanguage={toggleLanguage} />
        </div>
        <div 
          onClick={() => handleNavigation("/settings")}
          className="flex items-center gap-3.5 px-4 py-3 text-gray-700 hover:bg-[#162447] hover:text-white rounded-xl font-medium transition cursor-pointer group"
        >
          <Settings className="text-gray-500 group-hover:text-white transition" /> 
          <span>{currentLang === "am" ? "መቼቶች" : "Settings"}</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
