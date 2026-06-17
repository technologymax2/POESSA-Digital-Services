import React from "react";
import { useNavigate } from "react-router-dom";
import { Dashboard, Description, VerifiedUser, Assessment, Videocam, Settings, Menu, Close } from "@mui/icons-material";
import LanguageSwitcher from "./LanguageSwitcher";
import "./Sidebar.css";

const Sidebar = ({ currentLang, toggleLanguage, collapsed, setCollapsed }) => {
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
    setCollapsed(true); // ገጽ ሲመረጥ ሳይድባሩ በራሱ ይዘጋል
  };

  return (
    <>
      <button className="menu-toggle" onClick={() => setCollapsed(!collapsed)}>
        {!collapsed ? <Close /> : <Menu />}
      </button>

      {/* collapsed state false ከሆነ 'open' የሚለው class ይገባል */}
      <aside className={`sidebar ${!collapsed ? "open" : ""}`}>
        <div className="sidebar-header">
          <div className="logo-circle">P</div>
          <div>
            <h2>POESSA</h2>
            <p>Digital Services</p>
          </div>
        </div>

        <nav className="menu-list">
          <div className="menu-item" onClick={() => handleNavigation("/dashboard")}><Dashboard /> <span>{currentLang === "am" ? "ዳሽቦርድ" : "Dashboard"}</span></div>
          <div className="menu-item" onClick={() => handleNavigation("/delegations")}><Description /> <span>{currentLang === "am" ? "ውክልናዎች" : "Delegations"}</span></div>
          {/* የተቀሩት ሜኑዎች... */}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
