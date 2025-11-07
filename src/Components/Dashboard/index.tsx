import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderCardGroup from './HeaderCardGroup';
import GraphsSection from './GraphsSection';
import BatchTable from '../BatchTable';
import { dailyBatchApi, compositionApi } from '../../services/api';
import { DailyBatch } from '../../types/daily_batch';
import { DateSelector } from '../DateSelector'; // Your component
import ListModal from '../Common/ListModal'; // Import ListModal

const BATCH_DATE_KEY = 'dashboard_batch_date';

const DashboardIndex = () => {
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [batchDate, setBatchDate] = useState<string>(() => {
    return sessionStorage.getItem(BATCH_DATE_KEY) || new Date().toISOString().split('T')[0];
  });
  const [batches, setBatches] = useState<DailyBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRangeError, setDateRangeError] = useState<string | null>(null); // State for validation error
  const [shedNos, setShedNos] = useState<string[]>([]);
  const [selectedShedNo, setSelectedShedNo] = useState<string>("");
  // Feed usage state
  const [feedUsage, setFeedUsage] = useState<{ total_feed: number, feed_breakdown: { feed_type: string, amount: number, composition_name?: string, composition_items?: { inventory_item_id: number, inventory_item_name?: string, weight: number, unit?: string }[] }[] } | null>(null);
  const [feedLoading, setFeedLoading] = useState(false);
  // Removed unused feedError

  // Modal state for feed details
  const [showFeedModal, setShowFeedModal] = useState(false);
  const [feedModalTitle, setFeedModalTitle] = useState('');
  const [feedModalItems, setFeedModalItems] = useState<string[]>([]);

  const handleViewFeedDetails = (title: string, items: string[]) => {
    setFeedModalTitle(title);
    setFeedModalItems(items);
    setShowFeedModal(true);
  };

  const handleCloseFeedModal = () => {
    setShowFeedModal(false);
    setFeedModalTitle('');
    setFeedModalItems([]);
  };

  const handleDownloadReport = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      setDateRangeError('End Date cannot be before Start Date.');
      return;
    } else {
      setDateRangeError(null);
    }

    const selectedBatch = batches.find(b => b.shed_no === selectedShedNo);
    if (selectedShedNo && selectedBatch) {
      navigate(`/previous-day-report/${selectedBatch.batch_id}?start=${startDate}&end=${endDate}`);
    } else {
      navigate(`/previous-day-report?start=${startDate}&end=${endDate}`);
    }
  };

  useEffect(() => {
    const fetchBatches = async () => {
      setLoading(true);
      try {
        const data = await dailyBatchApi.getDailyBatches(batchDate);
        // Normalize response: API might return [], null, or an object containing the array.
        const batchesData: DailyBatch[] = Array.isArray(data)
          ? (data as DailyBatch[])
          : (data && Array.isArray((data as any).data))
            ? (data as any).data as DailyBatch[]
            : [];

        setBatches(batchesData);

        // Derive shed numbers from the sanitized batches array to avoid calling map on non-arrays
        const shedList = batchesData
          .map((b: DailyBatch) => b.shed_no)
          .filter((s): s is string => typeof s === 'string' && s !== '');
        const uniqueShedNos = Array.from(new Set(shedList));
        setShedNos(uniqueShedNos);
        // Clear any previous error if fetch succeeded
        setError(null);
      } catch (err) {
        console.error('Error fetching batches:', err);
        setError('Failed to load batches');
      } finally {
        setLoading(false);
      }
    };
    fetchBatches();
  }, [batchDate]);

  // Fetch feed usage for the selected batchDate and shed
  useEffect(() => {
    const fetchFeedUsage = async () => {
      setFeedLoading(true);
      try {
        // If shed is selected, try to get batch_id for that shed
        let batchId: number | undefined = undefined;
        if (selectedShedNo) {
          const batch = batches.find(b => b.shed_no === selectedShedNo);
          if (batch) batchId = batch.batch_id;
        }
        const usage = await compositionApi.getFeedUsageByDate(batchDate, batchId);
        setFeedUsage(usage);
      } catch (err: any) {
        setFeedUsage(null);
      } finally {
        setFeedLoading(false);
      }
    };
    // Only fetch if batches are loaded
    if (!loading) {
      fetchFeedUsage();
    }
  }, [batchDate, selectedShedNo, batches, loading]);

  useEffect(() => {
    sessionStorage.setItem(BATCH_DATE_KEY, batchDate);
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
      title: "Total Feed (kg)",
      mainValue: feedUsage ? feedUsage.total_feed : (feedLoading ? 0 : 0),
      icon: "bi bi-basket",
      iconColor: "icon-color-feed",
      subValues: feedUsage && feedUsage.feed_breakdown.length > 0
        ? feedUsage.feed_breakdown.map(fb => ({
            label: fb.composition_name || fb.feed_type,
            value: fb.amount,
            subValue: fb.composition_items && fb.composition_items.length > 0
              ? fb.composition_items.map(ci => `${ci.inventory_item_name || ci.inventory_item_id}: ${ci.weight}${ci.unit ? ` ${ci.unit}` : ''}`).join(', ')
              : undefined,
          }))
        : (feedLoading ? [{ label: 'Loading...', value: 0 }] : [])
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
                    defaultValue={batchDate}
                    maxDate={new Date().toISOString().split('T')[0]}
                    onChange={(value) => setBatchDate(value)}
                    label='Batch Date'
                  />
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label fw-semibold">Shed Number</label>
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
          <HeaderCardGroup cards={cards} loading={loading} error={error} onViewDetails={handleViewFeedDetails} />
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
              {loading ? (
                <div className="text-center">Loading batches...</div>
              ) : error ? (
                <div className="text-center text-danger">{error}</div>
              ) : filteredBatches.length > 0 ? (
                <BatchTable batches={filteredBatches} loading={loading} error={error} />
              ) : (<div className="text-center">No batches found for the selected filters.</div>)}
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
                    defaultValue={startDate}
                    onChange={setStartDate}
                    maxDate={endDate}
                  />
                </div>
                <div className="col-12 col-md-4">
                  <DateSelector
                    label="End Date"
                    defaultValue={endDate}
                    onChange={setEndDate}
                    minDate={startDate}
                    maxDate={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="col-md-4 d-flex justify-content-center justify-content-md-end">
                  <button
                    className="btn btn-primary mb-2"
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

      <ListModal
        show={showFeedModal}
        onHide={handleCloseFeedModal}
        title={feedModalTitle}
        items={feedModalItems}
      />
    </div>
  );
};

export default DashboardIndex;
