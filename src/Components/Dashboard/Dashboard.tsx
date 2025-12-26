import React, { useState, useEffect } from 'react';
import PageHeader from '../Layout/PageHeader';
import { dailyBatchApi, compositionApi, reportsApi } from '../../services/api';
import { DailyBatch } from '../../types/daily_batch';
import CustomDatePicker from '../Common/CustomDatePicker';
import Loading from '../Common/Loading';
import * as Icons from 'lucide-react';
import EggProductionGraph from './EggProductionGraph';
import CompositionUsagePieChart from './CompositionUsagePieChart';

const BATCH_DATE_KEY = 'dashboard_batch_date';

const Dashboard: React.FC = () => {
  // State for daily stats
  const [batchDate, setBatchDate] = useState<string>(() => {
    return sessionStorage.getItem(BATCH_DATE_KEY) || new Date().toISOString().split('T')[0];
  });
  const [batches, setBatches] = useState<DailyBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedUsage, setFeedUsage] = useState<{ total_feed: number } | null>(null);
  const [feedLoading, setFeedLoading] = useState(false);

  // State for Graphs
  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 6);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dateRangeError, setDateRangeError] = useState<string | null>(null);

  // State for Egg Production Trend Graph
  const [eggTrendData, setEggTrendData] = useState<{ month: string; total_eggs: number }[]>([]);
  const [eggTrendLoading, setEggTrendLoading] = useState(true);
  const [eggTrendError, setEggTrendError] = useState<string | null>(null);
  
  // State for Composition Usage Pie Chart
  const [compositionUsageData, setCompositionUsageData] = useState<{ composition_name: string; total_usage: number; unit: string }[]>([]);
  const [compositionUsageLoading, setCompositionUsageLoading] = useState(true);
  const [compositionUsageError, setCompositionUsageError] = useState<string | null>(null);


  // Effect for daily stats
  useEffect(() => {
    const fetchBatches = async () => {
      setLoading(true);
      try {
        const data = await dailyBatchApi.getDailyBatches(batchDate);
        const batchesData: DailyBatch[] = Array.isArray(data) ? data : (data && Array.isArray((data as any).data)) ? (data as any).data : [];
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

    // Effect for Graphs
    useEffect(() => {
      const start = new Date(startDate);
      const end = new Date(endDate);
  
      if (start > end) {
        setDateRangeError('End Date cannot be before Start Date.');
        setEggTrendData([]);
        setCompositionUsageData([]); // Clear data for pie chart as well
        return;
      }
      setDateRangeError(null);
  
      // Fetch egg trend data
      const fetchEggTrendData = async () => {
        setEggTrendLoading(true);
        setEggTrendError(null);
        try {
          const apiData = await reportsApi.getMonthlyEggProduction(startDate, endDate);
          const getMonthsInRange = (start: Date, end: Date) => {
            const months = [];
            let current = new Date(start.getFullYear(), start.getMonth(), 1);
            while (current <= end) {
              months.push(current.toISOString().slice(0, 7)); // "YYYY-MM"
              current.setMonth(current.getMonth() + 1);
            }
            return months;
          };
          const allMonths = getMonthsInRange(start, end);
          const dataMap = new Map(apiData.map(item => [item.month, item.total_eggs]));
          let processedData = allMonths.map(month => ({
            month,
            total_eggs: dataMap.get(month) || 0,
          }));

          // If there's API data, ensure we don't show leading empty months
          // that are outside the range of the actual data.
          if (apiData.length > 0) {
            // Assuming apiData is sorted by month, which it should be for a trend report.
            const firstApiMonth = apiData[0].month;
            const firstDataIndex = processedData.findIndex(item => item.month === firstApiMonth);
            
            if (firstDataIndex > 0) {
              processedData = processedData.slice(firstDataIndex);
            }
          }

          setEggTrendData(processedData);
        } catch (err) {
          setEggTrendError('Failed to load egg production data.');
          console.error(err);
        } finally {
          setEggTrendLoading(false);
        }
      };
      
      // Fetch composition usage data
      const fetchCompositionUsageData = async () => {
          setCompositionUsageLoading(true);
          setCompositionUsageError(null);
          try {
              const apiData = await reportsApi.getCompositionUsageReport(startDate, endDate);
              // Filter out items with zero usage to avoid cluttering the pie chart
              const filteredReport = apiData.report.filter(item => item.total_usage > 0);
              setCompositionUsageData(filteredReport);
          } catch (err) {
              setCompositionUsageError('Failed to load composition usage data.');
              console.error(err);
          } finally {
              setCompositionUsageLoading(false);
          }
      };
  
      fetchEggTrendData();
      fetchCompositionUsageData();
  
    }, [startDate, endDate]);


  const totalBirds = batches.reduce((sum, b) => sum + (b.closing_count || 0), 0);
  const totalEggs = batches.reduce((sum, b) => sum + ((b.table_eggs || 0) + (b.jumbo || 0) + (b.cr || 0)), 0);
  const layerBatches = batches.filter(b => b.batch_type === 'Layer');
  const avgHD = layerBatches.length > 0 ? Number(((layerBatches.reduce((sum, b) => sum + (b.hd || 0), 0) / layerBatches.length) * 100).toFixed(2)) : 0;

  const dashboardStats = [
    { title: "Total Birds", value: totalBirds, unit: '', icon: 'Bird' },
    { title: "Total Eggs", value: totalEggs, unit: '', icon: 'Egg' },
    { title: "Total Feed", value: feedUsage ? feedUsage.total_feed : 0, unit: ' kg', icon: 'Package' },
    { title: "Hen Day %", value: avgHD, unit: '%', icon: 'Percent' }
  ];

  return (
    <>
      <PageHeader title="Dashboard" />
      <div className="mb-3">
        <div className="col-auto d-flex align-items-center bg-white p-2 rounded shadow-sm" style={{maxWidth: '250px'}}>
            <label className="form-label me-2 mb-0 fw-bold">Daily Stats Date</label>
            <CustomDatePicker
              selected={batchDate ? new Date(batchDate) : null}
              maxDate={new Date()}
              onChange={(date: Date | null) => date && setBatchDate(date.toISOString().split('T')[0])}
              dateFormat="dd-MM-yyyy"
              className="form-control form-control-sm"
              dropdownMode="select"
              showMonthDropdown
              showYearDropdown
            />
          </div>
      </div>
      
      <div className="container-fluid mt-4">
        <div className="row g-4">
          {(loading || feedLoading) && <div className="col-12"><Loading message="Loading dashboard data..." /></div>}
          {error && <div className="col-12"><div className="alert alert-danger">{error}</div></div>}
          {!(loading || feedLoading) && !error && dashboardStats.map((stat, index) => {
            const IconComponent = (Icons as any)[stat.icon] || Icons.HelpCircle;
            return (
              <div className="col-12 col-md-6 col-lg-3" key={index}>
                <div className="card h-100 shadow">
                  <div className="card-body d-flex align-items-center">
                    <div className="me-3 d-flex align-items-center justify-content-center rounded-3 bg-primary-subtle p-2">
                      <IconComponent className="text-primary" size={32} />
                    </div>
                    <div>
                      <h5 className="card-title text-muted mb-1">{stat.title}</h5>
                      <p className="card-text fs-3 fw-bold mb-0">
                        {stat.value.toLocaleString()}
                        {stat.unit}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        
        <div className="card shadow-sm my-4">
            <div className="card-body">
                <h5 className="card-title">Graphical Reports</h5>
                <div className="row g-3 align-items-end mb-3">
                    <div className="col-auto d-flex align-items-center">
                        <label className="form-label me-3 mb-0">Start Date</label>
                        <CustomDatePicker selected={startDate ? new Date(startDate) : null} onChange={(date: Date | null) => date && setStartDate(date.toISOString().split('T')[0])} maxDate={endDate ? new Date(endDate) : new Date()} dateFormat="dd-MM-yyyy" className="form-control" placeholderText="Select start date" dropdownMode="select" showMonthDropdown showYearDropdown />
                    </div>
                    <div className="col-auto d-flex align-items-center">
                        <label className="form-label me-3 mb-0">End Date</label>
                        <CustomDatePicker selected={endDate ? new Date(endDate) : null} onChange={(date: Date | null) => date && setEndDate(date.toISOString().split('T')[0])} minDate={startDate ? new Date(startDate) : undefined} maxDate={new Date()} dateFormat="dd-MM-yyyy" className="form-control" placeholderText="Select end date" showMonthDropdown showYearDropdown dropdownMode="select" />
                    </div>
                </div>
                {dateRangeError && <div className="alert alert-danger">{dateRangeError}</div>}
            </div>
        </div>

        <div className="row g-4">
            <div className="col-12 col-xl-8">
                <EggProductionGraph data={eggTrendData} loading={eggTrendLoading} error={eggTrendError} />
            </div>
            <div className="col-12 col-xl-4">
                <CompositionUsagePieChart data={compositionUsageData} loading={compositionUsageLoading} error={compositionUsageError} />
            </div>
        </div>

      </div>
    </>
  );
};

export default Dashboard;