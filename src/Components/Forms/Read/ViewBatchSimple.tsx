import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { batchApi } from '../../../services/api';
import { BatchResponse } from '../../../types/batch';
import PageHeader from '../../Layout/PageHeader';

const ViewBatchSimple: React.FC = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const [batchNo, setBatchNo] = useState('');
  const [shedNo, setShedNo] = useState('');
  const [openingCount, setOpeningCount] = useState('');
  const [age, setAge] = useState('');
  const [date, setDate] = useState('');
  const [isChickBatch, setIsChickBatch] = useState(false);
  // const [standardHenDay, setStandardHenDay] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBatch = async () => {
      try {
        if (!batchId) return;
        const data: BatchResponse = await batchApi.getBatch(Number(batchId));
        setBatchNo(data.batch_no || '');
        setShedNo(data.shed_no || '');
        setAge(data.age || '');
        setOpeningCount(data.opening_count?.toString() || '');
        setDate(data.date || '');
        setIsChickBatch(data.isChickBatch ?? false);
        // setStandardHenDay(data.standard_hen_day_percentage ?? 0);
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
              value={date || ''}
              disabled
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Batch Number</label>
            <input
              type="text"
              className="form-control"
              value={batchNo}
              disabled
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Shed Number</label>
            <input
              type="text"
              className="form-control"
              value={shedNo}
              disabled
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Opening Count</label>
            <input
              type="number"
              className="form-control"
              value={openingCount}
              disabled
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Age (week.day)</label>
            <input
              type="text"
              className="form-control"
              value={age}
              disabled
            />
          </div>
          {/* <div className="col-md-6">
            <label className="form-label">Standard Hen Day Percentage</label>
            <input
              type="number"
              className="form-control"
              value={standardHenDay}
              min="0"
              max="100"
              step="0.01"
              disabled
              placeholder="0-100"
            />
          </div> */}
          <div className="col-12">
            <div className="form-check mb-3">
              <input
                className="form-check-input border border-dark"
                type="checkbox"
                id="chickBatchCheckbox"
                checked={isChickBatch}
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
