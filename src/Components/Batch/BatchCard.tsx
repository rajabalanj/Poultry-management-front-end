import React from "react";
import { BatchResponse } from "../../types/batch";
import { useNavigate } from "react-router-dom";

interface BatchCardProps {
  batch: BatchResponse;
}

const BatchCard: React.FC<BatchCardProps> = React.memo(({ batch }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/batch/${batch.id}/view-simple`);
  };

  const cardStyle: React.CSSProperties = {
    cursor: 'pointer',
    borderRadius: '8px',
    transition: 'transform 0.2s',
  };

  return (
    <div
      className="card mb-3 shadow-sm"
      style={cardStyle}
      onClick={handleCardClick}
      onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
      onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0px)'}
    >
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h6 className="mb-1">
              {batch.batch_no}
              {batch.is_active === false && <span className="ms-2 badge bg-danger">Closed</span>}
            </h6>
            <div className="text-sm">
              <p className="mb-0">Shed: {batch.current_shed?.shed_no || batch.shed_no || 'No Shed'}</p>
              <p className="mb-0">Age: {batch.age}</p>
              <p className="mb-0">Opening: {batch.opening_count}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default BatchCard;