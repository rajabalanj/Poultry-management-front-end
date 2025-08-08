import React from 'react';

interface SubValue {
  label: string;
  value: number;
  subValue?: number;
}

interface HeaderCardProps {
  title: string;
  mainValue: number;
  subValues?: SubValue[];
  icon?: string;
  iconColor?: string; // Optional prop for icon color
}

const HeaderCard: React.FC<HeaderCardProps> = ({ title, mainValue, subValues, icon, iconColor }) => {
  return (
    <div className="card h-100 shadow-sm">
      <div className="card-body p-2 p-sm-3">
        <div className="d-flex align-items-center mb-1 mb-sm-2">
          {icon && <i className={`bi ${icon} me-1 me-sm-2 icon-sm ${iconColor ? iconColor : ''}`}></i>}
          <h6 className="card-title mb-0 fw-bold text-sm">{title}</h6>
        </div>
        
        <div className="fw-bold mb-1 mb-sm-2 text-md">
          {(mainValue ?? 0).toLocaleString()}
        </div>
        
        {subValues && subValues.length > 0 && (
          <div 
            className="text-sm"
            style={subValues.length > 3 ? { maxHeight: '80px', overflowY: 'auto' } : {}}
          >
            {subValues.map((sub, index) => (
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
          </div>
        )}
      </div>
    </div>
  );
};

export default HeaderCard; 