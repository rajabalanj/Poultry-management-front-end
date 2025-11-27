import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../Layout/PageHeader';
import HeaderCardGroup from './HeaderCardGroup';
import GraphsSection from './GraphsSection';
import { dailyBatchApi, compositionApi } from '../../services/api';
import { DailyBatch } from '../../types/daily_batch';
import DatePicker from 'react-datepicker';
import ListModal from '../Common/ListModal';

const BATCH_DATE_KEY = 'dashboard_batch_date';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [batchDate, setBatchDate] = useState<string>(() => {
    return sessionStorage.getItem(BATCH_DATE_KEY) || new Date().toISOString().split('T')[0];
  });
  const [batches, setBatches] = useState<DailyBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedUsage, setFeedUsage] = useState<{ total_feed: number, feed_breakdown: { feed_type: string, amount: number, composition_name?: string, composition_items?: { inventory_item_id: number, inventory_item_name?: string, weight: number, unit?: string }[] }[] } | null>(null);
  const [feedLoading, setFeedLoading] = useState(false);
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

  useEffect(() => {
    const fetchBatches = async () => {
      setLoading(true);
      try {
        const data = await dailyBatchApi.getDailyBatches(batchDate);
        const batchesData: DailyBatch[] = Array.isArray(data)
          ? (data as DailyBatch[])
          : (data && Array.isArray((data as any).data))
          ? (data as any).data as DailyBatch[]
          : [];
        setBatches(batchesData);
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

  useEffect(() => {
    const fetchFeedUsage = async () => {
      setFeedLoading(true);
      try {
        const usage = await compositionApi.getFeedUsageByDate(batchDate);
        setFeedUsage(usage);
      } catch (err: any) {
        setFeedUsage(null);
      } finally {
        setFeedLoading(false);
      }
    };
    if (!loading) {
      fetchFeedUsage();
    }
  }, [batchDate, loading]);

  useEffect(() => {
    sessionStorage.setItem(BATCH_DATE_KEY, batchDate);
  }, [batchDate]);

  const totalBirds = batches.reduce((sum, b) => sum + (b.closing_count || 0), 0);
  const totalEggs = batches.reduce((sum, b) => sum + ((b.table_eggs || 0) + (b.jumbo || 0) + (b.cr || 0)), 0);
  const openingCount = batches.reduce((sum, b) => sum + (b.opening_count || 0), 0);
  const mortality = batches.reduce((sum, b) => sum + (b.mortality || 0), 0);
  const culls = batches.reduce((sum, b) => sum + (b.culls || 0), 0);
  const layerBatches = batches.filter(b => b.batch_type === 'Layer');
  const avgHD = layerBatches.length > 0 ? Number(((layerBatches.reduce((sum, b) => sum + (b.hd || 0), 0) / layerBatches.length) * 100).toFixed(2)) : 0;

  const cards = [
    {
      title: "Total Birds",
      mainValue: totalBirds,
      icon: "Bird",
      subValues: [
        { label: "Opening", value: openingCount },
        { label: "Mortality", value: mortality },
        { label: "Culls", value: culls }
      ]
    },
    {
      title: "Total Feed (kg)",
      mainValue: feedUsage ? feedUsage.total_feed : (feedLoading ? 0 : 0),
      icon: "Package",
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
      icon: "Egg",
      subValues: [
        { label: "Normal", value: batches.reduce((sum, b) => sum + (b.table_eggs || 0), 0) },
        { label: "Jumbo", value: batches.reduce((sum, b) => sum + (b.jumbo || 0), 0) },
        { label: "Crack", value: batches.reduce((sum, b) => sum + (b.cr || 0), 0) }
      ]
    }
  ];

  return (
    <>
      <PageHeader title="Dashboard" />
      <div className="container mt-4">
        <div className="row">
          <div className="col-md-3 mb-3 d-grid">
            <button className="btn btn-primary p-3" onClick={() => navigate('/production')} style={{ width: '100%' }}>
              <i className="bi bi-house-door-fill me-2"></i>
              Production
            </button>
          </div>
          <div className="col-md-3 mb-3 d-grid">
            <button className="btn btn-warning p-3" onClick={() => navigate('/production')} style={{ width: '100%' }}>
              <i className="bi bi-box-seam-fill me-2"></i>
              Inventory
            </button>
          </div>
          <div className="col-md-3 mb-3 d-grid">
            <button className="btn btn-success p-3" onClick={() => navigate('/purchase-orders/create')} style={{ width: '100%' }}>
              <i className="bi bi-cart-plus-fill me-2"></i>
              Purchase
            </button>
          </div>
          <div className="col-md-3 mb-3 d-grid">
            <button className="btn btn-info p-3" onClick={() => navigate('/sales-orders/create')} style={{ width: '100%' }}>
              <i className="bi bi-graph-up-arrow me-2"></i>
              Sales
            </button>
          </div>
        </div>
      </div>
      
      <div className="container mt-4">
        <div className="row g-3">
          <div className="col-12">
            <div className="card shadow-sm">
              <div className="card-body bg-light rounded">
                <div className="row g-3 align-items-end mb-3">
                  <div className="col-auto d-flex align-items-center bg-white p-2 rounded">
                    <label className="form-label me-3 mb-0">Batch Date</label>
                    <DatePicker
                      selected={batchDate ? new Date(batchDate) : null}
                      maxDate={new Date()}
                      onChange={(date: Date | null) => date && setBatchDate(date.toISOString().split('T')[0])}
                      dateFormat="dd-MM-yyyy"
                      className="form-control"
                    />
                  </div>
                </div>
                <HeaderCardGroup cards={cards} loading={loading} error={error} onViewDetails={handleViewFeedDetails} />
              </div>
            </div>
          </div>

          <div className="col-12">
            <div className="card shadow-sm bg-light rounded">
              <div className="card-body">
                <GraphsSection henDayValue={avgHD} loading={loading} error={error} />
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
    </>
  );
};

export default Dashboard;