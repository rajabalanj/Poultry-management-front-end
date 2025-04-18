import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.min.css";

const SIDEBAR_WIDTH = "250px";

const Slidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const isDesktop = window.innerWidth >= 992; // lg breakpoint

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 992) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    };

    // Set initial state
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (!isDesktop) {
      setIsOpen(false);
    }
  }, [location, isDesktop]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!isDesktop) {
        const sidebar = document.querySelector('.sidebar');
        const hamburger = document.querySelector('.hamburger-button');
        
        if (isOpen && sidebar && !sidebar.contains(event.target as Node) && 
            hamburger && !hamburger.contains(event.target as Node)) {
          setIsOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, isDesktop]);

  return (
    <>
      {!isDesktop && (
        <button
          className="hamburger-button btn btn-link position-fixed top-0 start-0 m-2 p-2"
          onClick={() => setIsOpen(!isOpen)}
          style={{ 
            zIndex: 1031,
            marginRight: '20px',
            backgroundColor: isOpen ? 'transparent' : '#f8f9fa',
            borderRadius: '4px'
          }}
        >
          <i className="bi bi-list" style={{ fontSize: '1.5rem' }}></i>
        </button>
      )}

      <div
        className={`sidebar ${isOpen ? "open" : ""}`}
        style={{
          width: isOpen ? SIDEBAR_WIDTH : isDesktop ? "0" : "250px",
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          backgroundColor: "#f8f9fa",
          transition: "width 0.3s ease",
          zIndex: 1030,
          overflowX: "hidden",
          paddingTop: isDesktop ? "20px" : "60px",
          boxShadow: isOpen ? "2px 0 5px rgba(0,0,0,0.1)" : "none",
          transform: isOpen ? "translateX(0)" : "translateX(-100%)",
          visibility: isDesktop ? "visible" : isOpen ? "visible" : "hidden"
        }}
      >
        <div className="px-3">
          <div style={{ marginTop: isDesktop ? "0" : "-15px" }}>
            <h5 className="mb-4">Menu</h5>
            <ul className="list-unstyled">
              <li className="mb-3">
                <Link 
                  to="/" 
                  className="text-decoration-none text-dark d-block py-2"
                  onClick={() => !isDesktop && setIsOpen(false)}
                >
                  <i className="bi bi-speedometer2 me-2"></i>
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {!isDesktop && isOpen && (
        <div
          className="overlay"
          onClick={() => setIsOpen(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 1029,
          }}
        />
      )}
    </>
  );
};

export default Slidebar;
