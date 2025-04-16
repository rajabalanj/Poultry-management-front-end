import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { batchApi, Batch } from '../services/api';

const EditBatch: React.FC = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBatch = async () => {
      try {
        if (!batchId) return;
        const response = await batchApi.getBatch(batchId);
        setBatch(response.data);
      } catch (err) {
        setError('Failed to load batch');
      } finally {
        setLoading(false);
      }
    };

    fetchBatch();
  }, [batchId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batch) return;

    try {
      await batchApi.updateBatch(batchId!, batch);
      navigate(`/batch/${batchId}/details`);
    } catch (err) {
      setError('Failed to update batch');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!batch) return <div>Batch not found</div>;

  return (
    <div className="container mt-4">
      <h2>Edit Batch</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Batch Number</label>
          <input
            type="text"
            className="form-control"
            value={batch.batchNo}
            onChange={(e) => setBatch({ ...batch, batchNo: e.target.value })}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Shed Number</label>
          <input
            type="number"
            className="form-control"
            value={batch.shedNo}
            onChange={(e) => setBatch({ ...batch, shedNo: parseInt(e.target.value) })}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Age</label>
          <input
            type="text"
            className="form-control"
            value={batch.age}
            onChange={(e) => setBatch({ ...batch, age: e.target.value })}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Opening Count</label>
          <input
            type="number"
            className="form-control"
            value={batch.openingCount}
            onChange={(e) => setBatch({ ...batch, openingCount: parseInt(e.target.value) })}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Mortality</label>
          <input
            type="number"
            className="form-control"
            value={batch.mortality}
            onChange={(e) => setBatch({ ...batch, mortality: parseInt(e.target.value) })}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Culls</label>
          <input
            type="number"
            className="form-control"
            value={batch.culls}
            onChange={(e) => setBatch({ ...batch, culls: parseInt(e.target.value) })}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Closing Count</label>
          <input
            type="number"
            className="form-control"
            value={batch.closingCount}
            onChange={(e) => setBatch({ ...batch, closingCount: parseInt(e.target.value) })}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Table Eggs</label>
          <input
            type="number"
            className="form-control"
            value={batch.table}
            onChange={(e) => setBatch({ ...batch, table: parseInt(e.target.value) })}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Jumbo Eggs</label>
          <input
            type="number"
            className="form-control"
            value={batch.jumbo}
            onChange={(e) => setBatch({ ...batch, jumbo: parseInt(e.target.value) })}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">CR</label>
          <input
            type="number"
            className="form-control"
            value={batch.cr}
            onChange={(e) => setBatch({ ...batch, cr: parseInt(e.target.value) })}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Total Eggs</label>
          <input
            type="number"
            className="form-control"
            value={batch.totalEggs}
            onChange={(e) => setBatch({ ...batch, totalEggs: parseInt(e.target.value) })}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Date</label>
          <input
            type="date"
            className="form-control"
            value={batch.date}
            onChange={(e) => setBatch({ ...batch, date: e.target.value })}
          />
        </div>
        <button type="submit" className="btn btn-primary">Save Changes</button>
        <button type="button" className="btn btn-secondary ms-2" onClick={() => navigate(-1)}>Cancel</button>
      </form>
    </div>
  );
};

export default EditBatch; 