import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../Layout/PageHeader';
import { dailyBatchApi, compositionApi, inventoryItemApi, reportsApi, getTenantId, tenantFeatureApi } from '../../services/api';
import { DailyBatch } from '../../types/daily_batch';
import { InventoryUsageSummary } from '../../types/InventoryUsageSummary';
import { TopSellingItem } from '../../types/topSellingItem';
import { InventoryStockLevel } from '../../types/inventoryStockLevel';
import CustomDatePicker from '../Common/CustomDatePicker';
import Loading from '../Common/Loading';
import { Bird, Egg, Package, Percent, HelpCircle, ShoppingCart, AlertTriangle, TrendingUp, Activity, CheckCircle2 } from 'lucide-react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import EggProductionGraph from './EggProductionGraph';
import EggProductionCostGraph from './EggProductionCostGraph';
import CompositionUsagePieChart from './CompositionUsagePieChart';
import FeedConsumptionPerEggGraph from './FeedConsumptionPerEggGraph';
import EggPriceCard from './EggPriceCard';
import SubscriptionWarning from '../Common/SubscriptionWarning';
import { useShortcuts } from '../context/KeyboardShortcutContext';

const BATCH_DATE_KEY = 'dashboard_batch_date';

const CHART_COLORS = [
  '#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
  '#EC4899', '#06B6D4', '#6366F1', '#F97316', '#84CC16'
];

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
  const [inventoryUsage, setInventoryUsage] = useState<InventoryUsageSummary | null>(null);
  const [inventoryLoading, setInventoryLoading] = useState(false);

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

  // State for Egg Production Cost Graph
  const [eggCostData, setEggCostData] = useState<{ month: string, total_eggs: number, total_cost: string, cost_per_egg: string, total_cost_str: string, cost_per_egg_str: string }[]>([]);
  const [eggCostLoading, setEggCostLoading] = useState(true);
  const [eggCostError, setEggCostError] = useState<string | null>(null);

  // State for Feed Consumption Per Egg Graph
  const [feedConsumptionData, setFeedConsumptionData] = useState<{ month: string, total_eggs: number, total_feed_grams: number, total_feed_kg: number, feed_per_egg_grams: number, feed_per_egg_kg: number }[]>([]);
  const [feedConsumptionLoading, setFeedConsumptionLoading] = useState(true);
  const [feedConsumptionError, setFeedConsumptionError] = useState<string | null>(null);

  // State for Feature Restrictions
  const [isBatchRestricted, setIsBatchRestricted] = useState(false);
  const [checkingRestriction, setCheckingRestriction] = useState(true);
  const { registerShortcuts } = useShortcuts();

  // Tab State
  const [activeTab, setActiveTab] = useState<'production' | 'inventory'>('production');

  // State for Inventory & Sales Dashboard
  const [topSellingItems, setTopSellingItems] = useState<TopSellingItem[]>([]);
  const [topSellingLoading, setTopSellingLoading] = useState(false);
  const [topSellingError, setTopSellingError] = useState<string | null>(null);

  const [lowStockItems, setLowStockItems] = useState<InventoryStockLevel[]>([]);
  const [lowStockLoading, setLowStockLoading] = useState(false);
  const [lowStockError, setLowStockError] = useState<string | null>(null);

  const [stockLevels, setStockLevels] = useState<InventoryStockLevel[]>([]);
  const [stockLevelsLoading, setStockLevelsLoading] = useState(false);
  const [stockLevelsError, setStockLevelsError] = useState<string | null>(null);

  const [inventoryValue, setInventoryValue] = useState<number>(0);
  const [inventoryValueLoading, setInventoryValueLoading] = useState(false);

  useEffect(() => {
    const unregister = registerShortcuts([
      { key: '/', description: 'Focus Usage Stats Date', category: 'Page Actions', action: () => document.getElementById('usage-stats-date-picker')?.focus() }
    ]);
    return unregister;
  }, [registerShortcuts]);

  useEffect(() => {
    const checkRestriction = async () => {
      try {
        const tenantId = getTenantId();
        if (tenantId) {
          const features = await tenantFeatureApi.getTenantFeaturesByTenantId(tenantId);
          const restricted = features.some(f => f.feature_name === 'BATCH_MANAGEMENT' && f.is_restricted);
          setIsBatchRestricted(restricted);
          if (restricted) {
            setActiveTab('inventory');
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setCheckingRestriction(false);
      }
    };
    checkRestriction();
  }, []);

  // Effect for daily stats
  useEffect(() => {
    if (checkingRestriction) return;

    const fetchBatches = async () => {
      if (isBatchRestricted) {
        setLoading(false);
        return;
      }
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

    const fetchUsageData = async () => {
      setFeedLoading(true);
      setInventoryLoading(true);
      try {
        const [feed, inventory] = await Promise.all([
          compositionApi.getFeedUsageByDate(batchDate).catch(err => {
            console.warn('Feed usage not found/available:', err);
            return null;
          }),
          inventoryItemApi.getInventoryUsageByDate(batchDate).catch(err => {
            console.warn('Inventory usage not found/available:', err);
            return null;
          }),
        ]);

        setFeedUsage(feed);
        setInventoryUsage(inventory);
      } catch (err: any) {
        setFeedUsage(null);
        setInventoryUsage(null);
      } finally {
        setFeedLoading(false);
        setInventoryLoading(false);
      }
    };

    fetchBatches();
    fetchUsageData();
  }, [batchDate, checkingRestriction, isBatchRestricted]);

  useEffect(() => {
    sessionStorage.setItem(BATCH_DATE_KEY, batchDate);
  }, [batchDate]);

  // Effect for Graphs (Production Tab)
  useEffect(() => {
    if (checkingRestriction) return;
    if (isBatchRestricted) {
      setEggTrendLoading(false);
      setEggCostLoading(false);
      setFeedConsumptionLoading(false);
      setCompositionUsageLoading(false);
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      setDateRangeError('End Date cannot be before Start Date.');
      setEggTrendData([]);
      setCompositionUsageData([]); 
      setEggTrendLoading(false);
      setCompositionUsageLoading(false);
      setEggCostLoading(false);
      setFeedConsumptionLoading(false);
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
          let current = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
          while (current <= end) {
            months.push(current.toISOString().slice(0, 7)); // "YYYY-MM"
            current.setUTCMonth(current.getUTCMonth() + 1);
          }
          return months;
        };
        const allMonths = getMonthsInRange(start, end);
        const dataMap = new Map(apiData.map(item => [item.month, item.total_eggs]));
        let processedData = allMonths.map(month => ({
          month,
          total_eggs: dataMap.get(month) || 0,
        }));

        if (apiData.length > 0) {
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
        const filteredReport = apiData.report.filter(item => item.total_usage > 0);
        setCompositionUsageData(filteredReport);
      } catch (err) {
        setCompositionUsageError('Failed to load composition usage data.');
        console.error(err);
      } finally {
        setCompositionUsageLoading(false);
      }
    };

    // Fetch egg production cost data
    const fetchEggCostData = async () => {
      setEggCostLoading(true);
      setEggCostError(null);
      try {
        const apiData = await reportsApi.getMonthlyEggProductionCost(startDate, endDate);
        const sortedData = [...apiData].sort((a, b) => a.month.localeCompare(b.month));
        setEggCostData(sortedData);
      } catch (err) {
        setEggCostError('Failed to load egg production cost data.');
        console.error(err);
      } finally {
        setEggCostLoading(false);
      }
    };

    // Fetch feed consumption per egg data
    const fetchFeedConsumptionData = async () => {
      setFeedConsumptionLoading(true);
      setFeedConsumptionError(null);
      try {
        const apiData = await reportsApi.getFeedConsumptionPerEgg(startDate, endDate);
        const sortedData = [...apiData].sort((a, b) => a.month.localeCompare(b.month));
        setFeedConsumptionData(sortedData);
      } catch (err) {
        setFeedConsumptionError('Failed to load feed consumption per egg data.');
        console.error(err);
      } finally {
        setFeedConsumptionLoading(false);
      }
    };

    fetchEggTrendData();
    fetchEggCostData();
    fetchFeedConsumptionData();
    fetchCompositionUsageData();

  }, [startDate, endDate, checkingRestriction, isBatchRestricted]);

  // Effect for fetching Inventory & Sales dashboard data
  useEffect(() => {
    if (checkingRestriction) return;
    if (activeTab !== 'inventory') return;

    const fetchInventoryDashboardData = async () => {
      setTopSellingLoading(true);
      setLowStockLoading(true);
      setStockLevelsLoading(true);
      setInventoryValueLoading(true);
      
      setTopSellingError(null);
      setLowStockError(null);
      setStockLevelsError(null);

      // Fetch in parallel
      Promise.all([
        reportsApi.getTopSellingItems(startDate, endDate, 5)
          .then(data => {
            setTopSellingItems(data);
          })
          .catch(err => {
            console.error(err);
            setTopSellingError('Failed to load top selling items');
          })
          .finally(() => setTopSellingLoading(false)),

        inventoryItemApi.getLowStockItems()
          .then(data => {
            setLowStockItems(data);
          })
          .catch(err => {
            console.error(err);
            setLowStockError('Failed to load low stock items');
          })
          .finally(() => setLowStockLoading(false)),

        inventoryItemApi.getInventoryStockLevels()
          .then(data => {
            setStockLevels(data);
          })
          .catch(err => {
            console.error(err);
            setStockLevelsError('Failed to load stock levels');
          })
          .finally(() => setStockLevelsLoading(false)),

        inventoryItemApi.getInventoryValue()
          .then(data => {
            const val = typeof data.total_inventory_value === 'string' 
              ? parseFloat(data.total_inventory_value) 
              : data.total_inventory_value;
            setInventoryValue(val || 0);
          })
          .catch(err => {
            console.error('Error fetching inventory value:', err);
          })
          .finally(() => setInventoryValueLoading(false))
      ]);
    };

    fetchInventoryDashboardData();
  }, [activeTab, startDate, endDate, checkingRestriction]);

  const { totalBirds, totalEggs, avgHD } = useMemo(() => {
    const totalBirds = batches.reduce((sum, b) => sum + (b.closing_count || 0), 0);
    const totalEggs = batches.reduce((sum, b) => sum + ((b.table_eggs || 0) + (b.jumbo || 0) + (b.cr || 0)), 0);
    const layerBatches = batches.filter(b => b.batch_type === 'Layer');
    const avgHD = layerBatches.length > 0 ? Number(((layerBatches.reduce((sum, b) => sum + (b.hd || 0), 0) / layerBatches.length) * 100).toFixed(2)) : 0;
    return { totalBirds, totalEggs, avgHD };
  }, [batches]);

  const dashboardStats = isBatchRestricted ? [] : [
    { title: "Total Birds", value: totalBirds, unit: '', icon: Bird },
    { title: "Total Eggs", value: totalEggs, unit: '', icon: Egg },
    { title: "Material Usage", value: (feedUsage?.total_feed || 0) + (inventoryUsage?.total_used || 0), unit: ' kg', icon: Package },
    { title: "Hen Day %", value: avgHD, unit: '%', icon: Percent }
  ];

  // Inventory stats calculations
  const totalSalesVolume = useMemo(() => {
    return topSellingItems.reduce((sum, item) => sum + (item.total_quantity_sold || 0), 0);
  }, [topSellingItems]);

  const topProduct = topSellingItems[0] || null;
  const lowStockCount = lowStockItems.length;

  const inventoryStats = [
    {
      title: "Total Sales Volume",
      value: totalSalesVolume,
      unit: " units",
      icon: ShoppingCart,
      colorClass: "bg-info-subtle text-info",
      subtext: "Total quantity sold in period",
      loading: topSellingLoading
    },
    {
      title: "Top Seller",
      value: topProduct ? topProduct.name : "N/A",
      unit: topProduct ? ` (${topProduct.total_quantity_sold.toLocaleString()} sold)` : "",
      icon: TrendingUp,
      colorClass: "bg-primary-subtle text-primary",
      subtext: topProduct ? "Highest volume seller" : "No sales data",
      loading: topSellingLoading,
      isText: true
    },
    {
      title: "Stock Valuation",
      value: `₹${inventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      unit: "",
      icon: Package,
      colorClass: "bg-success-subtle text-success",
      subtext: "Current inventory value",
      loading: inventoryValueLoading,
      isText: true
    },
    {
      title: "Low Stock Items",
      value: lowStockCount,
      unit: "",
      icon: AlertTriangle,
      colorClass: lowStockCount > 0 ? "bg-danger-subtle text-danger" : "bg-success-subtle text-success",
      subtext: lowStockCount > 0 ? "Requires reordering" : "All levels normal",
      loading: lowStockLoading
    }
  ];

  return (
    <>
      <PageHeader title="Dashboard" />

      <div className="container">
        <SubscriptionWarning />

        {/* Navigation Tabs */}
        {!checkingRestriction && (
          <ul className="nav nav-tabs mb-4">
            {!isBatchRestricted && (
              <li className="nav-item">
                <button
                  className={`nav-link fw-bold d-flex align-items-center ${activeTab === 'production' ? 'active text-primary' : 'text-muted'}`}
                  style={{ borderTopLeftRadius: '0.375rem', borderTopRightRadius: '0.375rem', cursor: 'pointer', border: '1px solid transparent' }}
                  onClick={() => setActiveTab('production')}
                >
                  <Activity className="me-2" size={18} />
                  Production Analytics
                </button>
              </li>
            )}
            <li className="nav-item">
              <button
                className={`nav-link fw-bold d-flex align-items-center ${activeTab === 'inventory' ? 'active text-primary' : 'text-muted'}`}
                style={{ borderTopLeftRadius: '0.375rem', borderTopRightRadius: '0.375rem', cursor: 'pointer', border: '1px solid transparent' }}
                onClick={() => setActiveTab('inventory')}
              >
                <Package className="me-2" size={18} />
                Inventory & Sales
              </button>
            </li>
          </ul>
        )}

        {/* Production Tab Content */}
        {activeTab === 'production' && !isBatchRestricted && (
          <div className="mt-4 animate-fade-in">
            {/* Daily stats Date picker */}
            <div className="mb-3">
              <div className="col-auto d-flex align-items-center bg-white p-2 rounded shadow-sm" style={{ maxWidth: '250px' }}>
                <label className="form-label me-2 mb-0 fw-bold">Usage Stats Date</label>
                <CustomDatePicker
                  id="usage-stats-date-picker"
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

            {/* Daily stats Cards */}
            <div className="row g-4">
              {(loading || feedLoading || inventoryLoading) && <div className="col-12"><Loading message="Loading dashboard data..." /></div>}
              {error && <div className="col-12"><div className="alert alert-danger">{error}</div></div>}
              {!(loading || feedLoading || inventoryLoading) && !error && dashboardStats.map((stat, index) => {
                const IconComponent = stat.icon || HelpCircle;
                return (
                  <div className="col-12 col-md-6 col-lg-3" key={index}>
                    <div className="card h-100 shadow-sm border-0 transition-transform hover-scale">
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

            {/* Egg Price Card */}
            <div className="row mt-4">
              <div className="col-12">
                <EggPriceCard />
              </div>
            </div>

            {/* Date range filter card */}
            <div className="card shadow-sm my-4 border-0">
              <div className="card-body">
                <h5 className="card-title">Graphical Reports Filter</h5>
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

            {/* Production Graphs 2x2 Grid */}
            <div className="row g-4">
              <div className="col-12 col-xl-6">
                <EggProductionGraph data={eggTrendData} loading={eggTrendLoading} error={eggTrendError} />
              </div>
              <div className="col-12 col-xl-6">
                <CompositionUsagePieChart data={compositionUsageData} loading={compositionUsageLoading} error={compositionUsageError} />
              </div>
              <div className="col-12 col-xl-6">
                <EggProductionCostGraph data={eggCostData} loading={eggCostLoading} error={eggCostError} />
              </div>
              <div className="col-12 col-xl-6">
                <FeedConsumptionPerEggGraph data={feedConsumptionData} loading={feedConsumptionLoading} error={feedConsumptionError} />
              </div>
            </div>
          </div>
        )}

        {/* Inventory & Sales Tab Content */}
        {activeTab === 'inventory' && (
          <div className="mt-4 animate-fade-in">
            {/* Inventory Metric Cards Row */}
            <div className="row g-4 mb-4">
              {inventoryStats.map((stat, index) => {
                const IconComponent = stat.icon;
                return (
                  <div className="col-12 col-md-6 col-lg-3" key={index}>
                    <div className="card h-100 shadow-sm border-0 transition-transform hover-scale">
                      <div className="card-body d-flex align-items-center">
                        <div className={`me-3 d-flex align-items-center justify-content-center rounded-3 ${stat.colorClass} p-3`}>
                          <IconComponent size={28} />
                        </div>
                        <div className="w-100">
                          <h6 className="card-title text-muted mb-1">{stat.title}</h6>
                          {stat.loading ? (
                            <div className="spinner-border spinner-border-sm text-primary" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                          ) : (
                            <p className="card-text fs-4 fw-bold mb-0 text-truncate" style={{ maxWidth: '100%' }}>
                              {stat.isText ? stat.value : Number(stat.value).toLocaleString()}
                              <span className="fs-6 text-muted fw-normal">{stat.unit}</span>
                            </p>
                          )}
                          <div className="text-muted small mt-1" style={{ fontSize: '0.75rem' }}>{stat.subtext}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Date range filter card */}
            <div className="card shadow-sm mb-4 border-0">
              <div className="card-body">
                <h5 className="card-title">Sales & Reports Period</h5>
                <p className="text-muted small mb-3">Choose the start and end dates to filter top selling items sales volume.</p>
                <div className="row g-3 align-items-end mb-2">
                  <div className="col-auto d-flex align-items-center">
                    <label className="form-label me-3 mb-0">Start Date</label>
                    <CustomDatePicker selected={startDate ? new Date(startDate) : null} onChange={(date: Date | null) => date && setStartDate(date.toISOString().split('T')[0])} maxDate={endDate ? new Date(endDate) : new Date()} dateFormat="dd-MM-yyyy" className="form-control" placeholderText="Select start date" dropdownMode="select" showMonthDropdown showYearDropdown />
                  </div>
                  <div className="col-auto d-flex align-items-center">
                    <label className="form-label me-3 mb-0">End Date</label>
                    <CustomDatePicker selected={endDate ? new Date(endDate) : null} onChange={(date: Date | null) => date && setEndDate(date.toISOString().split('T')[0])} minDate={startDate ? new Date(startDate) : undefined} maxDate={new Date()} dateFormat="dd-MM-yyyy" className="form-control" placeholderText="Select end date" showMonthDropdown showYearDropdown dropdownMode="select" />
                  </div>
                </div>
                {dateRangeError && <div className="alert alert-danger mt-2">{dateRangeError}</div>}
              </div>
            </div>

            {/* Charts and Alerts Row */}
            <div className="row g-4 mb-4">
              {/* Top Selling Items Chart */}
              <div className="col-12 col-xl-6">
                <div className="card shadow-sm h-100 border-0">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="card-title mb-0 d-flex align-items-center">
                        <TrendingUp className="me-2 text-primary" size={20} />
                        Top Selling Items
                      </h5>
                      <Link to="/inventory-items/top-selling-items-report" className="btn btn-sm btn-outline-primary">
                        View Detailed Report
                      </Link>
                    </div>
                    {topSellingLoading ? (
                      <div className="text-center py-5">
                        <Loading message="Loading sales data..." />
                      </div>
                    ) : topSellingError ? (
                      <div className="alert alert-danger">{topSellingError}</div>
                    ) : topSellingItems.length === 0 ? (
                      <div className="text-center py-5 text-muted">
                        No sales data found for the selected period.
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          layout="vertical"
                          data={topSellingItems}
                          margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Bar dataKey="total_quantity_sold" fill="#2563EB" radius={[0, 4, 4, 0]} name="Quantity Sold">
                            {topSellingItems.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>

              {/* Low Stock Alerts */}
              <div className="col-12 col-xl-6">
                <div className="card shadow-sm h-100 border-0">
                  <div className="card-body d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="card-title mb-0 d-flex align-items-center">
                        <AlertTriangle className={`me-2 ${lowStockCount > 0 ? 'text-danger' : 'text-success'}`} size={20} />
                        Low Stock Alerts
                      </h5>
                      <Link to="/inventory-items/low-stock-report" className="btn btn-sm btn-outline-primary">
                        View Low Stock Page
                      </Link>
                    </div>
                    {lowStockLoading ? (
                      <div className="text-center py-5 my-auto">
                        <Loading message="Checking stock levels..." />
                      </div>
                    ) : lowStockError ? (
                      <div className="alert alert-danger my-auto">{lowStockError}</div>
                    ) : lowStockItems.length === 0 ? (
                      <div className="text-center py-5 my-auto text-success">
                        <CheckCircle2 className="mb-2 text-success" size={48} />
                        <h6 className="fw-bold">All Good!</h6>
                        <p className="text-muted mb-0 small">All inventory items are well above their reorder levels.</p>
                      </div>
                    ) : (
                      <div className="table-responsive flex-grow-1" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        <table className="table table-hover align-middle mb-0">
                          <thead className="table-light sticky-top">
                            <tr>
                              <th>Item Name</th>
                              <th>Category</th>
                              <th className="text-end">Current Stock</th>
                              <th className="text-end">Reorder Level</th>
                            </tr>
                          </thead>
                          <tbody>
                            {lowStockItems.slice(0, 10).map((item) => (
                              <tr key={item.id}>
                                <td className="fw-semibold text-truncate" style={{ maxWidth: '150px' }}>{item.name}</td>
                                <td><span className="badge bg-secondary-subtle text-secondary">{item.category}</span></td>
                                <td className="text-end text-danger fw-bold">{item.current_stock} <span className="text-muted fw-normal small">{item.unit}</span></td>
                                <td className="text-end">{item.reorder_level} <span className="text-muted fw-normal small">{item.unit}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {lowStockItems.length > 10 && (
                          <div className="text-center mt-2 small text-muted">
                            Showing top 10 low-stock items.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Inventory Stock Levels Chart */}
            <div className="row g-4">
              <div className="col-12">
                <div className="card shadow-sm border-0">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <h5 className="card-title mb-0 d-flex align-items-center">
                        <Package className="me-2 text-success" size={20} />
                        Stock Levels vs Reorder Levels
                      </h5>
                      <Link to="/inventory-items/stock-level-report" className="btn btn-sm btn-outline-success">
                        View Full Stock Levels Report
                      </Link>
                    </div>
                    {stockLevelsLoading ? (
                      <div className="text-center py-5">
                        <Loading message="Loading inventory stock levels..." />
                      </div>
                    ) : stockLevelsError ? (
                      <div className="alert alert-danger">{stockLevelsError}</div>
                    ) : stockLevels.length === 0 ? (
                      <div className="text-center py-5 text-muted">
                        No inventory items found.
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={350}>
                        <BarChart
                          data={stockLevels.slice(0, 15).map(item => ({
                            name: item.name,
                            stock: parseFloat(item.current_stock) || 0,
                            reorder: parseFloat(item.reorder_level) || 0,
                            unit: item.unit
                          }))}
                          margin={{ top: 10, right: 30, left: 20, bottom: 60 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} tick={{ fontSize: 11 }} />
                          <YAxis />
                          <Tooltip formatter={(value, name, props) => [`${value} ${props.payload.unit}`, name === 'stock' ? 'Current Stock' : 'Reorder Level']} />
                          <Legend verticalAlign="top" height={36} />
                          <Bar dataKey="stock" fill="#10B981" name="Current Stock" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="reorder" fill="#EF4444" name="Reorder Level" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Dashboard;
