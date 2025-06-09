import React from "react";
import { useNavigate } from "react-router-dom";

interface PageHeaderProps {
  title?: string;
  buttonLabel?: string;
  subtitle?: string;
  buttonLink?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  buttonLabel,
  buttonLink
}) => {
  const navigate = useNavigate();

  return (
    <div className="page-header d-flex justify-content-between align-items-center px-4 py-3">
      <div>
        {title && <h4 className="mb-1 text-bold ms-4 mt-1">{title}</h4>} {/* Date */}
        {subtitle && <h4 className="mb-0 ms-4">{subtitle}</h4>}       {/* Batch Info */}
      </div>

      {buttonLabel && buttonLink && (
        <button 
          className="btn btn-primary" 
          onClick={() => navigate(buttonLink)}
        >
          {buttonLabel}
        </button>
      )}
    </div>
  );
};

export default PageHeader;
