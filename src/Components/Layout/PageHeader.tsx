import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import "bootstrap-icons/font/bootstrap-icons.css";

interface PageHeaderProps {
  title?: string;
  buttonLabel?: string;
  subtitle?: string;
  buttonLink?: string;
  buttonVariant?: 'secondary' | 'primary';
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  buttonLabel,
  buttonLink,
  buttonVariant = 'secondary',
}) => {
  const navigate = useNavigate();
  const auth = useAuth();
  const [showLogout, setShowLogout] = useState(false);

  return (
    <div className="page-header d-flex justify-content-between align-items-center px-4 py-3 text-primary fw-bold shadow-sm border-bottom bg-light mb-4">
      <div>
        {title && <h4 className="mb-1 fw-semibold ms-4 mt-1 h4">{title}</h4>} {/* Date */}
        {subtitle && <h4 className="mb-0 ms-4">{subtitle}</h4>}       {/* Batch Info */}
      </div>

      <div className="d-flex align-items-center">
        {buttonLabel && (
          <button
            className={`btn btn-${buttonVariant} btn-sm d-flex align-items-center justify-content-center text-sm me-3`}
            onClick={() => (buttonLink ? navigate(buttonLink) : navigate(-1))}
          >
            {buttonLabel}
          </button>
        )}

        {auth.isAuthenticated ? (
          <div className="position-relative">
            <div className="d-flex align-items-center" onClick={() => setShowLogout(!showLogout)} style={{ cursor: 'pointer' }}>
              <i className="bi bi-person-circle fs-4"></i>
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
  );
};

export default PageHeader;
