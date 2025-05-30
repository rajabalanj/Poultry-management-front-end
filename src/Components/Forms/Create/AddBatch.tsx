import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { batchApi } from '../../../services/api';
import { toast } from 'react-toastify';
import PageHeader from '../../Layout/PageHeader';

const AddBatch: React.FC = () => {
  const [shed_no, setShedNo] = useState('1');
  const [opening_count, setOpeningCount] = useState('0');
  const [week, setWeek] = useState('1');
  const [day, setDay] = useState('1');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const batchData = {
        batch_no: `B-${shed_no}`,
        shed_no: parseInt(shed_no),
        age: `${week}.${day}`,
        opening_count: parseInt(opening_count),
        mortality: 0,
        culls: 0,
        closing_count: parseInt(opening_count),
        table: 0,
        jumbo: 0,
        cr: 0,
        date: new Date().toLocaleDateString()
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
              <label className="form-label">Shed Number</label>
              <input
                type="number"
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

