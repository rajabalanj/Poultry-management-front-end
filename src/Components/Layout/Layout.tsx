import React from 'react';
import Slidebar from './Slidebar';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const isDesktop = window.innerWidth >= 992; // lg breakpoint

  return (
    <div className="d-flex flex-column" style={{ minHeight: '100vh' }}>
      <div className="d-flex flex-grow-1">
        <Slidebar />
        <main 
          className="flex-grow-1 d-flex flex-column"
          style={{
            marginLeft: isDesktop ? '250px' : '0',
            width: '100%',
            transition: 'margin-left 0.3s ease'
          }}
        >
          <div className="flex-grow-1">{children}</div>
          <Footer />
        </main>
      </div>
    </div>
  );
};

export default Layout; 