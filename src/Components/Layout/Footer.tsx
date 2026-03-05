import React from 'react';
import './Footer.css';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-content">
        <p>&copy; {currentYear} Poultrix. All Rights Reserved.</p>
        <p className="powered-by">Powered by Smart Stepz Technologies</p>
      </div>
    </footer>
  );
};

export default Footer;
