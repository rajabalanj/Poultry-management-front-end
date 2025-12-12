import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { batchApi } from '../../services/api';
import { BatchResponse } from '../../types/batch';
import { toast } from 'react-toastify';
import PageHeader from '../Layout/PageHeader';
import Loading from '../Common/Loading';
import CustomDatePicker from '../Common/CustomDatePicker';
import StyledSelect from '../Common/StyledSelect';

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
      />
      <div className="container">
        <div className="card shadow-sm">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="batch1" className="form-label">First Batch</label>
                <StyledSelect
                  id="batch1"
                  value={batchId1 ? batches.find(batch => batch.id === batchId1) ? { value: batchId1, label: `${batches.find(batch => batch.id === batchId1)?.batch_no} - ${batches.find(batch => batch.id === batchId1)?.current_shed?.shed_no || batches.find(batch => batch.id === batchId1)?.shed_no || 'No Shed'}` } : null : null}
                  onChange={(option) => setBatchId1(option ? Number(option.value) : '')}
                  options={batches.map((batch) => ({
                    value: batch.id,
                    label: `${batch.batch_no} - ${batch.current_shed?.shed_no || batch.shed_no || 'No Shed'}`
                  }))}
                  placeholder="Select a batch"
                  isClearable
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="batch2" className="form-label">Second Batch</label>
                <StyledSelect
                  id="batch2"
                  value={batchId2 ? batches.find(batch => batch.id === batchId2) ? { value: batchId2, label: `${batches.find(batch => batch.id === batchId2)?.batch_no} - ${batches.find(batch => batch.id === batchId2)?.current_shed?.shed_no || batches.find(batch => batch.id === batchId2)?.shed_no || 'No Shed'}` } : null : null}
                  onChange={(option) => setBatchId2(option ? Number(option.value) : '')}
                  options={batches.map((batch) => ({
                    value: batch.id,
                    label: `${batch.batch_no} - ${batch.current_shed?.shed_no || batch.shed_no || 'No Shed'}`
                  }))}
                  placeholder="Select a batch"
                  isClearable
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="swapDate" className="form-label">Swap Date</label>
                <CustomDatePicker
                  id="swapDate"
                  selected={swapDate}
                  onChange={(date: Date | null) => setSwapDate(date)}
                  dateFormat="dd-MM-yyyy"
                  className="form-control"
                  dropdownMode="select"
                  showMonthDropdown
                  showYearDropdown
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
