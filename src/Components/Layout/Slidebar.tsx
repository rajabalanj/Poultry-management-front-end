import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.min.css";
import { useAuth } from "../../hooks/useAuth";
import { useSidebar } from "../../hooks/useSidebar";
import annamalaiyarlogo from "../../styles/annamalaiyarlogo.png"; // Import the image

// import './Slidebar.css'; // Make sure you have this import for the new CSS

const SIDEBAR_WIDTH = "100%";
// Using Bootstrap's lg breakpoint (≥992px) instead of hardcoded value

interface SlidebarProps {
  onToggle?: () => void;
}

const Slidebar: React.FC<SlidebarProps> = ({ onToggle }) => {
  const { user } = useAuth();
  const groups = user?.profile?.['cognito:groups'];
  const userGroups: string[] = Array.isArray(groups) ? groups : [];
  const { isOpen, toggle, isDesktop } = useSidebar();
  const location = useLocation();

  // State to manage which sub-menu is open
  const [openMenu, setOpenMenu] = useState<string | null>(null); // 'batch', 'egg', 'feed', 'finance' etc.

  useEffect(() => {
    if (!isDesktop) {
      setOpenMenu(null); // Close any open sub-menus on mobile collapse
    }
  }, [location, isDesktop]);

  // Add this useEffect to manage openMenu based on current location
  useEffect(() => {
  // Determine which parent menu should be open based on the current path
  if (
    location.pathname.startsWith("/add-batch") ||
    location.pathname.startsWith("/upload-batch") ||
    location.pathname.startsWith("/production")
  ) {
    setOpenMenu("batch");
  } else if (location.pathname.startsWith("/egg-room-stock")) {
    setOpenMenu("egg");
  } else if (
    location.pathname.startsWith("/feed") ||
    location.pathname.startsWith("/feed-mill-stock")
  ) {
    setOpenMenu("feed");
  } else if (
    location.pathname.startsWith("/inventory-items")
  ) {
    setOpenMenu("inventory");
  } else if (
    location.pathname.startsWith("/sales-orders")
  ) {
    setOpenMenu("sales");
  } else if (
    location.pathname.startsWith("/financial-reports") ||
    location.pathname.startsWith("/operational-expenses")
  ) {
    setOpenMenu("finance");
  } else if (
    location.pathname.startsWith("/sheds") ||
    location.pathname.startsWith("/swap-sheds")
  ) {
    setOpenMenu("shed");
  } else {
    setOpenMenu(null); // No sub-menu related path, so close any open sub-menus
  }
}, [location.pathname]);
 // Re-run when the path changes


  const closeSidebarMobile = () => {
    if (!isDesktop) {
      (onToggle ?? toggle)();
    }
  };

  const toggleMenu = (menuName: string) => {
    setOpenMenu(openMenu === menuName ? null : menuName); // Toggle or close if already open
  };

  const sidebarStyle: React.CSSProperties = isDesktop
  ? {
      // Desktop styles
      position: 'relative', // Keep it in the layout flow
      width: '100%', // Fill the parent Col
      height: '100vh',
      paddingTop: '20px',
      boxShadow: '2px 0 5px rgba(0,0,0,0.1)',
      transition: 'width 0.3s ease',
      overflowY: 'auto' // Add scroll for long content
    }
  : {
      // Mobile styles (mostly existing)
      width: isOpen ? SIDEBAR_WIDTH : '0',
      position: 'fixed',
      top: 0,
      left: 0,
      height: '100vh',
      transition: 'width 0.3s ease, transform 0.3s ease',
      zIndex: 1030,
      overflowX: 'hidden',
      paddingTop: '50px',
      boxShadow: isOpen ? '2px 0 5px rgba(0,0,0,0.1)' : 'none',
      transform: isOpen ? 'translateX(0)' : `translateX(-100%)`,
      visibility: isOpen ? 'visible' : 'hidden',
    };



  return (
    <>
      <div
        className={`sidebar ${isOpen ? "open" : ""}`}
        style={sidebarStyle}
      >
        <div className="px-3">
          <div style={{ marginTop: isDesktop ? "0" : "-15px" }}>
          <h5 className="sidebar-header ms-4 d-flex align-items-center mb-4 p-2" style={{ borderRadius: '8px' }}>
              <div className="text-center">
              <img src={annamalaiyarlogo} alt="Annamalaiyar Logo" style={{ width: '50%', height: 'auto'}} className="rounded" />
            </div>
            </h5>            
            <h5 className="ms-4 fw-bold">Menu</h5>
            
            <div className="sidebar">
              <ul className="nav-menu"> {/* New custom class */}

                {/* Dashboard - Simple Link */}
                <li className="nav-menu-item fw-bold">
                  <Link
                    to="/"
                    className={`nav-menu-link ${location.pathname === "/" ? "active-link" : ""}`}
                    onClick={closeSidebarMobile}
                  >
                    <i className="bi bi-house me-2 icon-color-sidebar"></i>
                    Dashboard
                  </Link>
                </li>
                <hr className="my-2 text-primary" />
                

                {/* Batch Management - Expandable Item */}
                <li className="nav-menu-item">
                  <div
                    className={`nav-menu-link fw-bold expandable ${openMenu === 'batch' ? 'active' : ''}`}
                    onClick={() => toggleMenu('batch')}
                  >
                    <i className="bi bi-file-earmark-text me-2 icon-color-sidebar"></i>
                    Batch Management
                    <i className={`bi bi-chevron-right chevron-icon ${openMenu === 'batch' ? 'rotated' : ''}`}></i>
                  </div>
                  <ul className={`sub-menu ${openMenu === 'batch' ? 'open' : ''}`}>
                    <li className="sub-menu-item">
                      <Link
                        to="/production"
                        className={`nav-menu-link ${location.pathname === "/production" ? "active-link" : ""}`}
                        onClick={closeSidebarMobile}
                      >
                        Production
                      </Link>
                    </li>
                    <li className="sub-menu-item">
                      <Link
                        to="/add-batch"
                        className={`nav-menu-link ${location.pathname === "/add-batch" ? "active-link" : ""}`}
                        onClick={closeSidebarMobile}
                      >
                        Add Batch
                      </Link>
                    </li>
                    <li className="sub-menu-item">
                      <Link
                        to="/upload-batch"
                        className={`nav-menu-link ${location.pathname === "/upload-batch" ? "active-link" : ""}`}
                        onClick={closeSidebarMobile}
                      >
                        Upload Batch
                      </Link>
                    </li>
                  </ul>
                </li>
                <hr className="my-2 text-primary" />

                <li className="nav-menu-item fw-bold">
                      <Link
                        to="/egg-room-stock"
                        className={`nav-menu-link ${location.pathname === "/egg-room-stock" ? "active-link" : ""}`}
                        onClick={closeSidebarMobile}
                      >
                        <i className="bi bi-egg me-2 icon-color-sidebar"></i>
                        Egg Room Stock
                      </Link>
                    </li>
                    <hr className="my-2 text-primary" />

                


                

                <li className="nav-menu-item fw-bold">
                  <Link
                    to="/feed-mill-stock"
                    className={`nav-menu-link ${location.pathname === "/feed-mill-stock" ? "active-link" : ""}`}
                    onClick={closeSidebarMobile}
                  >
                    <i className="bi bi-bag me-2 icon-color-sidebar"></i>
                    Feed Compositions
                  </Link>
                </li>
                <hr className="my-2 text-primary" />

                <li className="nav-menu-item fw-bold">
                  <Link
                    to="/inventory-items"
                    className={`nav-menu-link ${location.pathname === "/inventory-items" ? "active-link" : ""}`}
                    onClick={closeSidebarMobile}
                  >
                    <i className="bi bi-box-seam me-2 icon-color-sidebar"></i>
                    Inventory
                  </Link>
                </li>
                <hr className="my-2 text-primary" />

                <li className="nav-menu-item fw-bold">
                  <Link
                    to="/purchase-orders"
                    className={`nav-menu-link ${location.pathname === "/purchase-orders" ? "active-link" : ""}`}
                    onClick={closeSidebarMobile}
                  >
                    <i className="bi bi-cart4 me-2 icon-color-sidebar"></i>
                    Purchase
                  </Link>
                </li>
                <hr className="my-2 text-primary" />
                
                <li className="nav-menu-item fw-bold">
                  <Link
                    to="/sales-orders"
                    className={`nav-menu-link ${location.pathname === "/sales-orders" ? "active-link" : ""}`}
                    onClick={closeSidebarMobile}
                  >
                    <i className="bi bi-receipt me-2 icon-color-sidebar"></i>
                    Sales
                  </Link>
                </li>
                <hr className="my-2 text-primary" />

                <li className="nav-menu-item fw-bold">
                  <Link
                    to="/business-partners"
                    className={`nav-menu-link ${location.pathname === "/business-partners" ? "active-link" : ""}`}
                    onClick={closeSidebarMobile}
                  >
                    <i className="bi bi-people me-2 icon-color-sidebar"></i>
                    People
                  </Link>
                </li>
                <hr className="my-2 text-primary" />

                {/* Shed Management - Expandable Item */}
                <li className="nav-menu-item">
                  <div
                    className={`nav-menu-link fw-bold expandable ${openMenu === 'shed' ? 'active' : ''}`}
                    onClick={() => toggleMenu('shed')}
                  >
                    <i className="bi bi-house-door me-2 icon-color-sidebar"></i>
                    Shed Management
                    <i className={`bi bi-chevron-right chevron-icon ${openMenu === 'shed' ? 'rotated' : ''}`}></i>
                  </div>
                  <ul className={`sub-menu ${openMenu === 'shed' ? 'open' : ''}`}>
                    <li className="sub-menu-item">
                      <Link
                        to="/sheds"
                        className={`nav-menu-link ${location.pathname === "/sheds" ? "active-link" : ""}`}
                        onClick={closeSidebarMobile}
                      >
                        Sheds
                      </Link>
                    </li>
                    <li className="sub-menu-item">
                      <Link
                        to="/swap-sheds"
                        className={`nav-menu-link ${location.pathname === "/swap-sheds" ? "active-link" : ""}`}
                        onClick={closeSidebarMobile}
                      >
                        Swap Sheds
                      </Link>
                    </li>
                  </ul>
                </li>
                <hr className="my-2 text-primary" />

                {/* Finance - Expandable Item */}
                <li className="nav-menu-item">
                  <div
                    className={`nav-menu-link fw-bold expandable ${openMenu === 'finance' ? 'active' : ''}`}
                    onClick={() => toggleMenu('finance')}
                  >
                    <i className="bi bi-cash-coin me-2 icon-color-sidebar"></i>
                    Finance
                    <i className={`bi bi-chevron-right chevron-icon ${openMenu === 'finance' ? 'rotated' : ''}`}></i>
                  </div>
                  <ul className={`sub-menu ${openMenu === 'finance' ? 'open' : ''}`}>
                    <li className="sub-menu-item">
                      <Link
                        to="/financial-reports"
                        className={`nav-menu-link ${location.pathname === "/financial-reports" ? "active-link" : ""}`}
                        onClick={closeSidebarMobile}
                      >
                        Financial Reports
                      </Link>
                    </li>
                    <li className="sub-menu-item">
                      <Link
                        to="/operational-expenses"
                        className={`nav-menu-link ${location.pathname === "/operational-expenses" ? "active-link" : ""}`}
                        onClick={closeSidebarMobile}
                      >
                        Operational Expenses
                      </Link>
                    </li>
                  </ul>
                </li>

                {/* Configurations - Simple Link */}
                {userGroups.includes('admin') && (
                <li className="nav-menu-item fw-bold">
                  <Link
                    to="/configurations"
                    className={`nav-menu-link ${location.pathname === "/configurations" ? "active-link" : ""}`}
                    onClick={closeSidebarMobile}
                  >
                    <i className="bi bi-gear me-2 icon-color-sidebar"></i>
                    Configurations
                  </Link>
                </li>
                )}
                <hr className="my-2 text-primary" />
                
              </ul>
              {/* </ul> */}
            </div>
          </div>
        </div>
      </div>

      {!isDesktop && isOpen && (
        <div
          className="overlay"
          onClick={(onToggle ?? toggle)}
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