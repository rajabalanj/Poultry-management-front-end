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

  return (
    <div
      className="card mb-2 mt-2 border-top-0 border-end-0 border-start-0 border-bottom"
      style={{ cursor: 'pointer', borderRadius: 0 }}
      onClick={handleCardClick}
      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
    >
      <div className="card-body p-2">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h6 className="mb-1">
              {batch.batch_no}
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