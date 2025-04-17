import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { batchApi } from '../services/api';
import { Batch } from '../services/api';
import { toast } from 'react-toastify';
import PageHeader from './PageHeader';

const BatchDetails: React.FC = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBatch = async () => {
      try {
        if (batchId) {
          const data = await batchApi.getBatch(Number(batchId));
          setBatch(data);
        }
      } catch (error) {
        console.error('Error fetching batch:', error);
        toast.error('Failed to load batch details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBatch();
  }, [batchId]);

  if (isLoading) {
    return <div className="text-center">Loading...</div>;
  }

  if (!batch) {
    return <div className="text-center">Batch not found</div>;
  }

  const totalEggs = (batch.table || 0) + (batch.jumbo || 0) + (batch.cr || 0);

  return (
    <div className="container-fluid">
      <PageHeader 
        title={`Batch Details - ${batch.batch_no}`}
        buttonLabel="Back"
        buttonLink="/"
      />

      <div className="p-4">
        <div className="row">
          <div className="col-12 col-md-6">
            <div className="mb-4">
              <label className="form-label">Shed No.</label>
              <input
                type="number"
                className="form-control"
                value={batch.shed_no}
                disabled
              />
            </div>

            <div className="mb-4">
              <label className="form-label">Age</label>
              <input
                type="text"
                className="form-control"
                value={batch.age}
                disabled
              />
            </div>

            <div className="mb-4">
              <label className="form-label">Opening Count</label>
              <input
                type="number"
                className="form-control"
                value={batch.opening_count}
                disabled
              />
            </div>

            <div className="mb-4">
              <label className="form-label">Mortality</label>
              <input
                type="number"
                className="form-control"
                value={batch.mortality}
                disabled
              />
            </div>

            <div className="mb-4">
              <label className="form-label">Culls</label>
              <input
                type="number"
                className="form-control"
                value={batch.culls}
                disabled
              />
            </div>
          </div>

          <div className="col-12 col-md-6">
            <div className="row g-3 mb-4">
              <div className="col-6">
                <label className="form-label">Table</label>
                <input
                  type="number"
                  className="form-control"
                  value={batch.table}
                  disabled
                />
              </div>
              <div className="col-6">
                <label className="form-label">Jumbo</label>
                <input
                  type="number"
                  className="form-control"
                  value={batch.jumbo}
                  disabled
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label">CR</label>
              <input
                type="number"
                className="form-control"
                value={batch.cr}
                disabled
              />
            </div>

            <div className="bg-light p-4 rounded">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Total Eggs</h5>
                <span className="h4 text-primary mb-0">{totalEggs}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 d-flex justify-content-center">
          <button type="button" className="btn btn-primary me-2" onClick={() => navigate(`/batch/${batchId}/edit`)}>
            Update
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/')}>
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default BatchDetails; 