import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { batchApi, shedApi} from '../../../services/api';
import { toast } from 'react-toastify';
import PageHeader from '../../Layout/PageHeader';
import { useLocation } from 'react-router-dom';
import CustomDatePicker from '../../Common/CustomDatePicker';
import { ShedResponse } from '../../../types/shed';

const AddBatch: React.FC = () => {
  const [batch_no, setBatchNo] = useState('');
  const [batch_date, setBatchDate] = useState(new Date().toISOString().slice(0, 10)); // Default to today's date
  const [shed_no, setShedNo] = useState(''); // This is for the shed number
  const [opening_count, setOpeningCount] = useState('0');
  const [week, setWeek] = useState('0'); // Age starts from 0 weeks
  const [day, setDay] = useState('1');
  const [isLoading, setIsLoading] = useState(false);
  const [sheds, setSheds] = useState<ShedResponse[]>([]);
  const [isLoadingSheds, setIsLoadingSheds] = useState(true);
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

    const fetchSheds = async () => {
      try {
        setIsLoadingSheds(true);
        const shedsData = await shedApi.getSheds();
        setSheds(shedsData);
        if (shedsData.length > 0) {
          setShedNo(String(shedsData[0].id)); // Default to the first shed
        }
      } catch (error) {
        console.error('Failed to fetch sheds:', error);
        toast.error('Failed to fetch sheds.');
      } finally {
        setIsLoadingSheds(false);
      }
    };

    fetchMaxBatchNo();
    fetchSheds();
  }, []);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formattedBatchNo = `B-${String(batch_no).padStart(4, '0')}`;

      const batchData = {
        batch_no: formattedBatchNo,
        shed_id: parseInt(shed_no, 10),
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
      <PageHeader title="Add New Batch" />
      <div className="container">
        <div className="p-4">
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
              <label className="form-label mb-1">Batch Start Date</label> {/* Added mb-1 for small vertical spacing */}
              {/* Wrap DatePicker in a div to ensure it's on a new line */}
              <div>
                <CustomDatePicker
                  selected={batch_date ? new Date(batch_date) : null}
                  onChange={(date: Date | null) =>
                    date && setBatchDate(date.toISOString().slice(0, 10))
                  }
                  dateFormat="dd-MM-yyyy"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  className="form-control"
                />
              </div>
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
                {isLoadingSheds ? (
                  <p>Loading sheds...</p>
                ) : (
                <select
                  className="form-control"
                  value={shed_no}
                  onChange={(e) => setShedNo(e.target.value)}
                  required
                >
                  {sheds.map((shed) => (
                    <option key={shed.id} value={shed.id}>
                      {shed.shed_no}
                    </option>
                  ))}
                </select>
                )}
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
                  {isLoading ? "Adding..." : "Add Batch"}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary ms-2"
                  onClick={() => navigate("/production")} // Redirect to production page
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