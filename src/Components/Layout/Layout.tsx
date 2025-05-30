import React from 'react';
import Slidebar from './Slidebar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const isDesktop = window.innerWidth >= 992; // lg breakpoint

  return (
    <div className="d-flex">
      <Slidebar />
      <main 
        className="flex-grow-1"
        style={{
          marginLeft: isDesktop ? '250px' : '0',
          width: '100%',
          minHeight: '100vh',
          transition: 'margin-left 0.3s ease'
        }}
      >
        {children}
      </main>
    </div>
  );
};

export default Layout; 