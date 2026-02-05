import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dailyBatchApi, shedApi, configApi } from '../../../services/api';
import { compositionApi } from '../../../services/api';
import { DailyBatch } from '../../../types/daily_batch';
import { ShedResponse } from '../../../types/shed';
import { toast } from 'react-toastify';
import PageHeader from '../../Layout/PageHeader';
import HeaderCardGroup from '../../Dashboard/HeaderCardGroup';
import GraphsSection from '../../Dashboard/GraphsSection';
import ListModal from '../../Common/ListModal'; // Import ListModal
import CustomDatePicker from '../../Common/CustomDatePicker';
import Loading from '../../Common/Loading';
import { useEscapeKey } from '../../../hooks/useEscapeKey';

interface UsageHistoryItem {
  id: number;
  composition_name: string;
  times: number;
}

const BatchDetails: React.FC = () => {
  const navigate = useNavigate();
  const { batch_id, batch_date } = useParams<{ batch_id: string; batch_date: string }>();
  useEscapeKey();
  // Get batch_date from query params or default to today
  const [batch, setBatch] = useState<DailyBatch | null>(null);
  const [sheds, setSheds] = useState<ShedResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState<string>(batch_date || '');
  const [endDate, setEndDate] = useState<string>(batch_date || '');
  const [reportType, setReportType] = useState('daily'); // 'daily' or 'weekly'
  const [week, setWeek] = useState('');
  const [usageHistory, setUsageHistory] = useState<UsageHistoryItem[]>([]);
  const [henDayDeviation, setHenDayDeviation] = useState(0);
  

  // Feed usage state
  const [feedUsage, setFeedUsage] = useState<{ total_feed: number, feed_breakdown: { feed_type: string, amount: number, composition_name?: string, composition_items?: { inventory_item_id: number, inventory_item_name?: string, weight: number, unit?: string }[] }[] } | null>(null);
  const [feedLoading, setFeedLoading] = useState(false);

  // Modal state for feed details
  const [showFeedModal, setShowFeedModal] = useState(false);
  const [feedModalTitle, setFeedModalTitle] = useState('');
  const [feedModalItems, setFeedModalItems] = useState<string[]>([]);

  useEffect(() => {
    const fetchHenDayDeviation = async () => {
      try {
        const config = await configApi.getAllConfigs('henDayDeviation');
        if (config && config.length > 0) {
          setHenDayDeviation(parseFloat(config[0].value) || 0);
        }
      } catch (error) {
        console.error("Failed to fetch hen day deviation config", error);
      }
    };
    const fetchSheds = async () => {
      try {
        const availableSheds = await shedApi.getSheds();
        setSheds(availableSheds);
      } catch (error) {
        console.error('Failed to fetch sheds:', error);
      }
    };
    fetchHenDayDeviation();
    fetchSheds();
  }, []);

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

  const handleDateChange = (newDate: Date | null) => {
    if (batch_id && newDate) {
      const formattedDate = newDate.toISOString().split('T')[0];
      navigate(`/batch/${batch_id}/${formattedDate}/details`);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!batch_id || !batch_date) {
        setBatch(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setFeedLoading(true);

      try {
        const formattedDate = new Date(batch_date).toISOString().split('T')[0];

        // These can run in parallel
        const [batches, history, feedUsageData] = await Promise.all([
          dailyBatchApi.getDailyBatches(formattedDate),
          compositionApi.getFilteredCompositionUsageHistory(
            formattedDate,
            Number(batch_id)
          ),
          compositionApi.getFeedUsageByDate(formattedDate, Number(batch_id))
        ]);

        setUsageHistory(history);
        setFeedUsage(feedUsageData);

        const foundBatch = batches.find(b => b.batch_id === Number(batch_id));
        if (foundBatch) {
          setBatch(foundBatch);
        } else {
          setBatch(null);
        }
      } catch (error) {
        console.error('Error fetching batch details:', error);
        toast.error('Failed to load batch details');
        setBatch(null);
        setUsageHistory([]);
        setFeedUsage(null);
      } finally {
        setIsLoading(false);
        setFeedLoading(false);
      }
    };
    fetchData();
  }, [batch_id, batch_date]);

  // Helper function to get shed number by shed ID
  const getShedNumber = (shedId: number | undefined) => {
    if (!shedId) return 'No Shed';
    const shed = sheds.find(s => s.id === shedId);
    return shed ? shed.shed_no : 'Unknown Shed';
  };

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

  return (
    <>
      <PageHeader 
        subtitle={`View ${batch.batch_no}`}
        buttonLabel="Back"
        buttonLink="/production"
        buttonIcon="bi-arrow-left"
      />
      <div className="container">
        <div className="card shadow-sm mb-4">
          <div className="card-body p-4">
            <div className="mb-4">
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <div className="d-flex align-items-center">
                    <label className="form-label me-3 mb-0">Batch Date</label>
                    <div style={{ maxWidth: "200px" }}>
                      <CustomDatePicker
                        selected={batch_date ? new Date(batch_date) : null}
                        onChange={(date: Date | null) => handleDateChange(date)}
                        maxDate={new Date()}
                        placeholderText="Select a date"
                        className="w-100"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mb-4">
              <HeaderCardGroup
            cards={[
            {
              title: 'Total Birds',
              mainValue: batch.closing_count,

              subValues: [
                { label: 'Opening', value: batch.opening_count },
                { label: 'Mortality', value: batch.mortality },
                { label: 'Culls', value: batch.culls },
                { label: "Birds Added", value: batch.birds_added }
              ],
              icon: 'Bird',
            },
            {
              title: 'Total Feed (kg)',
              mainValue: feedUsage ? feedUsage.total_feed : (feedLoading ? 0 : 0),

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
              icon:'Package',
            },
            {
              title: 'Total Eggs',
              mainValue: totalEggs,

              subValues: [
                { label: 'Normal', value: batch.table_eggs || 0 },
                { label: 'Jumbo', value: batch.jumbo || 0 },
                { label: 'Crack', value: batch.cr || 0 },
              ],
              icon: 'Egg',
            },
          ]}
          loading={false}
          error={null}
          onViewDetails={handleViewFeedDetails}
            />
            </div>
            <div className="mb-4">
              <GraphsSection 
                henDayValue={Number((batch.hd * 100).toFixed(2))} 
                standardHenDayPercentage={batch.standard_hen_day_percentage}
                henDayDeviation={henDayDeviation}
                loading={false} 
                error={null} 
              />
            </div>
            <div>
          <div className="row">
            <div className="col-12 col-md-6 mb-4 mt-4">
              <label className="form-label">Shed No.</label>
              <input
                type="string"
                className="form-control is-readonly"
                value={getShedNumber(batch.shed_id)}
                readOnly
              />
            </div>
            <div className="col-12 col-md-6 mb-4 mt-4">
              <label className="form-label">Age</label>
              <input
                type="number"
                className="form-control is-readonly"
                value={batch.age}
                readOnly
                step="0.1"
              />
            </div>
            <div className="col-12 col-md-6 mb-4 mt-4">
              <label className="form-label">Standard Hen Day Percentage</label>
              <input
                type="number"
                className="form-control is-readonly"
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
                className="form-control is-readonly"
                value={batch.notes || ''}
                readOnly
              />
            </div>
          </div>
                    <div className="row mt-4">
                      <div className="col-12">
                          {usageHistory.length > 0 && (
                              <div>
                                  <h5 className="mb-3">Feed Usage for this day</h5>
                                  <div className="table-responsive">
                                      <table className="table table-sm table-bordered">
                                          <thead>
                                              <tr>
                                                  <th>Composition</th>
                                                  <th>Times Used</th>
                                              </tr>
                                          </thead>
                                          <tbody>
                                              {usageHistory.map((item) => (
                                                  <tr key={item.id}>
                                                      <td>{item.composition_name}</td>
                                                      <td>{item.times}</td>
                                                  </tr>
                                              ))}
                                          </tbody>
                                      </table>
                                  </div>
                              </div>
                          )}
                      </div>
                    </div>
                    <div className="mt-4 d-flex justify-content-start">
                      <button type="button" className="btn btn-primary me-2" onClick={() => navigate(`/batch/${batch_id}/${batch_date}/edit`)} disabled={batch.is_active === false}>
                        Update
                      </button>
                      <button type="button" className="btn btn-info me-2" onClick={() => navigate(`/batch/${batch_id}/move-shed`)}>
                        Move Shed
                      </button>
                      <button type="button" className="btn btn-secondary me-2" onClick={() => navigate('/production')}>
                        Back to Production
                      </button>
                    </div>
                  </div>
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
                    <div className="col-auto d-flex align-items-center mt-3">
            <label className="form-label me-3 mb-0">Start Date</label>
                      <CustomDatePicker
                        selected={startDate ? new Date(startDate) : null}
                        onChange={(date: Date | null) => date && setStartDate(date.toISOString().split('T')[0])}
                        maxDate={endDate ? new Date(endDate) : new Date()}
                        showMonthDropdown
                        showYearDropdown
                        dropdownMode="select"
                        dateFormat="dd-MM-yyyy"
                        className="form-control"
                      />
                    </div>
                    <div className="col-auto d-flex align-items-center mt-3">
            <label className="form-label me-3 mb-0">End Date</label>
                      <CustomDatePicker
                        selected={endDate ? new Date(endDate) : null}
                        onChange={(date: Date | null) => date && setEndDate(date.toISOString().split('T')[0])}
                        minDate={startDate ? new Date(startDate) : undefined}
                        showMonthDropdown
                        showYearDropdown
                        dropdownMode="select"
                        maxDate={new Date()}
                        dateFormat="dd-MM-yyyy"
                        className="form-control"
                      />
                    </div>
                  </>
                ) : (
                  <div className="col-12 col-md-4">
                    <label className="form-label">Week</label>
                    <input
                      type="number"
                      className="form-control"
                      value={week}
                      onChange={(e) => setWeek(e.target.value)}
                      placeholder="e.g., 20"
                    />
                  </div>
                )}
                <div className="col-12 col-md-4 d-flex align-items-end justify-content-start justify-content-md-start">
                  <button
                    className="btn btn-primary mb-2"
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
