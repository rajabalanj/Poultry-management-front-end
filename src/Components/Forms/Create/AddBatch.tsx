import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { batchApi } from '../../../services/api';
import { toast } from 'react-toastify';
import PageHeader from '../../Layout/PageHeader';

const AddBatch: React.FC = () => {
  const [batch_no, setBatchNo] = useState('');
  const [batch_date, setBatchDate] = useState('');
  const [shed_no, setShedNo] = useState('1');
  const [opening_count, setOpeningCount] = useState('0');
  const [week, setWeek] = useState('1');
  const [day, setDay] = useState('1');
  const [isLoading, setIsLoading] = useState(false);
  const [is_chick_batch, setIsChickBatch] = useState(false);
  // const [standardHenDay, setStandardHenDay] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch all batches and set batch_no to max + 1
    const fetchMaxBatchNo = async () => {
      try {
        const batches = await batchApi.getBatches(0, 1000); // adjust limit as needed
        // batch_no is now just a number (e.g., 1, 8, 11)
        const nums = batches.map(b => Number(b.batch_no) || 0);
        const maxBatchNo = nums.length > 0 ? Math.max(...nums) : 0;
        setBatchNo(String(maxBatchNo + 1));
      } catch (err) {
        setBatchNo('1'); // fallback
      }
    };
    fetchMaxBatchNo();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formattedBatchNo = `B-${String(batch_no).padStart(4, '0')}`;

      const batchData = {
        batch_no: formattedBatchNo,
        shed_no: shed_no,
        age: `${week}.${day}`,
        opening_count: parseInt(opening_count),
        date: batch_date, // already in YYYY-MM-DD from input[type="date"]
        is_chick_batch: is_chick_batch,
        // standard_hen_day_percentage: standardHenDay,
      };

      await batchApi.createBatch(batchData);
      toast.success('Batch added successfully!');
      navigate('/');
    } catch (error) {
      console.error('Error adding batch:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to add batch. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleWeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || parseInt(value) > 0) {
      setWeek(value);
    }
  };

  const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || (parseInt(value) > 0 && parseInt(value) <= 7)) {
      setDay(value);
    }
  };

  return (
    <div className="container-fluid">
      <PageHeader 
        title="Add New Batch"
        buttonLabel="Back to Dashboard"
        buttonLink="/"
      />
      <div className="p-4">
        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Batch Strart Date</label>
              <input
                type="date"
                className="form-control"
                value={batch_date}
                onChange={(e) => setBatchDate(e.target.value)}
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Batch Number</label>
              <input
                type="integer"
                className="form-control"
                value={batch_no}
                onChange={(e) => setBatchNo(e.target.value)}
                required
                min="1"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Shed Number</label>
              <input
                type="string"
                className="form-control"
                value={shed_no}
                onChange={(e) => setShedNo(e.target.value)}
                required
                min="1"
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">Opening Count</label>
              <input
                type="number"
                className="form-control"
                value={opening_count}
                onChange={(e) => setOpeningCount(e.target.value)}
                required
                min="0"
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">Week</label>
              <input
                type="number"
                className="form-control"
                value={week}
                onChange={handleWeekChange}
                required
                min="1"
                placeholder="Enter week number"
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">Day (1-7)</label>
              <input
                type="number"
                className="form-control"
                value={day}
                onChange={handleDayChange}
                required
                min="1"
                max="7"
                placeholder="Enter day (1-7)"
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
                  checked={is_chick_batch}
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
                disabled={isLoading}
              >
                {isLoading ? 'Adding...' : 'Add Batch'}
              </button>
              <button
                type="button"
                className="btn btn-secondary ms-2"
                onClick={() => navigate('/')}
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

export default AddBatch;

