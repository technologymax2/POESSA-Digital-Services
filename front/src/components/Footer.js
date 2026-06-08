import React from 'react';
import './Footer.css';
import myPhoto from './my_photo.jpg'; // 👈 የእርስዎ ፎቶ እዚህ ፎልደር ውስጥ መኖሩን ያረጋግጡ

function Footer() {
  return (
    <footer className="admin-premium-footer">
      <div className="footer-divider"></div>
      <div className="footer-content-wrapper">
        
        {/* የግራ ክፍል፦ የእርስዎ ፕሮፋይል እና ስም */}
        <div className="footer-profile-box">
          <div className="footer-avatar-container">
            <img 
              src={myPhoto} 
              alt="Mamaru Anmaw" 
              className="footer-profile-img" 
              onError={(e) => {
                // ፎቶው ካልተገኘ ዲፎልት አምሳያ (Placeholder) እንዲተካ
                e.target.src = "https://via.placeholder.com/150";
              }}
            />
            <span className="profile-active-dot"></span>
          </div>
          <div className="footer-profile-text">
            <h4>Mamaru Anmaw</h4>
            <p>System Developer</p>
          </div>
        </div>

        {/* የመካከለኛው ክፍል፦ የመገናኛ መረጃዎች */}
        <div className="footer-contact-info">
          <div className="contact-item">
            <span className="contact-icon">📧</span>
            <a href="mailto:anmawumamaru7@gmail.com">anmawumamaru7@gmail.com</a>
          </div>
          <div className="contact-item">
            <span className="contact-icon">📞</span>
            <a href="tel:+251989860376">+251 989 860 376</a>
          </div>
        </div>

        {/* የቀኝ ክፍል፦ የባለቤትነት መብት ማረጋገጫ */}
        <div className="footer-copyright-box">
          <p>© {new Date().getFullYear()} <span>POESSA</span>. All Rights Reserved.</p>
          
        </div>

      </div>
    </footer>
  );
}

export default Footer;