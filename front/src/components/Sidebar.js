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
        window.innerWidth <= 768 &&
        collapsed && 
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        !event.target.closest(".menu-toggle")
      ) {
        setCollapsed(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, [collapsed, setCollapsed]);

  const handleNavigation = (path) => {
    navigate(path);
    if (window.innerWidth <= 768) {
      setCollapsed(false); 
    }
  };

  const getSidebarClass = () =>
    window.innerWidth <= 768
      ? collapsed
        ? "mobile-open"
        : ""
      : collapsed
      ? "desktop-collapsed"
      : "";

  return (
    <>
      {/* 'is-open' የሚለው ክላስ ሲጨምር አዝራሩ ወደ ቀኝ በኩል ይዞራል */}
      <button
        className={`menu-toggle ${collapsed ? "is-open" : ""}`}
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? <Close /> : <Menu />}
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
