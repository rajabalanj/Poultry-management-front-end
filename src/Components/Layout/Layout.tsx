import React from 'react';
import { Row, Col } from 'react-bootstrap';
import Slidebar from './Slidebar';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div style={{ minHeight: '100vh' }}>
      <Row>
        <Col className='bg-light rounded' lg={2} style={{ paddingRight: 0 }}>
          <Slidebar />
        </Col>
        <Col lg={10}>
          <main 
            className="flex-grow-1 d-flex flex-column"
            style={{
              width: '100%',
              transition: 'margin-left 0.3s ease'
            }}
          >
            <div className="flex-grow-1">{children}</div>
            <Footer />
          </main>
        </Col>
      </Row>
    </div>
  );
};

export default Layout;