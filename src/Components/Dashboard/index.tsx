import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderCardGroup from './HeaderCardGroup';
import GraphsSection from './GraphsSection';
import BatchTable from '../BatchTable';
import { dailyBatchApi } from '../../services/api';
import { DailyBatch } from '../../types/daily_batch';
import { DateSelector } from '../DateSelector'; // Your component

const BATCH_DATE_KEY = 'dashboard_batch_date';

const Dashboard = () => {
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [batchDate, setBatchDate] = useState<string>(() => {
    return localStorage.getItem(BATCH_DATE_KEY) || new Date().toISOString().split('T')[0];
  });
  const [batches, setBatches] = useState<DailyBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRangeError, setDateRangeError] = useState<string | null>(null); // State for validation error

  const handleDownloadReport = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      setDateRangeError('End Date cannot be before Start Date.');
      return;
    } else {
      setDateRangeError(null);
    }
    navigate(`/previous-day-report?start=${startDate}&end=${endDate}`);
  };

  useEffect(() => {
    const fetchBatches = async () => {
      setLoading(true);
      try {
        const data = await dailyBatchApi.getDailyBatches(batchDate);
        setBatches(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching batches:', err);
        setError('Failed to load batches');
      } finally {
        setLoading(false);
      }
    };

    fetchBatches();
  }, [batchDate]);

  useEffect(() => {
    localStorage.setItem(BATCH_DATE_KEY, batchDate);
  }, [batchDate]);

  const totalBirds = batches.reduce((sum, b) => sum + (b.closing_count || 0), 0);
  const totalEggs = batches.reduce((sum, b) => sum + ((b.table_eggs || 0) + (b.jumbo || 0) + (b.cr || 0)), 0);
  const openingCount = batches.reduce((sum, b) => sum + (b.opening_count || 0), 0);
  const mortality = batches.reduce((sum, b) => sum + (b.mortality || 0), 0);
  const culls = batches.reduce((sum, b) => sum + (b.culls || 0), 0);
  const avgHD = batches.length > 0 ? Number(((batches.reduce((sum, b) => sum + (b.hd || 0), 0) / batches.length) * 100).toFixed(2)) : 0;

  const cards = [
    {
      title: "Total Birds",
      mainValue: totalBirds,
      icon: "bi bi-feather",
      iconColor: "icon-color-birds",
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
      iconColor: "icon-color-feed",
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
      iconColor: "icon-color-eggs",
      subValues: [
        { label: "Normal", value: batches.reduce((sum, b) => sum + (b.table_eggs || 0), 0) },
        { label: "Jumbo", value: batches.reduce((sum, b) => sum + (b.jumbo || 0), 0) },
        { label: "Crack", value: batches.reduce((sum, b) => sum + (b.cr || 0), 0) }
      ]
    },
  ];

  return (
    <div className="container-fluid">
      {/* Date picker for batch_date */}
      <div className="row mb-4">
        <div className="col-12 col-md-3 mb-2">
          <DateSelector
            value={batchDate}
            maxDate={new Date().toISOString().split('T')[0]}
            onChange={(value) => setBatchDate(value)}
            label='Batch Date'
          />
        </div>
      </div>
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
      {/* Use DateSelector for Start and End Dates */}
      <div className="row mb-4 align-items-end">
        <div className="col-12 col-md-3 mb-2">
          <DateSelector
            label="Start Date"
            value={startDate}
            onChange={setStartDate}
            maxDate={endDate} // Dynamically set maxDate for Start Date
          />
        </div>
        <div className="col-12 col-md-3 mb-2">
          <DateSelector
            label="End Date"
            value={endDate}
            onChange={setEndDate}
            minDate={startDate} // You'd need to add minDate prop to DateSelector
            maxDate={new Date().toISOString().split('T')[0]} // End Date can't be in the future
          />
        </div>
        <div className="col-12 col-md-3 mb-2 mt-3">
          <button
            className="btn btn-primary w-100 mt-2"
            onClick={handleDownloadReport}
          >
            View Data
          </button>
          {dateRangeError && (
            <div className="text-danger mt-2">
              {dateRangeError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;