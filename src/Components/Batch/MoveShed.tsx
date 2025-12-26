import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { batchApi, shedApi, dailyBatchApi } from '../../services/api';
import { ShedResponse } from '../../types/shed';
import { toast } from 'react-toastify';
import PageHeader from '../Layout/PageHeader';
import Loading from '../Common/Loading';
import CustomDatePicker from '../Common/CustomDatePicker';
import StyledSelect from '../Common/StyledSelect';
import { DailyBatch } from '../../types/daily_batch';

const MoveShed: React.FC = () => {
  const { batch_id } = useParams<{ batch_id: string }>();
  const navigate = useNavigate();
  
  const [sheds, setSheds] = useState<ShedResponse[]>([]);
  const [newShedId, setNewShedId] = useState<number | ''>('');
  const [moveDate, setMoveDate] = useState<Date | null>(new Date());
  
  const [currentShedId, setCurrentShedId] = useState<number | null>(null);
  const [currentShedNo, setCurrentShedNo] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchShedData = async () => {
      setIsLoading(true);
      try {
        // Fetch all available sheds for the dropdown
        const availableSheds = await shedApi.getSheds();
        setSheds(availableSheds);

        // Fetch current shed info for the batch
        if (batch_id) {
          const today = new Date().toISOString().split('T')[0];
          const dailyBatches: DailyBatch[] = await dailyBatchApi.getDailyBatches(today);
          const currentBatch = dailyBatches.find(db => db.batch_id === Number(batch_id));

          if (currentBatch && currentBatch.shed_id) {
            // Found the shed ID, now get the shed details
            const shedDetails = await shedApi.getShed(currentBatch.shed_id);
            setCurrentShedId(shedDetails.id);
            setCurrentShedNo(shedDetails.shed_no);
          } else {
            setCurrentShedNo('Not assigned');
            toast.info("Could not determine the current shed for this batch based on today's data.");
          }
        }
      } catch (error) {
        toast.error('Failed to fetch shed data.');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchShedData();
  }, [batch_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batch_id || newShedId === '' || !moveDate) {
      toast.error('Please select a new shed and a move date.');
      return;
    }

    if (newShedId === currentShedId) {
      toast.error('New shed cannot be the same as the current shed.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedDate = moveDate.toISOString().split('T')[0];
      await batchApi.moveShed(Number(batch_id), Number(newShedId), formattedDate);
      toast.success('Batch moved successfully!');
      navigate(`/batch/${batch_id}/${moveDate.toISOString()}/details`);
    } catch (error) {
      toast.error('Failed to move batch.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <Loading message="Loading shed data..." />;
  }

  const availableShedsOptions = sheds
    .filter(shed => shed.id !== currentShedId)
    .map((shed) => ({
      value: shed.id,
      label: shed.shed_no,
    }));

  return (
    <>
      <PageHeader
        title="Move Batch to a New Shed"
        buttonLabel="Back to Batch Details"
        buttonLink={batch_id ? `/batch/${batch_id}/${new Date().toISOString()}/details` : '/production'}
        buttonIcon="bi-arrow-left"
      />
      <div className="container">
        <div className="card shadow-sm">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="currentShed" className="form-label">Current Shed</label>
                <input
                  type="text"
                  id="currentShed"
                  className="form-control"
                  value={currentShedNo || 'Loading...'}
                  readOnly
                />
              </div>

              <div className="mb-3">
                <label htmlFor="shed" className="form-label">New Shed</label>
                <StyledSelect
                  id="shed"
                  value={newShedId ? availableShedsOptions.find(o => o.value === newShedId) : null}
                  onChange={(option) => setNewShedId(option ? Number(option.value) : '')}
                  options={availableShedsOptions}
                  placeholder="Select a new shed"
                  isClearable
                  required
                />
              </div>

              <div className="mb-3">
                <label htmlFor="moveDate" className="form-label">Move Date</label>
                <CustomDatePicker
                  selected={moveDate}
                  onChange={(date: Date | null) => setMoveDate(date)}
                  dateFormat="dd-MM-yyyy"
                  className="form-control"
                  dropdownMode="select"
                  showMonthDropdown
                  showYearDropdown
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Moving...' : 'Move Batch'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default MoveShed;