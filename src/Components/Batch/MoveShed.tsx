import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { batchApi, shedApi } from '../../services/api';
import { ShedResponse } from '../../types/shed';
import { toast } from 'react-toastify';
import PageHeader from '../Layout/PageHeader';
import Loading from '../Common/Loading';
import CustomDatePicker from '../Common/CustomDatePicker';
import StyledSelect from '../Common/StyledSelect';

const MoveShed: React.FC = () => {
  const { batch_id } = useParams<{ batch_id: string }>();
  const navigate = useNavigate();
  const [sheds, setSheds] = useState<ShedResponse[]>([]);
  const [newShedId, setNewShedId] = useState<number | ''>('');
  const [moveDate, setMoveDate] = useState<Date | null>(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchSheds = async () => {
      try {
        const availableSheds = await shedApi.getSheds();
        setSheds(availableSheds);
      } catch (error) {
        toast.error('Failed to fetch sheds.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSheds();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batch_id || newShedId === '' || !moveDate) {
      toast.error('Please select a new shed and a move date.');
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
    return <Loading message="Loading sheds..." />;
  }

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
                <label htmlFor="shed" className="form-label">New Shed</label>
                <StyledSelect
                  id="shed"
                  value={newShedId ? sheds.find(shed => shed.id === newShedId) ? { value: newShedId, label: sheds.find(shed => shed.id === newShedId)?.shed_no || "" } : null : null}
                  onChange={(option) => setNewShedId(option ? Number(option.value) : '')}
                  options={sheds.map((shed) => ({
                    value: shed.id,
                    label: shed.shed_no
                  }))}
                  placeholder="Select a shed"
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
