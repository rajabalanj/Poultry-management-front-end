import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { batchApi } from '../../../services/api';
import { BatchResponse } from '../../../types/batch';
import PageHeader from '../../Layout/PageHeader';
import Loading from '../../Common/Loading';

const ViewBatchSimple: React.FC = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const [batchNo, setBatchNo] = useState('');
  const [shedNo, setShedNo] = useState('');
  const [openingCount, setOpeningCount] = useState('');
  const [age, setAge] = useState('');
  const [date, setDate] = useState('');
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
      } catch (err) {
        setError('Failed to load batch');
      } finally {
        setLoading(false);
      }
    };
    fetchBatch();
  }, [batchId]);

  if (loading) return <Loading message="Loading data..." />;
  if (error) return <div>{error}</div>;

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
              value={date || ''}
              readOnly
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Batch Number</label>
            <input
              type="text"
              className="form-control"
              value={batchNo}
              readOnly
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Shed Number</label>
            <input
              type="text"
              className="form-control"
              value={shedNo}
              readOnly
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Opening</label>
            <input
              type="number"
              className="form-control"
              value={openingCount}
              readOnly
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Age (week.day)</label>
            <input
              type="text"
              className="form-control"
              value={age}
              readOnly
            />
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
    </>
  );
};

export default ViewBatchSimple;
