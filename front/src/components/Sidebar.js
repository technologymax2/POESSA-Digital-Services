import React from "react";
import { useNavigate } from "react-router-dom";
import { 
  Dashboard, Description, VerifiedUser, Assessment, 
  Videocam, Settings, Menu, Close 
} from "@mui/icons-material";
import LanguageSwitcher from "./LanguageSwitcher";
import "./Sidebar.css";

const Sidebar = ({ currentLang, toggleLanguage, collapsed, setCollapsed }) => {
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
    setCollapsed(true); // ሜኑ ሲነካ ሳይድባሩ እንዲዘጋ
  };

  return (
    <>
      <button className="menu-toggle" onClick={() => setCollapsed(!collapsed)}>
        {!collapsed ? <Close /> : <Menu />}
      </button>

      <aside className={`sidebar ${!collapsed ? "open" : ""}`}>
        <div className="sidebar-header">
          <div className="logo-circle">P</div>
          <div>
            <h2>POESSA</h2>
            <p>Digital Services</p>
          </div>
        </div>

        <nav className="menu-list">
          <div className="menu-item" onClick={() => handleNavigation("/dashboard")}>
            <Dashboard /> <span>{currentLang === "am" ? "ዳሽቦርድ" : "Dashboard"}</span>
          </div>
          <div className="menu-item" onClick={() => handleNavigation("/delegations")}>
            <Description /> <span>{currentLang === "am" ? "ውክልናዎች" : "Delegations"}</span>
          </div>
          <div className="menu-item" onClick={() => handleNavigation("/liveness")}>
            <VerifiedUser /> <span>{currentLang === "am" ? "የህይወት ማረጋገጫ" : "Life Verification"}</span>
          </div>
          <div className="menu-item" onClick={() => handleNavigation("/admin-dashboard")}>
            <Assessment /> <span>{currentLang === "am" ? "ሪፖርቶች" : "Reports"}</span>
          </div>
          <div className="menu-item" onClick={() => handleNavigation("/agent-call-center")}>
            <Videocam /> <span>{currentLang === "am" ? "የጥሪ ማስተናገጃ" : "Call Management"}</span>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="menu-item">
            <LanguageSwitcher currentLang={currentLang} toggleLanguage={toggleLanguage} />
          </div>
          <div className="menu-item">
            <Settings /> <span>{currentLang === "am" ? "መቼቶች" : "Settings"}</span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
