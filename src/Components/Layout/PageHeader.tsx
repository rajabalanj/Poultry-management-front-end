import React from "react";
import { useNavigate } from "react-router-dom";

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

  return (
    <div className="page-header d-flex justify-content-between align-items-center px-4 py-3 text-primary fw-bold">
      <div>
        {title && <h4 className="mb-1 fw-semibold ms-4 mt-1 h4">{title}</h4>} {/* Date */}
        {subtitle && <h4 className="mb-0 ms-4">{subtitle}</h4>}       {/* Batch Info */}
      </div>

      {buttonLabel && (
        <button
          className={`btn btn-${buttonVariant} btn-sm d-flex align-items-center justify-content-center text-sm`}
          onClick={() => (buttonLink ? navigate(buttonLink) : navigate(-1))}
        >
          {buttonLabel}
        </button>
      )}
    </div>
  );
};

export default PageHeader;
