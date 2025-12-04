import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useMediaQuery } from 'react-responsive';
import { useSidebar } from '../../hooks/useSidebar';
import "bootstrap-icons/font/bootstrap-icons.css";

interface PageHeaderProps {
  title?: string;
  buttonLabel?: string;
  subtitle?: string;
  buttonLink?: string;
  buttonVariant?: 'secondary' | 'primary';
  onToggleSidebar?: () => void;
  buttonIcon?: string; // Bootstrap icon class name (e.g., "bi-arrow-left", "bi-plus")
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  buttonLabel,
  buttonLink,
  buttonVariant = 'secondary',
  onToggleSidebar,
  buttonIcon,
}) => {
  const navigate = useNavigate();
  const auth = useAuth();
  const [showLogout, setShowLogout] = useState(false);
  const isDesktop = useMediaQuery({ minWidth: 992 });
  const sidebar = useSidebar();

  // Prefer prop `onToggleSidebar` when provided, otherwise use sidebar hook
  const toggleSidebar = onToggleSidebar ?? sidebar.toggle;

  return (
    <div className="page-header p-md-3 py-3 text-primary fw-bold shadow-sm border-bottom mb-4">
      <div className="d-flex justify-content-between align-items-center w-100">
        <div className="d-flex align-items-center">
          {!isDesktop && toggleSidebar && (
            <button
              className="btn btn-light me-3 d-flex align-items-center justify-content-center"
              onClick={toggleSidebar}
              style={{ 
                width: '40px',
                height: '40px',
              }}
              aria-label="Toggle sidebar"
            >
              <i className="bi bi-list text-primary" style={{ fontSize: "1.5rem" }}></i>
            </button>
          )}
          <div>
            {title && <h4 className="mb-1 fw-semibold mt-1 h4">{title}</h4>}
            {subtitle && <h4 className="mb-0">{subtitle}</h4>}
          </div>
        </div>

        <div className="d-flex align-items-center">
          {buttonLabel && (
            <button
              className={`btn btn-${buttonVariant} btn-sm d-flex align-items-center justify-content-center text-sm me-3`}
              onClick={() => (buttonLink ? navigate(buttonLink) : navigate(-1))}
              style={{ minWidth: isDesktop ? 'auto' : '32px', height: isDesktop ? 'auto' : '32px', padding: isDesktop ? '' : '0' }}
              aria-label={buttonLabel}
            >
              {buttonIcon && <i className={`bi ${buttonIcon} ${isDesktop ? 'me-2' : ''}`} style={{ fontSize: isDesktop ? '1rem' : '1.25rem' }}></i>}
              {isDesktop && buttonLabel}
            </button>
          )}

          {auth.isAuthenticated ? (
            <div className="position-relative">
              <div className="d-flex align-items-center" onClick={() => setShowLogout(!showLogout)} style={{ cursor: 'pointer' }}>
                <i className="bi bi-person-circle" style={{ fontSize: '2rem' }}></i>
              </div>
              {showLogout && (
                <div className="position-absolute bg-white shadow-sm rounded p-2" style={{ top: '100%', right: 0, zIndex: 1000 }}>
                  <div className="text-center mb-2">{auth.user?.profile?.name || auth.user?.profile?.email}</div>
                  <button className="btn btn-link text-danger w-100" onClick={() => auth.logout()}>Logout</button>
                </div>
              )}
            </div>
          ) : (
            <button className="btn btn-primary" onClick={() => auth.login()}>
              Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

PageHeader.displayName = 'PageHeader';

export default PageHeader;
