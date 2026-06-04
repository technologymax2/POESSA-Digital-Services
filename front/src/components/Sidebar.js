import React, { useRef, useEffect } from 'react';
import { Dashboard, Description, VerifiedUser, Assessment, People, Settings, Menu, Close } from "@mui/icons-material";
import LanguageSwitcher from "./LanguageSwitcher";
import "./Sidebar.css";

const Sidebar = ({ currentLang, toggleLanguage, collapsed, setCollapsed }) => {
  const sidebarRef = useRef();

  // በሞባይል ስክሪን ከውጭ ሲጫን sidebar እንዲዘጋ
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (window.innerWidth <= 768 && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setCollapsed(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setCollapsed]);

  // ስክሪኑን ለይቶ ተገቢውን CSS class መምረጥ
  const getSidebarClass = () => {
    if (window.innerWidth <= 768) {
      return collapsed ? "mobile-open" : ""; // ለሞባይል
    }
    return collapsed ? "desktop-collapsed" : ""; // ለዴስክቶፕ
  };

  return (
    <>
      <button className="menu-toggle" onClick={() => setCollapsed(!collapsed)}>
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
          <div className="menu-item active"><Dashboard /> <span>{currentLang === "am" ? "ዳሽቦርድ" : "Dashboard"}</span></div>
          <div className="menu-item"><Description /> <span>{currentLang === "am" ? "ውክልናዎች" : "Delegations"}</span></div>
          <div className="menu-item"><VerifiedUser /> <span>{currentLang === "am" ? "የህይወት ማረጋገጫ" : "Life Verification"}</span></div>
          <div className="menu-item"><Assessment /> <span>{currentLang === "am" ? "ሪፖርቶች" : "Reports"}</span></div>
          <div className="menu-item"><People /> <span>{currentLang === "am" ? "ተጠቃሚዎች" : "Users"}</span></div>
        </nav>

        <div className="sidebar-footer">
          <div className="menu-item"><LanguageSwitcher currentLang={currentLang} toggleLanguage={toggleLanguage} /></div>
          <div className="menu-item"><Settings /> <span>{currentLang === "am" ? "መቼቶች" : "Settings"}</span></div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;