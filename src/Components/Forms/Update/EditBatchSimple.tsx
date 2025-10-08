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
  const [shedChangeDate, setShedChangeDate] = useState('');
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
      } catch (err) {
        setError('Failed to load batch');
        toast.error('Failed to load batch details');
      } finally {
        setLoading(false);
      }
    };
    fetchBatch();
  }, [batchId]);

  // Helper to ensure batch number uses the backend format: B-<4 digit zero-padded number>
  const formatBatchNo = (value: string) => {
    if (!value) return '';
    // If already formatted like 'B-0001', return as-is
    if (value.startsWith('B-')) return value;
    const n = parseInt(value, 10);
    if (isNaN(n)) return value; // fallback to whatever was provided
    return `B-${n.toString().padStart(4, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchId) return;
    setLoading(true);
    try {
      await batchApi.updateBatch(Number(batchId), {
        batch_no: formatBatchNo(batchNo),
        shed_no: shedNo,
        age: age,
        opening_count: parseInt(openingCount),
        date: date,
        shed_change_date: shedChangeDate
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
    <>
    <PageHeader
        title="Edit Batch"
        buttonLabel="Back"
        buttonLink='/configurations'
      />
    <div className="container-fluid">
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
                value={formatBatchNo(batchNo)}
                onChange={e => setBatchNo(e.target.value)}
                required
                readOnly
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
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Opening</label>
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
            <div className="col-md-6">
              <label className="form-label">Shed Change Date</label>
              <input
                type="date"
                className="form-control"
                value={shedChangeDate}
                onChange={e => setShedChangeDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
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
    </>
  );
};

export default EditBatchSimple;