import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.min.css";
// import EggRoomStock from '../EggRoomStock';

const SIDEBAR_WIDTH = "250px";
const DESKTOP_BREAKPOINT = 992;

const Slidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(window.innerWidth >= DESKTOP_BREAKPOINT);
  const location = useLocation();
  const navigate = useNavigate();
  const isDesktop = window.innerWidth >= DESKTOP_BREAKPOINT;

  useEffect(() => {
    const handleResize = () => {
      setIsOpen(window.innerWidth >= DESKTOP_BREAKPOINT);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!isDesktop) {
      setIsOpen(false);
    }
  }, [location, isDesktop]);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const closeSidebarMobile = () => {
    if (!isDesktop) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {!isDesktop && (
        <button
          className="hamburger-button btn btn-link position-fixed top-0 start-0 m-2 p-2"
          onClick={toggleSidebar}
          style={{ zIndex: 1031 }}
        >
          <i className="bi bi-list" style={{ fontSize: "1.5rem" }}></i>
        </button>
      )}

      <div
        className={`sidebar ${isOpen ? "open" : ""}`}
        style={{
          width: isOpen ? SIDEBAR_WIDTH : "0",
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          backgroundColor: "#f8f9fa",
          transition: "width 0.3s ease, transform 0.3s ease",
          zIndex: 1030,
          overflowX: "hidden",
          paddingTop: isDesktop ? "20px" : "60px",
          boxShadow: isOpen ? "2px 0 5px rgba(0,0,0,0.1)" : "none",
          transform: !isDesktop && !isOpen ? `translateX(-${SIDEBAR_WIDTH})` : "translateX(0)",
          visibility: isDesktop || isOpen ? "visible" : "hidden",
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
                  onClick={() => {
                    closeSidebarMobile();
                    navigate("/");
                  }}
                >
                  <i className="bi bi-speedometer2 me-2"></i>
                  Dashboard
                </Link>
                <Link
                  to="/add-batch"
                  className="text-decoration-none text-dark d-block py-2"
                  onClick={closeSidebarMobile}
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  Add Batch
                </Link>
                
                <Link
                  to="/feed-mill-stock"
                  className="text-decoration-none text-dark d-block py-2"
                  onClick={closeSidebarMobile}
                >
                  <i className="bi bi-calculator me-2"></i>
                  Feed Compositions
                </Link>
                {/* <Link
                  to="/add-feed"
                  className="text-decoration-none text-dark d-block py-2"
                  onClick={closeSidebarMobile}
                >
                  <i className="bi bi-basket me-2"></i>
                  Feed Create
                </Link>
                <Link
                  to="/feed-list"
                  className="text-decoration-none text-dark d-block py-2"
                  onClick={closeSidebarMobile}> 
                  <i className="bi bi-basket me-2"></i>
                  Feed List
                  </Link> */}
                <Link
                  to="/feed"
                  className="text-decoration-none text-dark d-block py-2"
                  onClick={closeSidebarMobile}>
                    <i className="bi bi-basket me-2"></i>
                  Feed Management </Link>
                  <Link
                  to="/upload-batch"
                  className="text-decoration-none text-dark d-block py-2"                          
                  onClick={closeSidebarMobile}>
                  <i className="bi bi-upload me-2"></i>
                  Upload Batch
                  </Link>
                <Link
                to="/configurations"
                className="text-decoration-none text-dark d-block py-2"
                onClick={closeSidebarMobile}
              >
                <i className="bi bi-gear me-2"></i>
                Configurations
              </Link>
              
              <Link
                  to="/egg-room-stock"
                  className="text-decoration-none text-dark d-block py-2"
                  onClick={closeSidebarMobile}
                >
                  <i className="bi bi-egg me-2"></i>
                  Egg Room Stock
                </Link>
                <Link
                  to="/egg-room-stock/report"
                  className="text-decoration-none text-dark d-block py-2"
                  onClick={closeSidebarMobile}
                >
                  <i className="bi bi-file-earmark-text me-2"></i>
                  Egg Room Stock Report
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {!isDesktop && isOpen && (
        <div
          className="overlay"
          onClick={toggleSidebar}
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