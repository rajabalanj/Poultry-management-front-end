import React, { useState, useEffect } from 'react';
import HeaderCardGroup from './HeaderCardGroup';
import GraphsSection from './GraphsSection';
import BatchTable from '../BatchTable';
import { batchApi, Batch } from '../../services/api';

const Dashboard: React.FC = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

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

  const handleDownload = async () => {
    try {
      await batchApi.getDailyReportExcel(startDate, endDate);
      alert('Report downloaded successfully!');
    } catch (err) {
      console.error('Error downloading report:', err);
      alert('Failed to download report.');
    }
  };

  const totalBirds = batches.reduce((sum, b) => sum + (b.calculated_closing_count || 0), 0);
  const totalEggs = batches.reduce((sum, b) => sum + ((b.table || 0) + (b.jumbo || 0) + (b.cr || 0)), 0);
  const openingCount = batches.reduce((sum, b) => sum + (b.opening_count || 0), 0);
  const mortality = batches.reduce((sum, b) => sum + (b.mortality || 0), 0);
  const culls = batches.reduce((sum, b) => sum + (b.culls || 0), 0);

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
        { label: "Normal", value: batches.reduce((sum, b) => sum + (b.table || 0), 0) },
        { label: "Jumbo", value: batches.reduce((sum, b) => sum + (b.jumbo || 0), 0) },
        { label: "Crack", value: batches.reduce((sum, b) => sum + (b.cr || 0), 0) }
      ]
    },
  ];

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col">
          <div className="d-flex align-items-center gap-3 mb-4">
            <div>
              <label htmlFor="start-date" className="form-label">Start Date:</label>
              <input
                type="date"
                id="start-date"
                className="form-control"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="end-date" className="form-label">End Date:</label>
              <input
                type="date"
                id="end-date"
                className="form-control"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <button className="btn btn-primary mt-4" onClick={handleDownload}>Download</button>
          </div>
        </div>
      </div>
      <HeaderCardGroup cards={cards} loading={loading} error={error} />
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
      <GraphsSection />
    </div>
  );
};

export default Dashboard;