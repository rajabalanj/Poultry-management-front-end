import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.min.css";
// import './Slidebar.css'; // Make sure you have this import for the new CSS

const SIDEBAR_WIDTH = "250px";
const DESKTOP_BREAKPOINT = 992;

const Slidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(window.innerWidth >= DESKTOP_BREAKPOINT);
  const location = useLocation();
  // const navigate = useNavigate();
  const isDesktop = window.innerWidth >= DESKTOP_BREAKPOINT;

  // State to manage which sub-menu is open
  const [openMenu, setOpenMenu] = useState<string | null>(null); // 'batch', 'egg', 'feed' or null

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
      setOpenMenu(null); // Close any open sub-menus on mobile collapse
    }
  }, [location, isDesktop]);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
    if (isOpen) { // If sidebar is closing, close any open sub-menus
      setOpenMenu(null);
    }
  };

  const closeSidebarMobile = () => {
    if (!isDesktop) {
      setIsOpen(false);
      setOpenMenu(null); // Close any open sub-menus on mobile link click
    }
  };

  const toggleMenu = (menuName: string) => {
    setOpenMenu(openMenu === menuName ? null : menuName); // Toggle or close if already open
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
          transform:
            !isDesktop && !isOpen
              ? `translateX(-${SIDEBAR_WIDTH})`
              : "translateX(0)",
          visibility: isDesktop || isOpen ? "visible" : "hidden",
        }}
      >
        <div className="px-3">
          <div style={{ marginTop: isDesktop ? "0" : "-15px" }}>
            <h5 className="mb-4">Menu</h5>
            <div className="sidebar">
              <ul className="nav-menu"> {/* New custom class */}

                {/* Dashboard - Simple Link */}
                <li className="nav-menu-item">
                  <Link
                    to="/"
                    className="nav-menu-link"
                    onClick={closeSidebarMobile}
                  >
                    <i className="bi bi-house me-2 icon-color-sidebar"></i>
                    Dashboard
                  </Link>
                </li>

                {/* Batch Management - Expandable Item */}
                <li className="nav-menu-item">
                  <div
                    className={`nav-menu-link expandable ${openMenu === 'batch' ? 'active' : ''}`}
                    onClick={() => toggleMenu('batch')}
                  >
                    <i className="bi bi-file-earmark-text me-2 icon-color-sidebar"></i>
                    Batch Management
                    <i className={`bi bi-chevron-right chevron-icon ${openMenu === 'batch' ? 'rotated' : ''}`}></i>
                  </div>
                  <ul className={`sub-menu ${openMenu === 'batch' ? 'open' : ''}`}>
                    <li className="sub-menu-item">
                      <Link
                        to="/add-batch"
                        className="nav-menu-link"
                        onClick={closeSidebarMobile}
                      >
                        Add Batch
                      </Link>
                    </li>
                    <li className="sub-menu-item">
                      <Link
                        to="/upload-batch"
                        className="nav-menu-link"
                        onClick={closeSidebarMobile}
                      >
                        Upload Batch
                      </Link>
                    </li>
                  </ul>
                </li>

                {/* Egg Room Management - Expandable Item */}
                <li className="nav-menu-item">
                  <div
                    className={`nav-menu-link expandable ${openMenu === 'egg' ? 'active' : ''}`}
                    onClick={() => toggleMenu('egg')}
                  >
                    <i className="bi bi-egg me-2 icon-color-sidebar"></i>
                    Egg Room Management
                    <i className={`bi bi-chevron-right chevron-icon ${openMenu === 'egg' ? 'rotated' : ''}`}></i>
                  </div>
                  <ul className={`sub-menu ${openMenu === 'egg' ? 'open' : ''}`}>
                    <li className="sub-menu-item">
                      <Link
                        to="/egg-room-stock"
                        className="nav-menu-link"
                        onClick={closeSidebarMobile}
                      >
                        Egg Room Stock
                      </Link>
                    </li>
                    <li className="sub-menu-item">
                      <Link
                        to="/egg-room-stock/report"
                        className="nav-menu-link"
                        onClick={closeSidebarMobile}
                      >
                        Egg Room Stock Report
                      </Link>
                    </li>
                  </ul>
                </li>

                {/* Feed Management - Expandable Item */}
                <li className="nav-menu-item">
                  <div
                    className={`nav-menu-link expandable ${openMenu === 'feed' ? 'active' : ''}`}
                    onClick={() => toggleMenu('feed')}
                  >
                    <i className="bi bi-bag me-2 icon-color-sidebar"></i>
                    Feed Management
                    <i className={`bi bi-chevron-right chevron-icon ${openMenu === 'feed' ? 'rotated' : ''}`}></i>
                  </div>
                  <ul className={`sub-menu ${openMenu === 'feed' ? 'open' : ''}`}>
                    <li className="sub-menu-item">
                      <Link
                        to="/feed"
                        className="nav-menu-link"
                        onClick={closeSidebarMobile}
                      >
                        Feeds
                      </Link>
                    </li>
                    <li className="sub-menu-item">
                      <Link
                        to="/feed-mill-stock"
                        className="nav-menu-link"
                        onClick={closeSidebarMobile}
                      >
                        Feed Compositions
                      </Link>
                    </li>
                  </ul>
                </li>

                {/* Configurations - Simple Link */}
                <li className="nav-menu-item">
                  <Link
                    to="/configurations"
                    className="nav-menu-link"
                    onClick={closeSidebarMobile}
                  >
                    <i className="bi bi-gear me-2 icon-color-sidebar"></i>
                    Configurations
                  </Link>
                </li>
              </ul>
            </div>
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