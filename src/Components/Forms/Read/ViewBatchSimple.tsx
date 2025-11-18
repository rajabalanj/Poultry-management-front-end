import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { batchApi } from '../../../services/api';
import { BatchResponse } from '../../../types/batch';
import PageHeader from '../../Layout/PageHeader';
import Loading from '../../Common/Loading';
import { Modal, Button } from 'react-bootstrap';
import { toast } from 'react-toastify';

const ViewBatchSimple: React.FC = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const [batch, setBatch] = useState<BatchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closingDate, setClosingDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!batchId) return;
        
        const batchData = await batchApi.getBatch(Number(batchId));
        
        setBatch(batchData);
      } catch (err) {
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [batchId]);

  const handleClose = async () => {
    if (!batch) return;
    try {
      await batchApi.closeBatch(batch.id, closingDate);
      toast.success(`Batch ${batch.batch_no} closed successfully!`);
      setShowCloseModal(false);
      navigate('/configurations');
    } catch (err: any) {
      toast.error(err.message || `Failed to close batch ${batch.id}.`);
    }
  };

  if (loading) return <Loading message="Loading data..." />;
  if (error) return <div>{error}</div>;
  if (!batch) return <div>Batch not found</div>;

  return (
    <>
      <PageHeader
        title="View Batch"
        buttonLabel="Back"
        buttonLink='/configurations'
      />
      <div className="container-fluid">
        <div className="p-4">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Batch Start Date</label>
              <input
                type="date"
                className="form-control"
                value={batch.date || ''}
                readOnly
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Batch Number</label>
              <input
                type="text"
                className="form-control"
                value={batch.batch_no}
                readOnly
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Shed Number</label>
              <input
                type="text"
                className="form-control"
                value={batch.current_shed?.shed_no || 'No Shed'}
                readOnly
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Opening</label>
              <input
                type="number"
                className="form-control"
                value={batch.opening_count}
                readOnly
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Age (week.day)</label>
              <input
                type="text"
                className="form-control"
                value={batch.age}
                readOnly
              />
            </div>
          </div>
          <div className="col-12 mt-4">
            <button
              type="button"
              className="btn btn-primary me-2"
              onClick={() => navigate(`/batch/${batchId}/edit-simple`)}
            >
              Edit
            </button>
            <button
              type="button"
              className="btn btn-danger me-2"
              onClick={() => setShowCloseModal(true)}
            >
              Close
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate(-1)}
            >
              Back
            </button>
          </div>
        </div>
      </div>

      {/* Close Modal */}
      <Modal show={showCloseModal} onHide={() => setShowCloseModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Close</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to close batch <strong>{batch?.batch_no}</strong>?</p>
          <div className="mb-3">
            <label htmlFor="closingDate" className="form-label">Closing Date</label>
            <input
              type="date"
              id="closingDate"
              className="form-control"
              value={closingDate}
              onChange={(e) => setClosingDate(e.target.value)}
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCloseModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleClose}>
            Close Batch
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ViewBatchSimple;