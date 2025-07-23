import React from "react";
import { useNavigate } from "react-router-dom";

interface PageHeaderProps {
  title?: string;
  buttonLabel?: string;
  subtitle?: string;
  buttonLink?: string;
  buttonVariant?: 'secondary' | 'success';
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
    <div className="page-header d-flex justify-content-between align-items-center px-4 py-3 text-primary bg-light-subtle">
      <div>
        {title && <h4 className="mb-1 text-bold ms-4 mt-1" style={{ textShadow: '1px 1px 3px rgba(0, 0, 0, 0.1)' }}>{title}</h4>} {/* Date */}
        {subtitle && <h4 className="mb-0 ms-4" style={{ textShadow: '1px 1px 3px rgba(0, 0, 0, 0.1)' }}>{subtitle}</h4>}       {/* Batch Info */}
      </div>

      {buttonLabel && buttonLink && (
        <button 
          className={`btn btn-${buttonVariant} btn-sm d-flex align-items-center justify-content-center`}
          onClick={() => navigate(buttonLink)}
        >
          {buttonLabel}
        </button>
      )}
    </div>
  );
};

export default PageHeader;
