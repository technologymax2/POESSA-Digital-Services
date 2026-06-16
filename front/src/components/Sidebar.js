import React, { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dashboard,
  Description,
  VerifiedUser,
  Assessment,
  Videocam,
  Settings,
  Menu,
  Close,
} from "@mui/icons-material";

import LanguageSwitcher from "./LanguageSwitcher";
import "./Sidebar.css";

const Sidebar = ({
  currentLang,
  toggleLanguage,
  collapsed,
  setCollapsed,
}) => {
  const sidebarRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        window.innerWidth <= 1024 &&
        !collapsed && 
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        !event.target.closest(".menu-toggle")
      ) {
        setCollapsed(true); 
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, [collapsed, setCollapsed]);

  const handleNavigation = (path) => {
    navigate(path);
    if (window.innerWidth <= 1024) {
      setCollapsed(true); 
    }
  };

  const getSidebarClass = () => {
    // በስልክ ወይም ታብሌት ላይ ክፍት ከሆነ 'mobile-open' ይሆናል፤ ፅሁፉ ግን መቼም አይጠፋም
    if (window.innerWidth <= 1024) {
      return !collapsed ? "mobile-open" : ""; 
    }
    return ""; 
  };

  return (
    <>
      <button
        className={`menu-toggle ${!collapsed ? "is-open" : ""}`}
        onClick={() => setCollapsed(!collapsed)}
      >
        {!collapsed ? <Close style={{ fontSize: 28 }} /> : <Menu style={{ fontSize: 28 }} />}
      </button>

      <aside ref={sidebarRef} className={`sidebar ${getSidebarClass()}`}>
        <div className="sidebar-header">
          <div className="logo-circle">P</div>
          <div>
            <h2>POESSA</h2>
            <p>Digital Services</p>
          </div>
        </div>

        <nav className="menu-list">
          <div className="menu-item" onClick={() => handleNavigation("/dashboard")}>
            <Dashboard />
            <span>{currentLang === "am" ? "ዳሽቦርድ" : "Dashboard"}</span>
          </div>

          <div className="menu-item" onClick={() => handleNavigation("/delegations")}>
            <Description />
            <span>{currentLang === "am" ? "ውክልናዎች" : "Delegations"}</span>
          </div>

          <div className="menu-item" onClick={() => handleNavigation("/liveness")}>
            <VerifiedUser />
            <span>{currentLang === "am" ? "የህይወት ማረጋገጫ" : "Life Verification"}</span>
          </div>

          <div className="menu-item" onClick={() => handleNavigation("/admin-dashboard")}>
            <Assessment />
            <span>{currentLang === "am" ? "ሪፖርቶች" : "Reports"}</span>
          </div>

          <div className="menu-item" onClick={() => handleNavigation("/agent-call-center")}>
            <Videocam />
            <span>{currentLang === "am" ? "የጥሪ ማስተናገጃ" : "Call Management"}</span>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="menu-item">
            <LanguageSwitcher
              currentLang={currentLang}
              toggleLanguage={toggleLanguage}
            />
          </div>

          <div className="menu-item">
            <Settings />
            <span>{currentLang === "am" ? "መቼቶች" : "Settings"}</span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
