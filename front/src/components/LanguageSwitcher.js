import React from 'react';
import './LanguageSwitcher.css';

const LanguageSwitcher = ({ currentLang, toggleLanguage }) => {
  return (
    <button 
      onClick={toggleLanguage}
      className="lang-btn"
    >
      <span className="lang-icon">🌐</span>
      {currentLang === 'am' ? 'English' : 'አማርኛ'}
    </button>
  );
};

export default LanguageSwitcher;