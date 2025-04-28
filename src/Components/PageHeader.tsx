import React from "react";
import { useNavigate } from 'react-router-dom';
import '../styles/global.css';

interface PageHeaderProps {
  title: string;
  buttonLabel?: string;
  buttonLink?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, buttonLabel, buttonLink }) => {
  const navigate = useNavigate();

  return (
    <div className="page-header d-flex justify-content-between align-items-center p-4">
      <h3 className="mb-0 page-header-title">{title}</h3>
      
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
