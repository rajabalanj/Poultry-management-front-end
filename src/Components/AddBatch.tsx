import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { batchApi } from '../services/api';
import { toast } from 'react-toastify';

const AddBatch: React.FC = () => {
  const [shedNo, setShedNo] = useState('1');
  const [openingCount, setOpeningCount] = useState('0');
  const [week, setWeek] = useState('1');
  const [day, setDay] = useState('1');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const batchData = {
        shedNo,
        openingCount,
        week,
        day,
      };

      await batchApi.createBatch(batchData);
      toast.success('Batch added successfully!');
      navigate('/');
    } catch (error) {
      toast.error('Failed to add batch. Please try again.');
      console.error('Error adding batch:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <h4 className="text-center mb-4">Add New Batch</h4>
      <form onSubmit={handleSubmit} className="mx-auto" style={{ maxWidth: '500px' }}>
        <div className="mb-3">
          <label className="form-label">Shed No.</label>
          <select
            className="form-select"
            value={shedNo}
            onChange={(e) => setShedNo(e.target.value)}
            disabled={isLoading}
          >
            <option value="1">1</option>
            <option value="2">2</option>
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label">Opening Count</label>
          <input
            type="number"
            className="form-control"
            value={openingCount}
            onChange={(e) => setOpeningCount(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="row mb-3">
          <div className="col">
            <label className="form-label">Week</label>
            <input
              type="number"
              className="form-control"
              value={week}
              onChange={(e) => setWeek(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="col">
            <label className="form-label">Day</label>
            <input
              type="number"
              className="form-control"
              value={day}
              onChange={(e) => setDay(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="d-flex justify-content-end">
          <button
            type="button"
            className="btn btn-outline-secondary me-2"
            onClick={() => navigate('/')}
            disabled={isLoading}
          >
            Back
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary me-2"
            onClick={() => {
              setShedNo('1');
              setOpeningCount('0');
              setWeek('1');
              setDay('1');
            }}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Adding...' : 'Add Batch'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddBatch;
