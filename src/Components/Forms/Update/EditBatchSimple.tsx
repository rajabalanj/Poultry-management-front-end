import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { batchApi } from '../../../services/api';
import { BatchResponse } from '../../../types/batch';
import { toast } from 'react-toastify';
import PageHeader from '../../Layout/PageHeader';

const EditBatchSimple: React.FC = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const [batchNo, setBatchNo] = useState('');
  const [shedNo, setShedNo] = useState('');
  const [age, setAge] = useState('');
  const [openingCount, setOpeningCount] = useState('');
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
        toast.error('Failed to load batch details');
      } finally {
        setLoading(false);
      }
    };
    fetchBatch();
  }, [batchId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchId) return;
    setLoading(true);
    try {
      await batchApi.updateBatch(Number(batchId), {
        batch_no: batchNo,
        shed_no: shedNo,
        age: age,
        opening_count: parseInt(openingCount),
        date: date,
        isChickBatch: isChickBatch,
        // standard_hen_day_percentage: standardHenDay,
      });
      toast.success('Batch updated successfully!');
      navigate(-1);
    } catch (error) {
      toast.error('Failed to update batch. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="container-fluid">
      <PageHeader
        title="Edit Batch"
        buttonLabel="Back"
        buttonLink='/configurations'
      />
      <div className="p-4">
        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Batch Start Date</label>
              <input
                type="date"
                className="form-control"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Batch Number</label>
              <input
                type="text"
                className="form-control"
                value={batchNo}
                onChange={e => setBatchNo(e.target.value)}
                required
                min="1"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Shed Number</label>
              <input
                type="text"
                className="form-control"
                value={shedNo}
                onChange={e => setShedNo(e.target.value)}
                required
                min="1"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Opening Count</label>
              <input
                type="number"
                className="form-control"
                value={openingCount}
                onChange={e => setOpeningCount(e.target.value)}
                required
                min="0"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Age (week.day)</label>
              <input
                type="text"
                className="form-control"
                value={age}
                onChange={e => setAge(e.target.value)}
                required
                placeholder="e.g. 1.1"
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
                onChange={e => {
                  let val = parseFloat(e.target.value);
                  if (isNaN(val)) val = 0;
                  val = Math.max(0, Math.min(100, Math.round(val * 100) / 100));
                  setStandardHenDay(val);
                }}
                required
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
                  onChange={e => setIsChickBatch(e.target.checked)}
                />
                <label className="form-check-label" htmlFor="chickBatchCheckbox">
                  Chick Batch (no eggs)
                </label>
              </div>
            </div>
            <div className="col-12">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                className="btn btn-secondary ms-2"
                onClick={() => navigate(-1)}
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditBatchSimple;
