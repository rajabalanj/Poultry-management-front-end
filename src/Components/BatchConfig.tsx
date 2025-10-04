import React, { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.css";
import { BatchResponse } from "../types/batch";
import { batchApi } from "../services/api"; // Import dailyBatchApi
import { toast } from "react-toastify"; // Import toast for notifications
import { Modal, Button } from "react-bootstrap";



const BatchConfigCard: React.FC<{
  batch: BatchResponse;
  onView: (batch_id: number) => void;
  onEdit: (batch_id: number) => void;
  onClose: (batch_id: number) => void; // Add onClose prop
}> = React.memo(({ batch, onView, onEdit, onClose }) => (
  <div className="card mb-2 border shadow-sm">
    <div className="card-body p-2">
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <h6 className="mb-1 text-base">Batch {batch.batch_no}</h6>
          <div className="text-base">
            <span className="me-2">Shed: {batch.shed_no}</span>
            <span>Age: {batch.age}</span>
          </div>
        </div>
        <div className="d-flex flex-column flex-md-row gap-2">
          <button
            className="btn btn-primary btn-sm d-flex align-items-center justify-content-center"
            onClick={() => onView(batch.id)}
            title="View Details"
            aria-label={`View Details for Batch ${batch.batch_no}`}
          >
            <i className="bi bi-eye me-1"></i>
            <span className="text-sm">View</span>
          </button>
          <button
            className="btn btn-success btn-sm d-flex align-items-center justify-content-center"
            onClick={() => onEdit(batch.id)}
            title="Edit Batch"
            aria-label={`Edit Batch ${batch.batch_no}`}
          >
            <i className="bi bi-pencil me-1"></i>
            <span className="text-sm">Edit</span>
          </button>
          {/* {batch.closing_date === null && ( // Conditionally render Close button */}
            <button
              className="btn btn-danger btn-sm d-flex align-items-center justify-content-center"
              onClick={() => onClose(batch.id)}
              title="Close Batch"
              aria-label={`Close Batch ${batch.batch_no}`}
            >
              <i className="bi bi-x-circle me-1"></i>
              <span className="text-sm">Close</span>
            </button>
          {/* )} */}
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
  const [showCloseModal, setShowCloseModal] = useState(false);
const [batchToClose, setBatchToClose] = useState<BatchResponse | null>(null);
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

  const handleClose = useCallback((batch_id: number) => {
  const batch = batches.find(b => b.id === batch_id);
  if (batch) {
    setBatchToClose(batch);
    setShowCloseModal(true);
  }
}, [batches]);


  const visibleBatches = useMemo(() => batches.filter(batch => batch.id != null && !!batch.batch_type), [batches]);
  const batchSections = useMemo(() => {
    const byType = {
      Layer: visibleBatches.filter(b => b.batch_type === 'Layer'),
      Grower: visibleBatches.filter(b => b.batch_type === 'Grower'),
      Chick: visibleBatches.filter(b => b.batch_type === 'Chick'),
    };
    return byType;
  }, [visibleBatches]);

  if (loading) return <div className="text-center">Loading...</div>;
  if (error) return <div className="text-center text-danger">{error}</div>;
  if (visibleBatches.length === 0) return <div className="text-center">No batches found</div>;
  return (
    <>
      <div className="px-2">
        {batchSections.Layer.length > 0 && (
          <div className="mb-4">
            <h5 className="fw-bold text-primary mb-3">Layer Batches</h5>
            {batchSections.Layer.map(batch => (
              <BatchConfigCard
                key={`Layer-${batch.id}`}
                batch={batch}
                onView={handleView}
                onEdit={handleEdit}
                onClose={handleClose}
              />
            ))}
          </div>
        )}
        {batchSections.Grower.length > 0 && (
          <div className="mb-4">
            <h5 className="fw-bold text-primary mb-3">Grower Batches</h5>
            {batchSections.Grower.map(batch => (
              <BatchConfigCard
                key={`Grower-${batch.id}`}
                batch={batch}
                onView={handleView}
                onEdit={handleEdit}
                onClose={handleClose}
              />
            ))}
          </div>
        )}
        {batchSections.Chick.length > 0 && (
          <div className="mb-4">
            <h5 className="fw-bold text-primary mb-3">Chick Batches</h5>
            {batchSections.Chick.map(batch => (
              <BatchConfigCard
                key={`Chick-${batch.id}`}
                batch={batch}
                onView={handleView}
                onEdit={handleEdit}
                onClose={handleClose}
              />
            ))}
          </div>
        )}
      </div>

    <Modal show={showCloseModal} onHide={() => setShowCloseModal(false)}>
      <Modal.Header closeButton>
        <Modal.Title>Confirm Close</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        Are you sure you want to close batch <strong>{batchToClose?.batch_no}</strong>?
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowCloseModal(false)}>
          Cancel
        </Button>
        <Button
          variant="danger"
          onClick={async () => {
            if (!batchToClose) return;
            try {
              await batchApi.closeBatch(batchToClose.id);
              toast.success(`Batch ${batchToClose.batch_no} closed successfully!`);
              setShowCloseModal(false);
              setBatchToClose(null);
              window.location.reload();
            } catch (err: any) {
              toast.error(err.message || `Failed to close batch ${batchToClose.id}.`);
            }
          }}
        >
          Close Batch
        </Button>
      </Modal.Footer>
    </Modal>
  </>
);

  
};

export default BatchConfig;