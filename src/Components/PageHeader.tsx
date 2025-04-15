import React from "react";
import '../styles/global.css';

interface PageHeaderProps {
  title: string;
  buttonLabel: string;
  onButtonClick: () => void;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, buttonLabel, onButtonClick }) => {
  return (
    <div className="d-flex justify-content-between align-items-center mb-4" style={{ marginLeft: '60px' }}>
      <h3 className="mb-0 text-md">{title}</h3>
      <button className="btn btn-primary text-xs" onClick={onButtonClick}>
        {buttonLabel}
      </button>
    </div>
  );
};

export default PageHeader;
    