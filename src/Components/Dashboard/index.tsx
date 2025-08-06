import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderCardGroup from './HeaderCardGroup';
import GraphsSection from './GraphsSection';
import BatchTable from '../BatchTable';
import { dailyBatchApi } from '../../services/api';
import { DailyBatch } from '../../types/daily_batch';
import { DateSelector } from '../DateSelector'; // Your component

const BATCH_DATE_KEY = 'dashboard_batch_date';

const DashboardIndex = () => {
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
  const [shedNos, setShedNos] = useState<string[]>([]);
  const [selectedShedNo, setSelectedShedNo] = useState<string>("");

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
        const uniqueShedNos = Array.from(new Set(data.map(b => b.shed_no)));
        setShedNos(uniqueShedNos);
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

  const filteredBatches = selectedShedNo
    ? batches.filter(b => b.shed_no === selectedShedNo)
    : batches;

  const totalBirds = filteredBatches.reduce((sum, b) => sum + (b.closing_count || 0), 0);
  const totalEggs = filteredBatches.reduce((sum, b) => sum + ((b.table_eggs || 0) + (b.jumbo || 0) + (b.cr || 0)), 0);
  const openingCount = filteredBatches.reduce((sum, b) => sum + (b.opening_count || 0), 0);
  const mortality = filteredBatches.reduce((sum, b) => sum + (b.mortality || 0), 0);
  const culls = filteredBatches.reduce((sum, b) => sum + (b.culls || 0), 0);
  const layerBatches = filteredBatches.filter(b => b.batch_type === 'Layer');
  const avgHD = layerBatches.length > 0 ? Number(((layerBatches.reduce((sum, b) => sum + (b.hd || 0), 0) / layerBatches.length) * 100).toFixed(2)) : 0;
  const cards = [
    {
      title: "Total Birds",
      mainValue: totalBirds,
      icon: "bi bi-feather",
      iconColor: "icon-color-birds",
      subValues: [
        { label: "Opening", value: openingCount },
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
        { label: "Normal", value: filteredBatches.reduce((sum, b) => sum + (b.table_eggs || 0), 0) },
        { label: "Jumbo", value: filteredBatches.reduce((sum, b) => sum + (b.jumbo || 0), 0) },
        { label: "Crack", value: filteredBatches.reduce((sum, b) => sum + (b.cr || 0), 0) }
      ]
    },
  ];

  return (
    <div className="container-fluid">
      <div className="row g-3">
        {/* Filters Section */}
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="row g-3 align-items-end">
                <div className="col-12 col-md-4">
                  <DateSelector
                    value={batchDate}
                    maxDate={new Date().toISOString().split('T')[0]}
                    onChange={(value) => setBatchDate(value)}
                    label='Batch Date'
                  />
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label">Shed Number</label>
                  <select
                    className="form-select"
                    value={selectedShedNo}
                    onChange={(e) => setSelectedShedNo(e.target.value)}
                  >
                    <option value="">All Sheds</option>
                    {shedNos.map(shedNo => (
                      <option key={shedNo} value={shedNo}>{shedNo}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Header Cards */}
        <div className="col-12">
          <HeaderCardGroup cards={cards} loading={loading} error={error} />
        </div>

        {/* Graphs Section */}
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-body">
              <GraphsSection henDayValue={avgHD} loading={loading} error={error} />
            </div>
          </div>
        </div>

        {/* Batch Table */}
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-body">
              <BatchTable batches={filteredBatches} loading={loading} error={error} />
            </div>
          </div>
        </div>

        {/* Report Download Section */}
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Report</h5>
              <div className="row g-3 align-items-end">
                <div className="col-12 col-md-4">
                  <DateSelector
                    label="Start Date"
                    value={startDate}
                    onChange={setStartDate}
                    maxDate={endDate}
                  />
                </div>
                <div className="col-12 col-md-4">
                  <DateSelector
                    label="End Date"
                    value={endDate}
                    onChange={setEndDate}
                    minDate={startDate}
                    maxDate={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="col-12 col-md-4">
                  <button
                    className="btn btn-info w-100 mb-2"
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardIndex;
