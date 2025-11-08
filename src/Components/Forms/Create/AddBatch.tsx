import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { batchApi } from '../../../services/api';
import { toast } from 'react-toastify';
import PageHeader from '../../Layout/PageHeader';
import { useLocation } from 'react-router-dom';
import { DateSelector } from '../../DateSelector';

const AddBatch: React.FC = () => {
  const [batch_no, setBatchNo] = useState('');
  const [batch_date, setBatchDate] = useState(''); // This is for the start date of the batch, not age
  const [shed_no, setShedNo] = useState('1'); // This is for the shed number
  const [opening_count, setOpeningCount] = useState('0');
  const [week, setWeek] = useState('0'); // Age starts from 0 weeks
  const [day, setDay] = useState('1');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Prefill fields from query params when opened from a pending request
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const date = params.get('date');
    const shed = params.get('shed');
    const batchno = params.get('batch_no');
    if (date) setBatchDate(date);
    if (shed) setShedNo(shed);
    if (batchno) setBatchNo(batchno.replace(/^B-/, ''));
  }, [location.search]);

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
        // standard_hen_day_percentage: standardHenDay,
      };

      await batchApi.createBatch(batchData);
      toast.success('Batch added successfully!');
      navigate('/production'); // Redirect to production page
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
    if (value === '' || parseInt(value) >= 0) { // Allow week 0
      setWeek(value);
    }
  };

  const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= 7)) { // Day must be between 1 and 7
      setDay(value);
    }
  };

  const handleBatchNoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setBatchNo(value);
    }
  };

  return (
    <>
    <PageHeader 
        title="Add New Batch"
      />
    <div className="container-fluid">
      <div className="p-4">
        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-6">
              <DateSelector
                label="Batch Start Date"
                defaultValue={batch_date}
                onChange={setBatchDate}
                isBold={false}
                layout='vertical'
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Batch Number</label>
              <input
                type="number"
                className="form-control"
                value={batch_no}
                onChange={handleBatchNoChange}
                required
                min="1"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Shed Number</label>
              <input
                type="text"
                className="form-control"
                value={shed_no}
                onChange={(e) => setShedNo(e.target.value)}
                required
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">Opening</label>
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
                onChange={handleWeekChange} // Age starts from 0 weeks
                required
                min="0"
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
                required // Day must be between 1 and 7
                min="1"
                max="7"
                placeholder="Enter day (1-7)"
              />
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
                onClick={() => navigate('/production')} // Redirect to production page
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

export default AddBatch;