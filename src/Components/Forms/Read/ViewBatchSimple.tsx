import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { batchApi } from '../../../services/api';
import { BatchResponse } from '../../../types/batch';
import PageHeader from '../../Layout/PageHeader';

const ViewBatchSimple: React.FC = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const [batch, setBatch] = useState<BatchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBatch = async () => {
      try {
        if (!batchId) return;
        const data: BatchResponse = await batchApi.getBatch(Number(batchId));
        setBatch(data);
      } catch (err) {
        setError('Failed to load batch');
      } finally {
        setLoading(false);
      }
    };
    fetchBatch();
  }, [batchId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!batch) return <div>No batch found.</div>;

  return (
    <div className="container-fluid">
      <PageHeader
        title="View Batch"
        buttonLabel="Back"
        buttonLink='/configurations'
      />
      <div className="p-4">
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label">Batch Start Date</label>
            <input
              type="date"
              className="form-control"
              value={batch.date || ''}
              disabled
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Batch Number</label>
            <input
              type="text"
              className="form-control"
              value={batch.batch_no || ''}
              disabled
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Shed Number</label>
            <input
              type="text"
              className="form-control"
              value={batch.shed_no || ''}
              disabled
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Opening Count</label>
            <input
              type="number"
              className="form-control"
              value={batch.opening_count ?? ''}
              disabled
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Age (week.day)</label>
            <input
              type="text"
              className="form-control"
              value={batch.age || ''}
              disabled
            />
          </div>
          <div className="col-12">
            <div className="form-check mb-3">
              <input
                className="form-check-input border border-dark"
                type="checkbox"
                id="chickBatchCheckbox"
                checked={batch.isChickBatch ?? false}
                disabled
              />
              <label className="form-check-label" htmlFor="chickBatchCheckbox">
                Chick Batch (no eggs)
              </label>
            </div>
          </div>
          <div className="col-12">
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
    </div>
  );
};

export default ViewBatchSimple;
