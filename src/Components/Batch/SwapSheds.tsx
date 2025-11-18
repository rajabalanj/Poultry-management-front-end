import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { batchApi } from '../../services/api';
import { BatchResponse } from '../../types/batch';
import { toast } from 'react-toastify';
import PageHeader from '../Layout/PageHeader';
import Loading from '../Common/Loading';
import DatePicker from 'react-datepicker';

const SwapSheds: React.FC = () => {
  const navigate = useNavigate();
  const [batches, setBatches] = useState<BatchResponse[]>([]);
  const [batchId1, setBatchId1] = useState<number | ''>('');
  const [batchId2, setBatchId2] = useState<number | ''>('');
  const [swapDate, setSwapDate] = useState<Date | null>(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const availableBatches = await batchApi.getBatches();
        setBatches(availableBatches);
      } catch (error) {
        toast.error('Failed to fetch data.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (batchId1 === '' || batchId2 === '' || !swapDate) {
      toast.error('Please select both batches and a swap date.');
      return;
    }

    if (batchId1 === batchId2) {
      toast.error('Please select two different batches.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedDate = swapDate.toISOString().split('T')[0];
      await batchApi.swapSheds({
        batch_id_1: Number(batchId1),
        batch_id_2: Number(batchId2),
        swap_date: formattedDate
      });
      toast.success('Batches swapped successfully!');
      navigate('/production');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to swap batches.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <Loading message="Loading batches..." />;
  }

  return (
    <>
      <PageHeader
        title="Swap Sheds Between Batches"
        buttonLabel="Back to Production"
        buttonLink="/production"
      />
      <div className="container-fluid">
        <div className="card shadow-sm">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="batch1" className="form-label">First Batch</label>
                <select
                  id="batch1"
                  className="form-select"
                  value={batchId1}
                  onChange={(e) => setBatchId1(Number(e.target.value))}
                  required
                >
                  <option value="" disabled>Select a batch</option>
                  {batches.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.batch_no} - {batch.current_shed?.shed_no || batch.shed_no || 'No Shed'}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label htmlFor="batch2" className="form-label">Second Batch</label>
                <select
                  id="batch2"
                  className="form-select"
                  value={batchId2}
                  onChange={(e) => setBatchId2(Number(e.target.value))}
                  required
                >
                  <option value="" disabled>Select a batch</option>
                  {batches.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.batch_no} - {batch.current_shed?.shed_no || batch.shed_no || 'No Shed'}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label htmlFor="swapDate" className="form-label">Swap Date</label>
                <DatePicker
                  id="swapDate"
                  selected={swapDate}
                  onChange={(date: Date | null) => setSwapDate(date)}
                  dateFormat="dd-MM-yyyy"
                  className="form-control"
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Swapping...' : 'Swap Sheds'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default SwapSheds;
