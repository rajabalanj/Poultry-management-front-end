import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { batchApi } from '../../../services/api';
import { BatchResponse, BatchUpdate } from '../../../types/batch';
import { toast } from 'react-toastify';
import PageHeader from '../../Layout/PageHeader';
import Loading from '../../Common/Loading';
import CustomDatePicker from '../../Common/CustomDatePicker';

const EditBatchSimple: React.FC = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const [batchNo, setBatchNo] = useState('');
  const [age, setAge] = useState('');
  const [openingCount, setOpeningCount] = useState('');
  const [date, setDate] = useState('');
  const [shedChangeDate, setShedChangeDate] = useState('');
  const [initialBatch, setInitialBatch] = useState<BatchResponse | null>(null);
  // const [standardHenDay, setStandardHenDay] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBatch = async () => {
      try {
        if (!batchId) return;
        const data: BatchResponse = await batchApi.getBatch(Number(batchId));
        setBatchNo(data.batch_no || '');
        setAge(data.age || '');
        setOpeningCount(data.opening_count?.toString() || '');
        setDate(data.date || '');
        setShedChangeDate(data.shed_change_date || '');
        setInitialBatch(data);
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
    if (!batchId || !initialBatch) return;
    setLoading(true);

    const payload: Partial<BatchUpdate> = {};

    const formattedBatchNo = formatBatchNo(batchNo);
    if (formattedBatchNo !== initialBatch.batch_no) {
      payload.batch_no = formattedBatchNo;
    }
    if (age !== initialBatch.age) {
      payload.age = age;
    }
    const currentOpeningCount = openingCount ? parseInt(openingCount) : 0;
    if (currentOpeningCount !== initialBatch.opening_count) {
      payload.opening_count = currentOpeningCount;
    }
    if (date !== initialBatch.date) {
      payload.date = date;
    }
    if (shedChangeDate !== (initialBatch.shed_change_date || '')) {
        payload.shed_change_date = shedChangeDate;
    }

    if (Object.keys(payload).length === 0) {
      toast.info("No changes to save.");
      setLoading(false);
      navigate(-1);
      return;
    }

    try {
      await batchApi.updateBatch(Number(batchId), payload);
      toast.success('Batch updated successfully!');
      navigate(-1);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update batch. Please try again.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading message="Loading data..." />;
  if (error) return <div>{error}</div>;

  return (
    <>
    <PageHeader
        title="Edit Batch"
        buttonLabel="Back"
        buttonLink='/configurations'
        buttonIcon="bi-arrow-left"
      />
    <div className="container">
      <div className="p-4">
        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label mb-1">Batch Start Date</label>
              <div>
              <CustomDatePicker
                selected={date ? new Date(date) : null}
                onChange={(d: Date | null) => d && setDate(d.toISOString().split('T')[0])}
                dateFormat="dd-MM-yyyy"
                className="form-control"
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                maxDate={new Date()}
              />
              </div>
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
                value={initialBatch?.current_shed?.shed_no || ''}
                readOnly
              />
              <div className="form-text">To change the shed, use the Move Shed option</div>
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
                placeholder="e.g. 0.1 or 1.1"
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