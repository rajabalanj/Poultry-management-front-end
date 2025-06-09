import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { batchApi } from '../../../services/api';
import { BatchResponse } from '../../../types/batch'; // Adjust the import path as necessary
import { toast } from 'react-toastify';
import PageHeader from '../../Layout/PageHeader';
import HeaderCardGroup from '../../Dashboard/HeaderCardGroup';
import GraphsSection from '../../Dashboard/GraphsSection';


const BatchDetails: React.FC = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const [batch, setBatch] = useState<BatchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const fetchBatch = async () => {
      try {
        if (batchId) {
          const data = await batchApi.getBatch(Number(batchId));
          setBatch(data);
        }
      } catch (error) {
        console.error('Error fetching batch:', error);
        toast.error('Failed to load batch details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBatch();
  }, [batchId]);

  const handleDownloadReport = () => {
    // Navigate with both batchId and date range
    navigate(`/previous-day-report/${batchId}?start=${startDate}&end=${endDate}`);
  };

  if (isLoading) {
    return <div className="text-center">Loading...</div>;
  }

  if (!batch) {
    return <div className="text-center">Batch not found</div>;
  }

  const totalEggs = (batch.table_eggs || 0) + (batch.jumbo || 0) + (batch.cr || 0);

  return (
    <div className="container-fluid">
      <PageHeader 
        title={new Intl.DateTimeFormat('en-GB').format(new Date()).replace(/\//g, '-')}
        subtitle={`Batch Details - ${batch.batch_no}`}
        buttonLabel="Back"
        buttonLink="/"
      />
      
      <HeaderCardGroup
        cards={[
          {
            title: 'Total Birds',
            mainValue: batch.calculated_closing_count,
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
      <GraphsSection henDayValue={Number((batch.HD *100).toFixed(2))} loading={false} error={null} />
      <div className="p-4">
        <div className="row justify-content-center">
          <div className="col-12 col-md-6">
            <div className="mb-4">
              <label className="form-label">Shed No.</label>
              <input
                type="string"
                className="form-control"
                value={batch.shed_no}
                disabled
              />
            </div>

            <div className="mb-4">
              <label className="form-label">Age</label>
              <input
                type="text"
                className="form-control"
                value={batch.age}
                disabled
              />
            </div>
          </div>
        </div>
        <div className="mt-4 d-flex justify-content-center">
          <button type="button" className="btn btn-primary me-2" onClick={() => navigate(`/batch/${batchId}/edit`)}>
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
        <div className="col-12 col-md-3 mb-2">
          <button 
            className="btn btn-primary w-100"
            onClick={handleDownloadReport}
            >
            Download Report
          </button>
          </div>
      </div>
    </div>
  );
};

export default BatchDetails;