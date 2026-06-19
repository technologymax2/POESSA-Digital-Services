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

  // የህይወት ማረጋገጫን በፕሮፌሽናል መንገድ የሚይዝ ተግባር
  const handleLivenessNavigation = () => {
    const faydaNum = localStorage.getItem("faydaNumber"); // በሲስተሙ የተያዘው ፋይዳ ቁጥር
    if (faydaNum) {
      navigate(`/verify-process/${faydaNum}`);
    } else {
      // ፋይዳ ቁጥር ከሌለ ወደ ፍለጋ ገጽ በመምራት ተጠቃሚውን መምራት
      alert(currentLang === "am" ? "እባክዎ መጀመሪያ ፋይዳ ቁጥርዎን ያረጋግጡ" : "Please verify your Fayda number first");
      navigate("/idcard-generation-search");
    }
    setCollapsed(true);
  };

  return (
    <aside className={`poessa-sidebar ${!collapsed ? "poessa-sidebar--open" : ""}`}>
      <div className="poessa-sidebar__header">
        <div className="poessa-sidebar__header-info">
          <div className="poessa-sidebar__logo-circle">P</div>
          <div className="poessa-sidebar__title-wrapper">
            <h2>POESSA</h2>
            <p>Digital Services</p>
          </div>
        </div>
        <button className="poessa-sidebar__close-btn" onClick={() => setCollapsed(true)}>
          <Close style={{ color: "white", fontSize: "28px" }} />
        </button>
      </div>

      <nav className="poessa-sidebar__menu">
        <div className="poessa-sidebar__menu-item" onClick={() => handleNavigation("/dashboard")}>
          <Dashboard /> <span>{currentLang === "am" ? "ዳሽቦርድ" : "Dashboard"}</span>
        </div>
        <div className="poessa-sidebar__menu-item" onClick={() => handleNavigation("/delegations")}>
          <Description /> <span>{currentLang === "am" ? "ውክልናዎች" : "Delegations"}</span>
        </div>
        {/* የተስተካከለ የህይወት ማረጋገጫ ሜኑ */}
        <div className="poessa-sidebar__menu-item" onClick={handleLivenessNavigation}>
          <VerifiedUser /> <span>{currentLang === "am" ? "የህይወት ማረጋገጫ" : "Life Verification"}</span>
        </div>
        <div className="poessa-sidebar__menu-item" onClick={() => handleNavigation("/admin-dashboard")}>
          <Assessment /> <span>{currentLang === "am" ? "ሪፖርቶች" : "Reports"}</span>
        </div>
        <div className="poessa-sidebar__menu-item" onClick={() => handleNavigation("/agent-call-center")}>
          <Videocam /> <span>{currentLang === "am" ? "የጥሪ ማስተናገጃ" : "Call Management"}</span>
        </div>
      </nav>

      <div className="poessa-sidebar__footer">
        <div className="poessa-sidebar__menu-item">
           <LanguageSwitcher currentLang={currentLang} toggleLanguage={toggleLanguage} />
        </div>
        <div className="poessa-sidebar__menu-item" onClick={() => handleNavigation("/settings")}>
          <Settings /> <span>{currentLang === "am" ? "መቼቶች" : "Settings"}</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
