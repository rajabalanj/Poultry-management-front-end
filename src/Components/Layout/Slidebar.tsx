import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.min.css";
import "./Slidebar.css"; // Import custom sidebar styles
import { useAuth } from "../../hooks/useAuth";
import { useSidebar } from "../../hooks/useSidebar";
import annamalaiyarlogo from "../../styles/annamalaiyarlogo.png"; // Import the image

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
    location.pathname.startsWith("/inventory-items") ||
    location.pathname.startsWith("/inventory-stock-level-report") ||
    location.pathname.startsWith("/low-stock-report") ||
    location.pathname.startsWith("/top-selling-items-report")
  ) {
    setOpenMenu("inventory");
  } else if (
    location.pathname.startsWith("/financial-reports") ||
    location.pathname.startsWith("/operational-expenses")
  ) {
    setOpenMenu("finance");
  } else if (
    location.pathname.startsWith("/reports")
  ) {
    setOpenMenu("reports");
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
      boxShadow: '2px 0 5px rgba(0,0,0,0.1)',
      transition: 'width 0.3s ease',
      overflowY: 'auto', // Add scroll for long content
      paddingTop: '0', // Remove top padding
      backgroundColor: '#1e40af', // Deep saturated blue
    }
  : {
      // Mobile styles - using Bootstrap offcanvas style with responsive width
      width: window.innerWidth > 768 ? '320px' : '80%', // Use fixed width on larger screens, percentage on mobile
      maxWidth: '320px', // Set maximum width for all screen sizes
      position: 'fixed',
      top: 0,
      left: 0,
      height: '100vh',
      transition: 'transform 0.3s ease',
      zIndex: 1030,
      overflowX: 'hidden',
      backgroundColor: '#1e40af', // Deep saturated blue
      boxShadow: '2px 0 5px rgba(0,0,0,0.1)',
      transform: isOpen ? 'translateX(0)' : `translateX(-100%)`,
      paddingTop: '0', // Remove top padding
      // Add opacity to make it fully visible on mobile
      opacity: 1,
    };



  return (
    <>
      <div className={`sidebar ${isOpen ? "open" : ""}`} style={sidebarStyle}>
        <div className="px-3">
          {!isDesktop && (
            <div
              className="d-flex justify-content-end p-2"
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                zIndex: 1050,
              }}
            >
              <button
                type="button"
                className="btn-close btn-close-white p-2"
                onClick={closeSidebarMobile}
                aria-label="Close"
                style={{
                  fontSize: "1.2rem",
                  opacity: 0.8,
                  width: "30px",
                  height: "30px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              ></button>
            </div>
          )}
          <div className="d-flex align-items-center justify-between px-4 border-bottom border-primary-subtle" style={{ borderBottomWidth: "1px" }}>
            <div className="text-center">
              <img
                src={annamalaiyarlogo}
                alt="Annamalaiyar Logo"
                style={{ width: "50%", height: "auto", filter: "brightness(0) invert(1)" }}
                className="my-3"
              />
            </div>
          </div>
          <div className="px-3 pt-3">
            <p className="text-xs text-white px-3 mb-2 text-uppercase tracking-wider" style={{ letterSpacing: "0.1em" }}>Menu</p>

            <div className="sidebar">
              <ul className="nav-menu">
                {/* New custom class */}
                {/* Dashboard - Simple Link */}
                <li className="nav-menu-item">
                  <Link
                    to="/"
                    className={`nav-menu-link ${
                      location.pathname === "/" ? "active-link" : ""
                    }`}
                    onClick={closeSidebarMobile}
                  >
                    <i className="bi bi-house me-2 sidebar-icon-white"></i>
                    <span className="sidebar-text-white">Dashboard</span>
                  </Link>
                </li>
                
                {/* Batch Management - Expandable Item */}
                <li className="nav-menu-item">
                  <div
                    className={`nav-menu-link expandable${
                      openMenu === "batch" ? "active" : ""
                    }`}
                    onClick={() => toggleMenu("batch")}
                  >
                    <i className="bi bi-file-earmark-text me-2 sidebar-icon-white"></i>
                    <span className="sidebar-text-white">Batch Management</span>
                    <i
                      className={`bi bi-chevron-right chevron-icon sidebar-icon-white${
                        openMenu === "batch" ? "rotated" : ""
                      }`}
                    ></i>
                  </div>
                  <ul
                    className={`sub-menu ${openMenu === "batch" ? "open" : ""}`}
                  >
                    <li className="sub-menu-item">
                      <Link
                        to="/production"
                        className={`nav-menu-link ${
                          location.pathname === "/production"
                            ? "active-link"
                            : ""
                        }`}
                        onClick={closeSidebarMobile}
                      >
                        <span className="sidebar-text-white">Production</span>
                      </Link>
                    </li>
                    <li className="sub-menu-item">
                      <Link
                        to="/add-batch"
                        className={`nav-menu-link ${
                          location.pathname === "/add-batch"
                            ? "active-link"
                            : ""
                        }`}
                        onClick={closeSidebarMobile}
                      >
                        <span className="sidebar-text-white">Add Batch</span>
                      </Link>
                    </li>
                    <li className="sub-menu-item">
                      <Link
                        to="/upload-batch"
                        className={`nav-menu-link ${
                          location.pathname === "/upload-batch"
                            ? "active-link"
                            : ""
                        }`}
                        onClick={closeSidebarMobile}
                      >
                        <span className="sidebar-text-white">Upload Batch</span>
                      </Link>
                    </li>
                  </ul>
                </li>
                <li>
                </li>
                <li className="nav-menu-item">
                  <Link
                    to="/egg-room-stock"
                    className={`nav-menu-link ${
                      location.pathname === "/egg-room-stock"
                        ? "active-link"
                        : ""
                    }`}
                    onClick={closeSidebarMobile}
                  >
                    <i className="bi bi-egg me-2 sidebar-icon-white"></i>
                    <span className="sidebar-text-white">Egg Room Stock</span>
                  </Link>
                </li>
                
                <li className="nav-menu-item">
                  <Link
                    to="/feed-mill-stock"
                    className={`nav-menu-link ${
                      location.pathname === "/feed-mill-stock"
                        ? "active-link"
                        : ""
                    }`}
                    onClick={closeSidebarMobile}
                  >
                    <i className="bi bi-bag me-2 sidebar-icon-white"></i>
                    <span className="sidebar-text-white">Feed Compositions</span>
                  </Link>
                </li>
                
                <li className="nav-menu-item">
                  <div
                    className={`nav-menu-link expandable ${
                      openMenu === "inventory" ? "active" : ""
                    }`}
                    onClick={() => toggleMenu("inventory")}
                  >
                    <i className="bi bi-box-seam me-2 sidebar-icon-white"></i>
                    <span className="sidebar-text-white">Inventory</span>
                    <i
                      className={`bi bi-chevron-right chevron-icon sidebar-icon-white ${
                        openMenu === "inventory" ? "rotated" : ""
                      }`}
                    ></i>
                  </div>
                  <ul
                    className={`sub-menu ${
                      openMenu === "inventory" ? "open" : ""
                    }`}
                  >
                    <li className="sub-menu-item">
                      <Link
                        to="/inventory-items"
                        className={`nav-menu-link ${
                          location.pathname === "/inventory-items"
                            ? "active-link"
                            : ""
                        }`}
                        onClick={closeSidebarMobile}
                      >
                        <span className="sidebar-text-white">Inventory Items</span>
                      </Link>
                    </li>
                    <li className="sub-menu-item">
                      <Link
                        to="/inventory-stock-level-report"
                        className={`nav-menu-link ${
                          location.pathname === "/inventory-stock-level-report"
                            ? "active-link"
                            : ""
                        }`}
                        onClick={closeSidebarMobile}
                      >
                        <span className="sidebar-text-white">Stock Levels</span>
                      </Link>
                    </li>
                    <li className="sub-menu-item">
                      <Link
                        to="/low-stock-report"
                        className={`nav-menu-link ${
                          location.pathname === "/low-stock-report"
                            ? "active-link"
                            : ""
                        }`}
                        onClick={closeSidebarMobile}
                      >
                        <span className="sidebar-text-white">Low Stock Report</span>
                      </Link>
                    </li>
                    <li className="sub-menu-item">
                      <Link
                        to="/top-selling-items-report"
                        className={`nav-menu-link ${
                          location.pathname === "/top-selling-items-report"
                            ? "active-link"
                            : ""
                        }`}
                        onClick={closeSidebarMobile}
                      >
                        <span className="sidebar-text-white">Top Selling Items Report</span>
                      </Link>
                    </li>
                  </ul>
                </li>
                
                <li className="nav-menu-item">
                  <Link
                    to="/purchase-orders"
                    className={`nav-menu-link ${
                      location.pathname.startsWith("/purchase-orders")
                        ? "active-link"
                        : ""
                    }`}
                    onClick={closeSidebarMobile}
                  >
                    <i className="bi bi-cart4 me-2 sidebar-icon-white"></i>
                    <span className="sidebar-text-white">Purchase</span>
                  </Link>
                </li>
                
                <li className="nav-menu-item">
                  <Link
                    to="/sales-orders"
                    className={`nav-menu-link ${
                      location.pathname.startsWith("/sales-orders")
                        ? "active-link"
                        : ""
                    }`}
                    onClick={closeSidebarMobile}
                  >
                    <i className="bi bi-receipt me-2 sidebar-icon-white"></i>
                    <span className="sidebar-text-white">Sales</span>
                  </Link>
                </li>
                
                <li className="nav-menu-item">
                  <Link
                    to="/business-partners"
                    className={`nav-menu-link ${
                      location.pathname === "/business-partners"
                        ? "active-link"
                        : ""
                    }`}
                    onClick={closeSidebarMobile}
                  >
                    <i className="bi bi-people me-2 sidebar-icon-white"></i>
                    <span className="sidebar-text-white">People</span>
                  </Link>
                </li>
                
                {/* Shed Management - Expandable Item */}
                <li className="nav-menu-item">
                  <div
                    className={`nav-menu-link expandable ${
                      openMenu === "shed" ? "active" : ""
                    }`}
                    onClick={() => toggleMenu("shed")}
                  >
                    <i className="bi bi-house-door me-2 sidebar-icon-white"></i>
                    <span className="sidebar-text-white">Shed Management</span>
                    <i
                      className={`bi bi-chevron-right chevron-icon sidebar-icon-white ${
                        openMenu === "shed" ? "rotated" : ""
                      }`}
                    ></i>
                  </div>
                  <ul
                    className={`sub-menu ${openMenu === "shed" ? "open" : ""}`}
                  >
                    <li className="sub-menu-item">
                      <Link
                        to="/sheds"
                        className={`nav-menu-link ${
                          location.pathname === "/sheds" ? "active-link" : ""
                        }`}
                        onClick={closeSidebarMobile}
                      >
                        <span className="sidebar-text-white">Sheds</span>
                      </Link>
                    </li>
                    <li className="sub-menu-item">
                      <Link
                        to="/swap-sheds"
                        className={`nav-menu-link ${
                          location.pathname === "/swap-sheds"
                            ? "active-link"
                            : ""
                        }`}
                        onClick={closeSidebarMobile}
                      >
                        <span className="sidebar-text-white">Swap Sheds</span>
                      </Link>
                    </li>
                  </ul>
                </li>
                
                {/* Finance - Expandable Item */}
                <li className="nav-menu-item">
                  <div
                    className={`nav-menu-link expandable ${
                      openMenu === "finance" ? "active" : ""
                    }`}
                    onClick={() => toggleMenu("finance")}
                  >
                    <i className="bi bi-cash-coin me-2 sidebar-icon-white"></i>
                    <span className="sidebar-text-white">Finance</span>
                    <i
                      className={`bi bi-chevron-right chevron-icon sidebar-icon-white ${
                        openMenu === "finance" ? "rotated" : ""
                      }`}
                    ></i>
                  </div>
                  <ul
                    className={`sub-menu ${
                      openMenu === "finance" ? "open" : ""
                    }`}
                  >
                    <li className="sub-menu-item">
                      <Link
                        to="/financial-reports"
                        className={`nav-menu-link ${
                          location.pathname === "/financial-reports"
                            ? "active-link"
                            : ""
                        }`}
                        onClick={closeSidebarMobile}
                      >
                        <span className="sidebar-text-white">Financial Reports</span>
                      </Link>
                    </li>
                    <li className="sub-menu-item">
                      <Link
                        to="/operational-expenses"
                        className={`nav-menu-link ${
                          location.pathname === "/operational-expenses"
                            ? "active-link"
                            : ""
                        }`}
                        onClick={closeSidebarMobile}
                      >
                        <span className="sidebar-text-white">Operational Expenses</span>
                      </Link>
                    </li>
                  </ul>
                </li>
                {/* Configurations - Simple Link */}
                {userGroups.includes("admin") && (
                  <li className="nav-menu-item">
                    <Link
                      to="/configurations"
                      className={`nav-menu-link ${
                        location.pathname === "/configurations"
                          ? "active-link"
                          : ""
                      }`}
                      onClick={closeSidebarMobile}
                    >
                      <i className="bi bi-gear me-2 sidebar-icon-white"></i>
                      <span className="sidebar-text-white">Configurations</span>
                    </Link>
                  </li>
                )}
                
              </ul>
              {/* </ul> */}
            </div>
          </div>
        </div>
      </div>

      {/* Add a subtle overlay when sidebar is open on mobile */}
      {!isDesktop && isOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.1)",
            zIndex: 1020,
          }}
          onClick={closeSidebarMobile}
        />
      )}
    </>
  );
};

export default Slidebar;