import React, { useRef, useEffect, useState } from "react";
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
  const sidebarRef = useRef(null);
  const navigate = useNavigate();

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Detect screen size changes
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isMobile &&
        collapsed &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target)
      ) {
        setCollapsed(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, [collapsed, isMobile, setCollapsed]);

  return (
    <>
      {/* Toggle Button */}
      <button
        className="menu-toggle"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? <Close /> : <Menu />}
      </button>

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`sidebar ${
          isMobile
            ? collapsed
              ? "mobile-open"
              : ""
            : collapsed
            ? "desktop-collapsed"
            : ""
        }`}
      >
        {/* Header */}
        <div className="sidebar-header">
          <div className="logo-circle">P</div>

          <div>
            <h2>POESSA</h2>
            <p>Digital Services</p>
          </div>
        </div>

        {/* Menu */}
        <nav className="menu-list">
          <div className="menu-item" onClick={() => navigate("/dashboard")}>
            <Dashboard />
            <span>
              {currentLang === "am" ? "ዳሽቦርድ" : "Dashboard"}
            </span>
          </div>

          <div className="menu-item" onClick={() => navigate("/delegations")}>
            <Description />
            <span>
              {currentLang === "am" ? "ውክልናዎች" : "Delegations"}
            </span>
          </div>

          <div className="menu-item" onClick={() => navigate("/liveness")}>
            <VerifiedUser />
            <span>
              {currentLang === "am"
                ? "የህይወት ማረጋገጫ"
                : "Life Verification"}
            </span>
          </div>

          <div
            className="menu-item"
            onClick={() => navigate("/admin-dashboard")}
          >
            <Assessment />
            <span>
              {currentLang === "am" ? "ሪፖርቶች" : "Reports"}
            </span>
          </div>

          <div
            className="menu-item"
            onClick={() => navigate("/agent-call-center")}
          >
            <Videocam />
            <span>
              {currentLang === "am"
                ? "የጥሪ ማስተናገጃ"
                : "Call Management"}
            </span>
          </div>
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="menu-item">
            <LanguageSwitcher
              currentLang={currentLang}
              toggleLanguage={toggleLanguage}
            />
          </div>

          <div className="menu-item">
            <Settings />
            <span>
              {currentLang === "am" ? "መቼቶች" : "Settings"}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
