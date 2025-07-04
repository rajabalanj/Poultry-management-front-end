import React, { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.css";
import { DailyBatch } from "../types/daily_batch";

const BatchCard: React.FC<{
  batch: DailyBatch;
  onView: (batch_id: number, batchDate: string) => void;
  onEdit: (batch_id: number, batchDate: string) => void;
}> = React.memo(({ batch, onView, onEdit }) => (
  <div className="card mb-2 border shadow-sm">
    <div className="card-body p-2">
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <h6 className="mb-1 text-sm">Batch {batch.batch_no}</h6>
          <div className="text-xs">
            <span className="me-2">Shed: {batch.shed_no}</span>
            <span>Age: {batch.age}</span>
          </div>
        </div>
        <div className="d-flex flex-column flex-md-row gap-2">
          <button
            className="btn btn-primary btn-sm d-flex align-items-center justify-content-center"
            onClick={() => onView(batch.batch_id, batch.batch_date)}
            title="View Details"
            aria-label={`View Details for Batch ${batch.batch_no}`}
          >
            <i className="bi bi-eye me-1"></i>
            <span className="text-xs">Batch Overview</span>
          </button>
          <button
            className="btn btn-success btn-sm d-flex align-items-center justify-content-center"
            onClick={() => onEdit(batch.batch_id, batch.batch_date)}
            title="Record Daily Data"
            aria-label={`Record Daily Data for Batch ${batch.batch_no}`}
          >
            <i className="bi bi-journal-text me-1"></i>
            <span className="text-xs">Record Daily Data</span>
          </button>
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

  const batchCards = useMemo(() => {
    return batches
      .filter(batch => batch.batch_id != null && !!batch.batch_date)
      .map((batch) => (
        <BatchCard
          key={`${batch.batch_id}-${batch.batch_date}`}
          batch={batch}
          onView={handleViewDetails}
          onEdit={handleEdit}
        />
      ));
  }, [batches, handleViewDetails, handleEdit]);

  if (loading) return <div className="text-center">Loading...</div>;
  if (error) return <div className="text-center text-danger">{error}</div>;
  if (batches.length === 0) return <div className="text-center">No batches found</div>;

  return <div className="px-2">{batchCards}</div>;
};

export default BatchTable;