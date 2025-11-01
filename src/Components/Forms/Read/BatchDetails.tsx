import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dailyBatchApi } from '../../../services/api';
import { compositionApi } from '../../../services/api';
import { DailyBatch } from '../../../types/daily_batch';
import { toast } from 'react-toastify';
import PageHeader from '../../Layout/PageHeader';
import HeaderCardGroup from '../../Dashboard/HeaderCardGroup';
import GraphsSection from '../../Dashboard/GraphsSection';
import { DateSelector } from '../../DateSelector';
import ListModal from '../../Common/ListModal'; // Import ListModal
import Loading from '../../Common/Loading';
import { useEscapeKey } from '../../../hooks/useEscapeKey';

const BatchDetails: React.FC = () => {
  const navigate = useNavigate();
  const { batch_id, batch_date } = useParams<{ batch_id: string; batch_date: string }>();
  useEscapeKey();
  // Get batch_date from query params or default to today
  const [batch, setBatch] = useState<DailyBatch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState<string>(batch_date || '');
  const [endDate, setEndDate] = useState<string>(batch_date || '');
  const [reportType, setReportType] = useState('daily'); // 'daily' or 'weekly'
  const [week, setWeek] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>(batch_date || '');

  // Feed usage state
  const [feedUsage, setFeedUsage] = useState<{ total_feed: number, feed_breakdown: { feed_type: string, amount: number, composition_name?: string, composition_items?: { inventory_item_id: number, inventory_item_name?: string, weight: number, unit?: string }[] }[] } | null>(null);
  const [feedLoading, setFeedLoading] = useState(false);

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

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    if (batch_id && newDate) {
      // Format the date to match the expected URL format
      const date = new Date(newDate);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}T00:00:00+05:30`;
      navigate(`/batch/${batch_id}/${formattedDate}/details`);
    }
  };

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

  // Fetch feed usage for the batch and date
  useEffect(() => {
    const fetchFeedUsage = async () => {
      setFeedLoading(true);
      try {
        if (batch && batch.batch_id && batch.batch_date) {
          const feedUsageData = await compositionApi.getFeedUsageByDate(batch.batch_date, batch.batch_id);
          setFeedUsage(feedUsageData);
        } else {
          setFeedUsage(null);
        }
      } catch (err) {
        setFeedUsage(null);
      } finally {
        setFeedLoading(false);
      }
    };
    if (batch && batch.batch_id && batch.batch_date) {
      fetchFeedUsage();
    }
  }, [batch]);

  const handleDownloadReport = () => {
    if (reportType === 'weekly') {
      if (week && parseInt(week, 10) >= 18) {
        navigate(`/previous-day-report/${batch_id}?week=${week}`);
      } else if (week) {
        toast.error('Week number must be 18 or greater.');
      } else {
        toast.error('Please enter a week number for the weekly report.');
      }
    } else {
      navigate(`/previous-day-report/${batch_id}?start=${startDate}&end=${endDate}`);
    }
  };

  if (isLoading) {
    return <Loading message="Loading data..." />;
  }

  if (!batch) {
    return <div className="text-center">Batch not found</div>;
  }

  const totalEggs = (batch.table_eggs || 0) + (batch.jumbo || 0) + (batch.cr || 0);
  const formattedBatchDate = new Intl.DateTimeFormat('en-GB').format(new Date(batch.batch_date)).replace(/\//g, '-');


  return (
    <>
      <PageHeader 
        title={formattedBatchDate}
        subtitle={`Batch Details - ${batch.batch_no}`}
        buttonLabel="Back"
        buttonLink="/production"
      />
      <div className="container-fluid">
        <div className="col-12 mb-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Change Date</h5>
              <DateSelector
                label="Select Date"
                value={selectedDate}
                onChange={handleDateChange}
                maxDate={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
        </div>

        <HeaderCardGroup
          cards={[
            {
              title: 'Total Birds',
              mainValue: batch.closing_count,
              iconColor: "icon-color-birds",
              subValues: [
                { label: 'Opening', value: batch.opening_count },
                { label: 'Mortality', value: batch.mortality },
                { label: 'Culls', value: batch.culls },
              ],
              icon: 'bi bi-feather',
            },
            {
              title: 'Total Feed (kg)',
              mainValue: feedUsage ? feedUsage.total_feed : (feedLoading ? 0 : 0),
              iconColor: "icon-color-feed",
              subValues: feedUsage && feedUsage.feed_breakdown.length > 0
                ? feedUsage.feed_breakdown.map(fb => ({
                    label: fb.composition_name || fb.feed_type,
                    value: fb.amount,
                    // If composition_items exists, present them as a string list in subValue for modal display
                    subValue: fb.composition_items && fb.composition_items.length > 0
                      ? fb.composition_items.map(ci => `${ci.inventory_item_name || ci.inventory_item_id}: ${ci.weight}${ci.unit ? ` ${ci.unit}` : ''}`).join(', ')
                      : undefined,
                  }))
                : (feedLoading ? [{ label: 'Loading...', value: 0 }] : []),
              icon:'bi-basket',
            },
            {
              title: 'Total Eggs',
              mainValue: totalEggs,
              iconColor: "icon-color-eggs",
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
          onViewDetails={handleViewFeedDetails}
        />
        <GraphsSection henDayValue={Number((batch.hd *100).toFixed(2))} loading={false} error={null} />
        <div className="p-4">
          <div className="row">
            <div className="col-12 col-md-6 mb-4 mt-4">
              <label className="form-label">Shed No.</label>
              <input
                type="string"
                className="form-control"
                value={batch.shed_no}
                readOnly
              />
            </div>
            <div className="col-12 col-md-6 mb-4 mt-4">
              <label className="form-label">Age</label>
              <input
                type="text"
                className="form-control"
                value={batch.age}
                readOnly
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
                readOnly
              />
            </div>
            <div className="col-12 col-md-6 mb-4 mt-4">
              <label className="form-label">Notes</label>
              <textarea
                className="form-control"
                value={batch.notes || ''}
                readOnly
              />
            </div>
          </div>
          <div className="mt-4 d-flex justify-content-center">
            <button type="button" className="btn btn-primary me-2" onClick={() => navigate(`/batch/${batch_id}/${batch_date}/edit`)}>
              Update
            </button>
            <button type="button" className="btn btn-secondary me-2" onClick={() => navigate('/production')}>Back to Production</button>
          </div>
        </div>
        
        {/* Report Download Section */}
        <div className="col-12 mb-4 mt-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Report</h5>
              <div className="btn-group mb-4 mt-3" role="group" aria-label="Report type">
                <input
                  type="radio"
                  className="btn-check"
                  name="reportType"
                  id="dailyRadio"
                  autoComplete="off"
                  checked={reportType === 'daily'}
                  onChange={() => setReportType('daily')}
                />
                <label className="btn btn-outline-primary" htmlFor="dailyRadio">
                  Daily Report
                </label>

                <input
                  type="radio"
                  className="btn-check"
                  name="reportType"
                  id="weeklyRadio"
                  autoComplete="off"
                  checked={reportType === 'weekly'}
                  onChange={() => setReportType('weekly')}
                />
                <label className="btn btn-outline-primary" htmlFor="weeklyRadio">
                  Weekly Report
                </label>
              </div>
              <div className="row g-3 align-items-end">
                {reportType === 'daily' ? (
                  <>
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
                  </>
                ) : (
                  <div className="col-12 col-md-8">
                    <label className="form-label">Week</label>
                    <input
                      type="number"
                      className="form-control"
                      value={week}
                      onChange={(e) => setWeek(e.target.value)}
                      placeholder="e.g., 18"
                    />
                  </div>
                )}
                <div className="col-12 col-md-4">
                  <button
                    className="btn btn-primary w-100 mb-2"
                    onClick={handleDownloadReport}
                  >
                    View Data
                  </button>
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
    </>
  );
};

export default BatchDetails;