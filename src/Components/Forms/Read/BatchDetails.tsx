import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dailyBatchApi } from '../../../services/api';
import { DailyBatch } from '../../../types/daily_batch';
import { toast } from 'react-toastify';
import PageHeader from '../../Layout/PageHeader';
import HeaderCardGroup from '../../Dashboard/HeaderCardGroup';
import GraphsSection from '../../Dashboard/GraphsSection';


const BatchDetails: React.FC = () => {
  const navigate = useNavigate();
  const { batch_id, batch_date } = useParams<{ batch_id: string; batch_date: string }>();
  // Get batch_date from query params or default to today
  const [batch, setBatch] = useState<DailyBatch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState<string>(batch_date || '');
  const [endDate, setEndDate] = useState<string>(batch_date || '');

  useEffect(() => {
    const fetchBatch = async () => {
      try {
        if (batch_id && batch_date) {
          // Fetch all daily batches for the date, then filter by batch_id
          const batches = await dailyBatchApi.getDailyBatches(batch_date);
          const found = batches.find(b => b.batch_id === Number(batch_id));
          if (found) {
            setBatch(found);
          } else {
            setBatch(null);
          }
        }
      } catch (error) {
        console.error('Error fetching daily batch:', error);
        toast.error('Failed to load batch details');
      } finally {
        setIsLoading(false);
      }
    };
    fetchBatch();
  }, [batch_id, batch_date]);

  const handleDownloadReport = () => {
    navigate(`/previous-day-report/${batch_id}?start=${startDate}&end=${endDate}`);
  };

  if (isLoading) {
    return <div className="text-center">Loading...</div>;
  }

  if (!batch) {
    return <div className="text-center">Batch not found</div>;
  }

  const totalEggs = (batch.table_eggs || 0) + (batch.jumbo || 0) + (batch.cr || 0);
  const formattedBatchDate = new Intl.DateTimeFormat('en-GB').format(new Date(batch.batch_date)).replace(/\//g, '-');


  return (
    <div className="container-fluid">
      <PageHeader 
        title={formattedBatchDate}
        subtitle={`Batch Details - ${batch.batch_no}`}
        buttonLabel="Back"
        buttonLink="/"
      />
      
      <HeaderCardGroup
        cards={[
          {
            title: 'Total Birds',
            mainValue: batch.closing_count,
            subValues: [
              { label: 'Opening Count', value: batch.opening_count },
              { label: 'Mortality', value: batch.mortality },
              { label: 'Culls', value: batch.culls },
            ],
            icon: 'bi bi-feather',
          },
          {
            title: 'Total Feed',
            mainValue: totalEggs,
            subValues: [
              { label: 'Chick Feed', value: 620 }, // Placeholder value
              { label: 'Layer Feed', value: 470 }, // Placeholder value
              { label: 'Grower Feed', value: 170 }, // Placeholder value
            ],
            icon:'bi-basket',
          },
          {
            title: 'Total Eggs',
            mainValue: totalEggs,
            subValues: [
              { label: 'Normal', value: batch.table_eggs || 0 },
              { label: 'Jumbo', value: batch.jumbo || 0 },
              { label: 'Crack', value: batch.cr || 0 },
            ],
            icon: 'bi-egg',
          },
        ]}
        loading={false}
        error={null}
      />
      <GraphsSection henDayValue={Number((batch.hd *100).toFixed(2))} loading={false} error={null} />
      <div className="p-4">
        <div className="row">
          {/* <div className="col-12 col-md-6">
            <div className="row g-3"> */}
              <div className="col-12 col-md-6 mb-4 mt-4">
                <label className="form-label">Shed No.</label>
                <input
                  type="string"
                  className="form-control"
                  value={batch.shed_no}
                  disabled
                />
              </div>
              <div className="col-12 col-md-6 mb-4 mt-4">
                <label className="form-label">Age</label>
                <input
                  type="text"
                  className="form-control"
                  value={batch.age}
                  disabled
                />
              </div>
              <div className="col-12 col-md-6 mb-4 mt-4">
                <label className="form-label">Standard Hen Day Percentage</label>
                <input
                  type="number"
                  className="form-control"
                  value={
                    batch.standard_hen_day_percentage !== undefined && batch.standard_hen_day_percentage !== null && !isNaN(Number(batch.standard_hen_day_percentage))
                      ? Number(batch.standard_hen_day_percentage).toFixed(2)
                      : ''
                  }
                  disabled
                />
              </div>
              <div className="col-12 col-md-6 mb-4 mt-4">
                <label className="form-label">Notes</label>
                <textarea
                  className="form-control"
                  value={batch.notes || ''}
                  disabled
                />
              </div>
              {/* Chick Batch Checkbox */}
              <div className="col-12 col-md-6 mb-4 mt-4">
                <div className="form-check mb-3">
                  <input
                    className="form-check-input border border-dark"
                    type="checkbox"
                    id="chickBatchCheckbox"
                    checked={!!batch.isChickBatch}
                    disabled
                  />
                  <label className="form-check-label" htmlFor="chickBatchCheckbox">
                    This is a Chick Batch
                  </label>
                </div>
              </div>
            {/* </div>
          </div> */}
        </div>
        <div className="mt-4 d-flex justify-content-center">
          <button type="button" className="btn btn-primary me-2" onClick={() => navigate(`/batch/${batch_id}/${batch_date}/edit`)}>
            Update
          </button>
          <button type="button" className="btn btn-secondary me-2" onClick={() => navigate('/')}>Back to Dashboard</button>
        </div>
      </div>
      <div className="row mb-4">
        <div className="col-12 col-md-3 mb-2">
          <label className="form-label">Start Date</label>
          <input
            type="date"
            className="form-control"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="col-12 col-md-3 mb-2">
          <label className="form-label">End Date</label>
          <input
            type="date"
            className="form-control"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div className="col-12 col-md-3 mb-2 mt-4">
          <button 
            className="btn btn-primary w-100 mt-2"
            onClick={handleDownloadReport}
            >
            View Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default BatchDetails;