import React from 'react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-content">
        <p>&copy; {currentYear} Sri Annamalaiyar Agro. All Rights Reserved.</p>
        <p className="powered-by">Powered by Smart Stepz Technologies</p>
      </div>
    </footer>
  );
};

export default Footer;
