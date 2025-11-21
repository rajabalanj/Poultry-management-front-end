import React, { cloneElement, isValidElement } from 'react';
import { Row, Col } from 'react-bootstrap';
import Slidebar from './Slidebar';
import Footer from './Footer';
import { SidebarProvider, useSidebar } from '../../hooks/useSidebar';

interface LayoutProps {
  children: React.ReactNode;
}

const LayoutInner: React.FC<LayoutProps> = ({ children }) => {
  const { toggle, isOpen } = useSidebar();

  // Clone children and inject onToggleSidebar prop if it's a PageHeader
  const enhancedChildren = React.Children.map(children, (child) => {
    if (isValidElement(child) && child.type && 
        ((child.type as any).displayName === 'PageHeader' || 
         (child.type as any).name === 'PageHeader' ||
         child.type.toString().includes('PageHeader'))) {
      return cloneElement(child, { onToggleSidebar: toggle } as any);
    }
    return child;
  });

  return (
    <div style={{ minHeight: '100vh' }} className="d-flex flex-column position-relative">
      <Row className="flex-grow-1 w-100">
        <Col className='bg-light rounded d-none d-lg-block position-fixed' lg={2} style={{
          paddingRight: 0,
          height: '100vh',
          zIndex: 1000,
          overflowY: 'auto'
        }}>
          <Slidebar onToggle={toggle} />
        </Col>
        {/* Mobile sidebar - always rendered but positioned off-screen */}
        <div className="d-lg-none">
          <Slidebar onToggle={toggle} />
        </div>
        <Col xs={12} lg={10} className="d-flex flex-column ms-lg-auto">
          <main className="flex-grow-1">
            {enhancedChildren}
          </main>
          <Footer />
        </Col>
      </Row>
    </div>
  );
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <SidebarProvider>
      <LayoutInner>{children}</LayoutInner>
    </SidebarProvider>
  );
};

export default Layout;