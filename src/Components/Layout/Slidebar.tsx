import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.min.css";
import "./Sidebar.css"; // Import custom sidebar styles
import { useAuth } from "../../hooks/useAuth";
import { useSidebar } from "../../hooks/useSidebar";
import annamalaiyarlogo from "../../styles/annamalaiyarlogo.png"; // Import the image
import { getTenantId, tenantFeatureApi } from "../../services/api";
import { useShortcuts } from "../../Components/context/KeyboardShortcutContext";

// Using Bootstrap's lg breakpoint (≥992px) instead of hardcoded value

interface SlidebarProps {
  onToggle?: () => void;
}

const Slidebar: React.FC<SlidebarProps> = ({ onToggle }) => {
  const { user } = useAuth();
  const groups = user?.profile?.['cognito:groups'];
  const userGroups: string[] = Array.isArray(groups) ? groups : [];
  const organization = user?.profile?.['custom:organization'];
  const { isOpen, toggle, isDesktop } = useSidebar();
  const location = useLocation();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const { registerShortcuts } = useShortcuts();

  // Check if current tenant is restricted from seeing Batch and Shed modules
  const currentTenantId = getTenantId() || "";
  const [isBatchRestricted, setIsBatchRestricted] = useState(false);
  const [checkingRestriction, setCheckingRestriction] = useState(true);

  useEffect(() => {
    const fetchRestrictions = async () => {
      if (currentTenantId) {
        try {
          const features = await tenantFeatureApi.getTenantFeaturesByTenantId(currentTenantId);
          const restricted = features.some(f => f.feature_name === 'BATCH_MANAGEMENT' && f.is_restricted);
          setIsBatchRestricted(restricted);
        } catch (error) {
          console.error("Failed to check batch restriction:", error);
        } finally {
          setCheckingRestriction(false);
        }
      } else {
        setCheckingRestriction(false);
      }
    };
    fetchRestrictions();
  }, [currentTenantId]);


  // State to manage which sub-menu is open
  const [openMenu, setOpenMenu] = useState<string | null>(null); // 'batch', 'egg', 'feed', 'finance', 'purchase', 'sales' etc.

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
      location.pathname.startsWith("/inventory-items/stock-level-report") ||
      location.pathname.startsWith("/inventory-items/low-stock-report") ||
      location.pathname.startsWith("/inventory-items/top-selling-items-report")
    ) {
      setOpenMenu("inventory");
    } else if (
      location.pathname.startsWith("/financial-reports") ||
      location.pathname.startsWith("/operational-expenses") ||
      location.pathname.startsWith("/chart-of-accounts") ||
      location.pathname.startsWith("/journal-entries")
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
    } else if (
      location.pathname.startsWith("/purchase")
    ) {
      setOpenMenu("purchase");
    } else if (
      location.pathname.startsWith("/sales")
    ) {
      setOpenMenu("sales");
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

  const focusActiveItem = useCallback(() => {
    // Find the currently visible sidebar content (desktop vs mobile wrapper)
    const contents = Array.from(document.querySelectorAll('.sidebar-content')) as HTMLElement[];
    const visibleContent = contents.find(el => el.getBoundingClientRect().width > 0);
    if (!visibleContent) return;

    const activeEl = visibleContent.querySelector('.active-link, .expandable.active') as HTMLElement;
    if (activeEl) {
      activeEl.focus();
    } else {
      const firstEl = visibleContent.querySelector('.nav-menu-link') as HTMLElement;
      firstEl?.focus();
    }
  }, []);

  const shortcutStateRef = useRef({ isDesktop, isOpen, toggle });
  useLayoutEffect(() => {
    shortcutStateRef.current = { isDesktop, isOpen, toggle };
  }, [isDesktop, isOpen, toggle]);

  const exitSidebarFocus = useCallback(() => {
    const activeEl = document.activeElement as HTMLElement;
    activeEl?.blur();

    const state = shortcutStateRef.current;
    if (!state.isDesktop && state.isOpen) {
      state.toggle();
    }

    // Move focus to main content (page header) to resume normal tabbing seamlessly
    const mainContent = (document.querySelector('.page-header') || document.body) as HTMLElement;
    if (mainContent !== document.body) {
      mainContent.setAttribute('tabindex', '-1');
      mainContent.style.outline = 'none'; // Prevent ugly focus ring on the header wrapper itself
    }
    mainContent.focus();
  }, []);

  // Register global shortcut to focus sidebar
  useEffect(() => {
    const unregister = registerShortcuts([
      {
        key: 'Alt+m',
        description: 'Toggle Sidebar Focus',
        category: 'Navigation',
        action: (e) => {
          e.preventDefault();

          const contents = Array.from(document.querySelectorAll('.sidebar-content')) as HTMLElement[];
          const visibleContent = contents.find(el => el.getBoundingClientRect().width > 0);
          const activeEl = document.activeElement as HTMLElement;

          // If we are already focused inside the sidebar, act as a toggle to exit
          if (visibleContent?.contains(activeEl)) {
            exitSidebarFocus();
          } else {
            const state = shortcutStateRef.current;
            if (!state.isDesktop && !state.isOpen) {
              state.toggle();
              setTimeout(() => focusActiveItem(), 300);
            } else {
              focusActiveItem();
            }
          }
        }
      }
    ]);
    return unregister;
  }, [registerShortcuts, focusActiveItem, exitSidebarFocus]);

  // Local keyboard navigation within Sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement;
      if (!sidebarRef.current?.contains(activeEl)) return;

      if (['ArrowDown', 'ArrowUp', 'Enter', 'Escape'].includes(e.key)) {
        e.preventDefault();
        e.stopImmediatePropagation(); // Prevent table hooks or page shortcuts from firing

        if (e.key === 'Escape') {
          exitSidebarFocus();
          return;
        }
        if (e.key === 'Enter') {
          activeEl.click();
          return;
        }

        const allLinks = Array.from(sidebarRef.current.querySelectorAll('.nav-menu-link')) as HTMLElement[];
        const visibleLinks = allLinks.filter(link => !link.closest('.sub-menu') || link.closest('.sub-menu')?.classList.contains('open'));

        const currentIndex = visibleLinks.indexOf(activeEl);
        let nextIndex = e.key === 'ArrowDown' ? currentIndex + 1 : currentIndex - 1;
        if (nextIndex >= visibleLinks.length) nextIndex = 0;
        if (nextIndex < 0) nextIndex = visibleLinks.length - 1;

        visibleLinks[nextIndex]?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true); // use capture
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [exitSidebarFocus]);

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
      boxShadow: '2px 0 5px rgba(0,0,0,0.1)',
      transform: isOpen ? 'translateX(0)' : `translateX(-100%)`,
      paddingTop: '0', // Remove top padding
      // Add opacity to make it fully visible on mobile
      opacity: 1,
    };



  return (
    <>
      <div className={`sidebar pt-2 pt-xl-0 ${isOpen ? "open" : ""}`} style={sidebarStyle} ref={sidebarRef}>
        <div>
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
                className="btn-close p-2"
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
              {organization === 'AnnamalaiyarAgro' ? (
                <img
                  src={annamalaiyarlogo}
                  alt="Annamalaiyar Logo"
                  style={{ width: "50%", height: "auto" }}
                  className="my-3"
                />
              ) : (
                <h3 className="my-3 text-primary">Poultrix</h3>
              )}
            </div>
          </div>
          <div className="px-2 pt-2">
            <p className="text-xs text-dark px-3 mb-2 text-uppercase tracking-wider">Menu</p>

            <div className="sidebar-content">
              <ul className="nav-menu">
                {/* New custom class */}
                {/* Dashboard - Simple Link */}
                <li className="nav-menu-item">
                  <Link
                    to="/"
                    className={`nav-menu-link ${location.pathname === "/" ? "active-link" : ""
                      }`}
                    onClick={closeSidebarMobile}
                  >
                    <i className="bi bi-house me-2 sidebar-icon"></i>
                    <span className="sidebar-text">Dashboard</span>
                  </Link>
                </li>

                {/* Batch Management - Expandable Item */}
                {!checkingRestriction && !isBatchRestricted && (
                  <li className="nav-menu-item">
                    <div
                      className={`nav-menu-link expandable ${openMenu === "batch" ? "active" : ""
                        }`}
                      onClick={() => toggleMenu("batch")}
                      tabIndex={0}
                    >
                      <i className="bi bi-file-earmark-text me-2 sidebar-icon"></i>
                      <span className="sidebar-text">Batch Management</span>
                      <i
                        className={`bi bi-chevron-right chevron-icon sidebar-icon ${openMenu === "batch" ? "rotated" : ""
                          }`}
                      ></i>
                    </div>
                    <ul
                      className={`sub-menu ${openMenu === "batch" ? "open" : ""}`}
                    >
                      <li className="sub-menu-item">
                        <Link
                          to="/production"
                          className={`nav-menu-link ${location.pathname === "/production"
                            ? "active-link"
                            : ""
                            }`}
                          onClick={closeSidebarMobile}
                        >
                          <span className="sidebar-text">Production</span>
                        </Link>
                      </li>
                      <li className="sub-menu-item">
                        <Link
                          to="/add-batch"
                          className={`nav-menu-link ${location.pathname === "/add-batch"
                            ? "active-link"
                            : ""
                            }`}
                          onClick={closeSidebarMobile}
                        >
                          <span className="sidebar-text">Add Batch</span>
                        </Link>
                      </li>
                      <li className="sub-menu-item">
                        <Link
                          to="/upload-batch"
                          className={`nav-menu-link ${location.pathname === "/upload-batch"
                            ? "active-link"
                            : ""
                            }`}
                          onClick={closeSidebarMobile}
                        >
                          <span className="sidebar-text">Upload Batch</span>
                        </Link>
                      </li>
                    </ul>
                  </li>
                )}
                {!checkingRestriction && !isBatchRestricted && (
                  <li className="nav-menu-item">
                    <Link
                      to="/egg-room-stock"
                      className={`nav-menu-link ${location.pathname === "/egg-room-stock"
                        ? "active-link"
                        : ""
                        }`}
                      onClick={closeSidebarMobile}
                    >
                      <i className="bi bi-egg me-2 sidebar-icon"></i>
                      <span className="sidebar-text">Egg Room Stock</span>
                    </Link>
                  </li>
                )}

                <li className="nav-menu-item">
                  <Link
                    to="/feed-mill-stock"
                    className={`nav-menu-link ${location.pathname === "/feed-mill-stock"
                      ? "active-link"
                      : ""
                      }`}
                    onClick={closeSidebarMobile}
                  >
                    <i className="bi bi-bag me-2 sidebar-icon"></i>
                    <span className="sidebar-text">Feed Compositions</span>
                  </Link>
                </li>

                <li className="nav-menu-item">
                  <div
                    className={`nav-menu-link expandable ${openMenu === "inventory" ? "active" : ""
                      }`}
                    onClick={() => toggleMenu("inventory")}
                    tabIndex={0}
                  >
                    <i className="bi bi-box-seam me-2 sidebar-icon"></i>
                    <span className="sidebar-text">Inventory</span>
                    <i
                      className={`bi bi-chevron-right chevron-icon sidebar-icon ${openMenu === "inventory" ? "rotated" : ""
                        }`}
                    ></i>
                  </div>
                  <ul
                    className={`sub-menu ${openMenu === "inventory" ? "open" : ""
                      }`}
                  >
                    <li className="sub-menu-item">
                      <Link
                        to="/inventory-items"
                        className={`nav-menu-link ${location.pathname === "/inventory-items"
                          ? "active-link"
                          : ""
                          }`}
                        onClick={closeSidebarMobile}
                      >
                        <span className="sidebar-text">Inventory Items</span>
                      </Link>
                    </li>
                    <li className="sub-menu-item">
                      <Link
                        to="/inventory-items/manage-sellable"
                        className={`nav-menu-link ${location.pathname === "/inventory-items/manage-sellable"
                          ? "active-link"
                          : ""
                          }`}
                        onClick={closeSidebarMobile}
                      >
                        <span className="sidebar-text">Manage Sellable</span>
                      </Link>
                    </li>
                    <li className="sub-menu-item">
                      <Link
                        to="/inventory-items/stock-level-report"
                        className={`nav-menu-link ${location.pathname === "/inventory-items/stock-level-report"
                          ? "active-link"
                          : ""
                          }`}
                        onClick={closeSidebarMobile}
                      >
                        <span className="sidebar-text">Stock Levels</span>
                      </Link>
                    </li>
                    <li className="sub-menu-item">
                      <Link
                        to="/inventory-items/low-stock-report"
                        className={`nav-menu-link ${location.pathname === "/inventory-items/low-stock-report"
                          ? "active-link"
                          : ""
                          }`}
                        onClick={closeSidebarMobile}
                      >
                        <span className="sidebar-text">Low Stock Report</span>
                      </Link>
                    </li>
                    <li className="sub-menu-item">
                      <Link
                        to="/inventory-items/top-selling-items-report"
                        className={`nav-menu-link ${location.pathname === "/inventory-items/top-selling-items-report"
                          ? "active-link"
                          : ""
                          }`}
                        onClick={closeSidebarMobile}
                      >
                        <span className="sidebar-text">Top Selling Items Report</span>
                      </Link>
                    </li>
                  </ul>
                </li>

                <li className="nav-menu-item">
                  <div
                    className={`nav-menu-link expandable ${openMenu === "purchase" ? "active" : ""}`}
                    onClick={() => toggleMenu("purchase")}
                    tabIndex={0}
                  >
                    <i className="bi bi-cart4 me-2 sidebar-icon"></i>
                    <span className="sidebar-text">Purchase</span>
                    <i
                      className={`bi bi-chevron-right chevron-icon sidebar-icon ${openMenu === "purchase" ? "rotated" : ""}`}
                    ></i>
                  </div>
                  <ul
                    className={`sub-menu ${openMenu === "purchase" ? "open" : ""}`}
                  >
                    <li className="sub-menu-item">
                      <Link
                        to="/purchase-orders/create"
                        className={`nav-menu-link ${location.pathname.startsWith("/purchase/create")
                          ? "active-link"
                          : ""
                          }`}
                        onClick={closeSidebarMobile}
                      >
                        <span className="sidebar-text">Create Purchase Order</span>
                      </Link>
                    </li>
                    <li className="sub-menu-item">
                      <Link
                        to="/purchase-orders"
                        className={`nav-menu-link ${location.pathname === "/purchase"
                          ? "active-link"
                          : ""
                          }`}
                        onClick={closeSidebarMobile}
                      >
                        <span className="sidebar-text">Purchase Report</span>
                      </Link>
                    </li>
                  </ul>
                </li>

                <li className="nav-menu-item">
                  <div
                    className={`nav-menu-link expandable ${openMenu === "sales" ? "active" : ""}`}
                    onClick={() => toggleMenu("sales")}
                    tabIndex={0}
                  >
                    <i className="bi bi-receipt me-2 sidebar-icon"></i>
                    <span className="sidebar-text">Sales</span>
                    <i
                      className={`bi bi-chevron-right chevron-icon sidebar-icon ${openMenu === "sales" ? "rotated" : ""}`}
                    ></i>
                  </div>
                  <ul
                    className={`sub-menu ${openMenu === "sales" ? "open" : ""}`}
                  >
                    <li className="sub-menu-item">
                      <Link
                        to="/sales-orders/create"
                        className={`nav-menu-link ${location.pathname.startsWith("/sales/create")
                          ? "active-link"
                          : ""
                          }`}
                        onClick={closeSidebarMobile}
                      >
                        <span className="sidebar-text">Create Sales Order</span>
                      </Link>
                    </li>
                    <li className="sub-menu-item">
                      <Link
                        to="/sales-orders"
                        className={`nav-menu-link ${location.pathname === "/sales"
                          ? "active-link"
                          : ""
                          }`}
                        onClick={closeSidebarMobile}
                      >
                        <span className="sidebar-text">Sales Report</span>
                      </Link>
                    </li>
                  </ul>
                </li>

                <li className="nav-menu-item">
                  <Link
                    to="/business-partners"
                    className={`nav-menu-link ${location.pathname === "/business-partners"
                      ? "active-link"
                      : ""
                      }`}
                    onClick={closeSidebarMobile}
                  >
                    <i className="bi bi-people me-2 sidebar-icon"></i>
                    <span className="sidebar-text">People</span>
                  </Link>
                </li>

                {/* Shed Management - Expandable Item */}
                {!checkingRestriction && !isBatchRestricted && (
                  <li className="nav-menu-item">
                    <div
                      className={`nav-menu-link expandable ${openMenu === "shed" ? "active" : ""
                        }`}
                      onClick={() => toggleMenu("shed")}
                      tabIndex={0}
                    >
                      <i className="bi bi-house-door me-2 sidebar-icon"></i>
                      <span className="sidebar-text">Shed Management</span>
                      <i
                        className={`bi bi-chevron-right chevron-icon sidebar-icon ${openMenu === "shed" ? "rotated" : ""
                          }`}
                      ></i>
                    </div>
                    <ul
                      className={`sub-menu ${openMenu === "shed" ? "open" : ""}`}
                    >
                      <li className="sub-menu-item">
                        <Link
                          to="/sheds"
                          className={`nav-menu-link ${location.pathname === "/sheds" ? "active-link" : ""
                            }`}
                          onClick={closeSidebarMobile}
                        >
                          <span className="sidebar-text">Sheds</span>
                        </Link>
                      </li>
                      <li className="sub-menu-item">
                        <Link
                          to="/swap-sheds"
                          className={`nav-menu-link ${location.pathname === "/swap-sheds"
                            ? "active-link"
                            : ""
                            }`}
                          onClick={closeSidebarMobile}
                        >
                          <span className="sidebar-text">Swap Sheds</span>
                        </Link>
                      </li>
                    </ul>
                  </li>
                )}

                {/* Finance - Expandable Item */}
                <li className="nav-menu-item">
                  <div
                    className={`nav-menu-link expandable ${openMenu === "finance" ? "active" : ""
                      }`}
                    onClick={() => toggleMenu("finance")}
                    tabIndex={0}
                  >
                    <i className="bi bi-cash-coin me-2 sidebar-icon"></i>
                    <span className="sidebar-text">Finance</span>
                    <i
                      className={`bi bi-chevron-right chevron-icon sidebar-icon ${openMenu === "finance" ? "rotated" : ""
                        }`}
                    ></i>
                  </div>
                  <ul
                    className={`sub-menu ${openMenu === "finance" ? "open" : ""
                      }`}
                  >
                    <li className="sub-menu-item">
                      <Link
                        to="/financial-reports"
                        className={`nav-menu-link ${location.pathname === "/financial-reports"
                          ? "active-link"
                          : ""
                          }`}
                        onClick={closeSidebarMobile}
                      >
                        <span className="sidebar-text">Financial Reports</span>
                      </Link>
                    </li>
                    <li className="sub-menu-item">
                      <Link
                        to="/operational-expenses"
                        className={`nav-menu-link ${location.pathname === "/operational-expenses"
                          ? "active-link"
                          : ""
                          }`}
                        onClick={closeSidebarMobile}
                      >
                        <span className="sidebar-text">Operational Expenses</span>
                      </Link>
                    </li>
                    <li className="sub-menu-item">
                      <Link
                        to="/chart-of-accounts"
                        className={`nav-menu-link ${location.pathname === "/chart-of-accounts"
                          ? "active-link"
                          : ""
                          }`}
                        onClick={closeSidebarMobile}
                      >
                        <span className="sidebar-text">Chart of Accounts</span>
                      </Link>
                    </li>
                    <li className="sub-menu-item">
                      <Link
                        to="/journal-entries"
                        className={`nav-menu-link ${location.pathname.startsWith("/journal-entries")
                          ? "active-link"
                          : ""
                          }`}
                        onClick={closeSidebarMobile}
                      >
                        <span className="sidebar-text">Journal Entries</span>
                      </Link>
                    </li>
                  </ul>
                </li>
                {/* Configurations - Simple Link */}
                {userGroups.includes("admin") && (
                  <li className="nav-menu-item">
                    <Link
                      to="/configurations"
                      className={`nav-menu-link ${location.pathname === "/configurations"
                        ? "active-link"
                        : ""
                        }`}
                      onClick={closeSidebarMobile}
                    >
                      <i className="bi bi-gear me-2 sidebar-icon"></i>
                      <span className="sidebar-text">Configurations</span>
                    </Link>
                  </li>
                )}
                {/* Admin - Simple Link */}
                {userGroups.includes("admin") && (
                  <li className="nav-menu-item">
                    <Link
                      to="/admin"
                      className={`nav-menu-link ${location.pathname === "/admin" ? "active-link" : ""
                        }`}
                      onClick={closeSidebarMobile}
                    >
                      <i className="bi bi-shield-lock me-2 sidebar-icon"></i>
                      <span className="sidebar-text">Admin</span>
                    </Link>
                  </li>
                )}

                {/* Super Admin Subscriptions - Simple Link */}
                {userGroups.includes("super_admin") && (
                  <li className="nav-menu-item">
                    <Link
                      to="/super-admin/subscriptions"
                      className={`nav-menu-link ${location.pathname === "/super-admin/subscriptions"
                        ? "active-link"
                        : ""
                        }`}
                      onClick={closeSidebarMobile}
                    >
                      <i className="bi bi-globe me-2 sidebar-icon"></i>
                      <span className="sidebar-text">Super Admin</span>
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