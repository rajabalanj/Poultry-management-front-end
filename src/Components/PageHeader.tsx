import React from "react";

interface PageHeaderProps {
  title: string;
  buttonLabel: string;
  onButtonClick: () => void;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, buttonLabel, onButtonClick }) => {
  return (
    <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <h3 className="mb-0">{title}</h3>
      <button className="btn btn-primary" onClick={onButtonClick}>
        {buttonLabel}
      </button>
    </div>
  );
};

export default PageHeader;
    