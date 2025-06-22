import React, { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.css";
import { DailyBatch } from "../types/daily_batch";

const BatchCard: React.FC<{
  batch: DailyBatch;
  onView: (batch_id: number, batchDate: string) => void;
  onEdit: (batch_id: number, batchDate: string) => void;
  onEditSimple: (batch_id: number) => void;
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
            onClick={() => onView(batch.batch_id, batch.batch_date)}
            title="View Details"
            aria-label={`View Details for Batch ${batch.batch_no}`}
          >
            <i className="bi bi-eye me-1"></i>
            <span className="text-muted text-xs">Batch Overview</span>
          </button>
          <button
            className="btn btn-outline-success btn-sm d-flex align-items-center justify-content-center"
            onClick={() => onEdit(batch.batch_id, batch.batch_date)}
            title="Record Daily Data"
            aria-label={`Record Daily Data for Batch ${batch.batch_no}`}
          >
            <i className="bi bi-journal-text me-1"></i>
            <span className="text-muted text-xs">Record Daily Data</span>
          </button>
          {/* <button
            className="btn btn-outline-warning btn-sm d-flex align-items-center justify-content-center"
            onClick={() => onEditSimple(batch.batch_id)}
            title="Edit Batch Details"
            aria-label={`Edit Batch Details Info for Batch ${batch.batch_no}`}
          >
            <i className="bi bi-pencil me-1"></i>
            <span className="text-muted text-xs">Edit Batch Details</span>
          </button> */}
        </div>
      </div>
    </div>
  </div>
));

interface BatchTableProps {
  batches: DailyBatch[];
  loading: boolean;
  error: string | null;
}

const BatchTable: React.FC<BatchTableProps> = ({ batches, loading, error }) => {
  const navigate = useNavigate();

  const handleViewDetails = useCallback(
    (batch_id: number, batchDate: string) => {
      if (!batch_id || !batchDate) {
        console.error("Batch ID and Batch Date are required");
        return;
      }
      navigate(`/batch/${batch_id}/${batchDate}/details`);
    },
    [navigate]
  );

  const handleEdit = useCallback(
    (batch_id: number, batchDate: string) => {
      if (!batch_id || !batchDate) {
        console.error("Batch ID and Batch Date are required");
        return;
      }
      navigate(`/batch/${batch_id}/${batchDate}/edit`);
    },
    [navigate]
  );

  const handleEditSimple = useCallback(
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
    .filter(batch => batch.batch_id != null && !!batch.batch_date)
    .map((batch) => (
      <BatchCard
        key={`${batch.batch_id}-${batch.batch_date}`}
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