import React, { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.css";
import { BatchResponse } from "../types/batch";

const BatchConfigCard: React.FC<{
  batch: BatchResponse;
  onView: (batch_id: number) => void;
  onEdit: (batch_id: number) => void;
}> = React.memo(({ batch, onView, onEdit }) => (
  <div className="card mb-2 border shadow-sm">
    <div className="card-body p-2">
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <h6 className="mb-1 text-sm">Batch {batch.batch_no}</h6>
          <div className="text-muted text-xs">
            <span className="me-2">Shed: {batch.shed_no}</span>
            <span>Age: {batch.age}</span>
          </div>
        </div>
        <div className="d-flex flex-column flex-md-row gap-2">
          <button
            className="btn btn-outline-primary btn-sm d-flex align-items-center justify-content-center"
            onClick={() => onView(batch.id)}
            title="View Details"
            aria-label={`View Details for Batch ${batch.batch_no}`}
          >
            <i className="bi bi-eye me-1"></i>
            <span className="text-muted text-xs">View</span>
          </button>
          <button
            className="btn btn-outline-warning btn-sm d-flex align-items-center justify-content-center"
            onClick={() => onEdit(batch.id)}
            title="Edit Batch"
            aria-label={`Edit Batch ${batch.batch_no}`}
          >
            <i className="bi bi-pencil me-1"></i>
            <span className="text-muted text-xs">Edit</span>
          </button>
        </div>
      </div>
    </div>
  </div>
));

interface BatchConfigTableProps {
  batches: BatchResponse[];
  loading: boolean;
  error: string | null;
}

const BatchConfig: React.FC<BatchConfigTableProps> = ({ batches, loading, error }) => {
  const navigate = useNavigate();

  const handleView = useCallback(
    (batch_id: number) => {
      if (!batch_id) {
        console.error("Batch ID is required");
        return;
      }
      navigate(`/batch/${batch_id}/view-simple`);
    },
    [navigate]
  );

  const handleEdit = useCallback(
    (batch_id: number) => {
      if (!batch_id) {
        console.error("Batch ID is required");
        return;
      }
      navigate(`/batch/${batch_id}/edit-simple`);
    },
    [navigate]
  );

  const batchCards = useMemo(() => {
    return batches
      .filter(batch => batch.id != null)
      .map((batch) => (
        <BatchConfigCard
          key={batch.id}
          batch={batch}
          onView={handleView}
          onEdit={handleEdit}
        />
      ));
  }, [batches, handleView, handleEdit]);

  if (loading) return <div className="text-center">Loading...</div>;
  if (error) return <div className="text-center text-danger">{error}</div>;
  if (batches.length === 0) return <div className="text-center">No batches found</div>;

  return <div className="px-2">{batchCards}</div>;
};

export default BatchConfig;
