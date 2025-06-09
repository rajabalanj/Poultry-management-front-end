import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderCardGroup from './HeaderCardGroup';
import GraphsSection from './GraphsSection';
import BatchTable from '../BatchTable';
import { batchApi } from '../../services/api';
import { BatchResponse } from '../../types/batch'; // Adjust the import path as necessary

const Dashboard = () => {
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [batches, setBatches] = useState<BatchResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleDownloadReport = () => {
    // Navigate with date range as query params
    navigate(`/previous-day-report?start=${startDate}&end=${endDate}`);
  };
  
  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const data = await batchApi.getBatches();
        setBatches(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching batches:', err);
        setError('Failed to load batches');
      } finally {
        setLoading(false);
      }
    };

    fetchBatches();
  }, []);


  const totalBirds = batches.reduce((sum, b) => sum + (b.calculated_closing_count || 0), 0);
  const totalEggs = batches.reduce((sum, b) => sum + ((b.table_eggs || 0) + (b.jumbo || 0) + (b.cr || 0)), 0);
  const openingCount = batches.reduce((sum, b) => sum + (b.opening_count || 0), 0);
  const mortality = batches.reduce((sum, b) => sum + (b.mortality || 0), 0);
  const culls = batches.reduce((sum, b) => sum + (b.culls || 0), 0);
  const avgHD = batches.length > 0 ? Number(((batches.reduce((sum, b) => sum + (b.HD || 0), 0) / batches.length) * 100).toFixed(2)) : 0;

  const cards = [
    {
      title: "Total Birds",
      mainValue: totalBirds,
      icon: "bi bi-feather",
      subValues: [
        { label: "Opening Count", value: openingCount },
        { label: "Mortality", value: mortality },
        { label: "Culls", value: culls }
      ]
    },
    {
      title: "Total Feed",
      mainValue: 1250, // Placeholder value
      icon: "bi bi-basket",
      subValues: [
        { label: "Chick Feed", value: 620 }, // Placeholder value
        { label: "Layer Feed", value: 470 },
        { label: "Grower Feed", value: 170 } // Placeholder value       
      ] // Placeholder values
    },
    {
      title: "Total Eggs",
      mainValue: totalEggs,
      icon: "bi bi-egg",
      subValues: [
        { label: "Normal", value: batches.reduce((sum, b) => sum + (b.table_eggs || 0), 0) },
        { label: "Jumbo", value: batches.reduce((sum, b) => sum + (b.jumbo || 0), 0) },
        { label: "Crack", value: batches.reduce((sum, b) => sum + (b.cr || 0), 0) }
      ]
    },
  ];

  return (
    <div className="container-fluid">
      {/* Date controls and buttons */}
      
      <HeaderCardGroup cards={cards} loading={loading} error={error} />
      <GraphsSection henDayValue={avgHD} loading={loading} error={error} />
      <div className="row mb-4">
        <div className="col">
          <div className="card shadow-sm">
            <div className="card-body">
              <h6 className="card-title mb-3">Batch Data</h6>
              <BatchTable batches={batches} loading={loading} error={error} />
            </div>
          </div>
        </div>
      </div>
      <div className="row mb-4">
        <div className="col-12 col-md-3 mb-2">
          <label className="form-label">Start Date:</label>
          <input
            type="date"
            className="form-control"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="col-12 col-md-3 mb-2">
          <label className="form-label">End Date:</label>
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

export default Dashboard;