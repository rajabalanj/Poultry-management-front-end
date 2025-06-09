import React, { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.css";
import { BatchResponse } from "../types/batch"; // Adjust the import path as necessary

const BatchCard: React.FC<{
  batch: BatchResponse;
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onEditSimple: (id: number) => void;
}> = React.memo(({ batch, onView, onEdit, onEditSimple }) => (
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
            <span className="text-muted text-xs">Batch Overview</span>
          </button>
          <button
            className="btn btn-outline-success btn-sm d-flex align-items-center justify-content-center"
            onClick={() => onEdit(batch.id)}
            title="Record Daily Data"
            aria-label={`Record Daily Data for Batch ${batch.batch_no}`}
          >
            <i className="bi bi-pencil-square me-1"></i>
            <span className="text-muted text-xs">Record Daily Data</span>
          </button>
          <button
            className="btn btn-outline-warning btn-sm d-flex align-items-center justify-content-center"
            onClick={() => onEditSimple(batch.id)}
            title="Edit Batch Details"
            aria-label={`Edit Batch Details Info for Batch ${batch.batch_no}`}
          >
            <i className="bi bi-pencil me-1"></i>
            <span className="text-muted text-xs">Edit Batch Details</span>
          </button>
        </div>
      </div>
    </div>
  </div>
));

interface BatchTableProps {
  batches: BatchResponse[];
  loading: boolean;
  error: string | null;
}

const BatchTable: React.FC<BatchTableProps> = ({ batches, loading, error }) => {
  const navigate = useNavigate();

  const handleViewDetails = useCallback(
    (id: number) => {
      if (!id) {
        console.error("Batch ID is required");
        return;
      }
      navigate(`/batch/${id}/details`);
    },
    [navigate]
  );

  const handleEdit = useCallback(
    (id: number) => {
      if (!id) {
        console.error("Batch ID is required");
        return;
      }
      navigate(`/batch/${id}/edit`);
    },
    [navigate]
  );

  const handleEditSimple = useCallback(
    (id: number) => {
      if (!id) {
        console.error("Batch ID is required");
        return;
      }
      navigate(`/batch/${id}/edit-simple`);
    },
    [navigate]
  );

  const batchCards = useMemo(() => {
    return batches.map((batch) => (
      <BatchCard
        key={batch.id}
        batch={batch}
        onView={handleViewDetails}
        onEdit={handleEdit}
        onEditSimple={handleEditSimple}
      />
    ));
  }, [batches, handleViewDetails, handleEdit, handleEditSimple]);

  if (loading) return <div className="text-center">Loading...</div>;
  if (error) return <div className="text-center text-danger">{error}</div>;
  if (batches.length === 0) return <div className="text-center">No batches found</div>;

  return <div className="px-2">{batchCards}</div>;
};

export default BatchTable;