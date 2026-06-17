import React from "react";
import { useNavigate } from "react-router-dom";
import { 
  Dashboard, Description, VerifiedUser, Assessment, 
  Videocam, Settings, Close 
} from "@mui/icons-material";
import LanguageSwitcher from "./LanguageSwitcher";
import "./Sidebar.css";

const Sidebar = ({ currentLang, toggleLanguage, collapsed, setCollapsed }) => {
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
    setCollapsed(true);
  };

  return (
    <aside className={`sidebar ${!collapsed ? "open" : ""}`}>
      {/* ሄደር - ስም እና Close አዝራር */}
      <div className="sidebar-header">
        <div className="header-info">
          <div className="logo-circle">P</div>
          <div>
            <h2>POESSA</h2>
            <p>Digital Services</p>
          </div>
        </div>
        
        {/* የ Close አዝራር (X) */}
        <button className="close-menu-btn" onClick={() => setCollapsed(true)}>
          <Close style={{ color: "white", fontSize: "28px" }} />
        </button>
      </div>

      {/* ሜኑ ዝርዝር */}
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

      {/* ፉተር - ቋንቋ እና መቼቶች */}
      <div className="sidebar-footer">
        <div className="menu-item">
           <LanguageSwitcher currentLang={currentLang} toggleLanguage={toggleLanguage} />
        </div>
        <div className="menu-item" onClick={() => handleNavigation("/settings")}>
          <Settings /> <span>{currentLang === "am" ? "መቼቶች" : "Settings"}</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
