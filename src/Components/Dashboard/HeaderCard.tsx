import React from 'react';
import { Button } from 'react-bootstrap';

interface SubValue {
  label: string;
  value: number;
  // subValue can be a number (secondary numeric value) or a string (extra info like a list)
  subValue?: number | string;
}

interface HeaderCardProps {
  title: string;
  mainValue: number;
  subValues?: SubValue[];
  icon?: string;
  iconColor?: string; // Optional prop for icon color
  onViewDetails?: (title: string, items: string[]) => void; // New prop for modal
}

const HeaderCard: React.FC<HeaderCardProps> = ({ title, mainValue, subValues, icon, iconColor, onViewDetails }) => {
  const handleViewDetailsClick = () => {
    if (onViewDetails && subValues) {
      const itemsToDisplay = subValues.map(sub => {
        const main = `${sub.label}: ${sub.value.toLocaleString()}`;
        if (sub.subValue !== undefined && sub.subValue !== null) {
          if (typeof sub.subValue === 'number') {
            return `${main} (${sub.subValue.toLocaleString()})`;
          }
          // string or other
          return `${main} (${String(sub.subValue)})`;
        }
        return main;
      });
      onViewDetails(title, itemsToDisplay);
    }
  };

  return (
    <div className="card h-100 shadow-sm">
      <div className="card-body p-2 p-sm-3">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <div className="d-flex align-items-center">
            {icon && <i className={`bi ${icon} me-2 icon-sm ${iconColor ? iconColor : ''}`}></i>}
            <h6 className="card-title mb-0 fw-bold">{title}</h6>
          </div>
          <div className="fw-semibold">
            {(mainValue ?? 0).toLocaleString()}
          </div>
        </div>
        
        {subValues && subValues.length > 0 && (
          <div>
            {subValues.slice(0, 3).map((sub, index) => (
              <div key={index} className="d-flex justify-content-between mb-1 border-bottom pb-1">
                <span className="text-nowrap text-muted">{sub.label}</span>
                <div className="ms-1 ms-sm-2">
                  <span className="fw-bold">{sub.value.toLocaleString()}</span>
                  {sub.subValue && (
                    <span className="ms-1 ms-sm-2">({sub.subValue.toLocaleString()})</span>
                  )}
                </div>
              </div>
            ))}
            {subValues.length > 3 && (
              <div className="text-end mt-2">
                <Button variant="link" size="sm" onClick={handleViewDetailsClick}>
                  View All ({subValues.length})
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HeaderCard; 