import { useEffect, useState, useRef } from 'react';
import * as htmlToImage from 'html-to-image';
import { flushSync } from 'react-dom';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import PageHeader from './Layout/PageHeader';
import Loading from './Common/Loading';
import { GridRow } from '../types/GridRow';
import { fetchBatchData, exportBatchDataToExcel, fetchWeeklyLayerReport, CumulativeReport } from '../utility/api-utils';
import { BatchResponse } from '../types/batch';
import { ShedResponse } from '../types/shed';
import DatePicker from 'react-datepicker';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { configApi, batchApi, shedApi } from '../services/api';

const PreviousDayReport = () => {
  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    if (!year || !month || !day) return dateString;
    return `${day}-${month}-${year}`;
  }
  const { batchId: batchIdFromUrl } = useParams<{ batchId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  useEscapeKey();

  // Component state for data display
  const [gridData, setGridData] = useState<GridRow[]>([]);
  const [summaryData, setSummaryData] = useState<GridRow | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const reportContentRef = useRef<HTMLDivElement>(null);
  const [henDayDeviation, setHenDayDeviation] = useState(10);

  // State for weekly report specific data
  const [weekData, setWeekData] = useState<number | null>(null);
  const [ageRange, setAgeRange] = useState<string | null>(null);
  const [henHousing, setHenHousing] = useState<number | null>(null);
  const [cumulativeReportData, setCumulativeReportData] = useState<CumulativeReport | null>(null);

  const getFormattedDateFromParam = (param: string | null) => {
    if (!param) return '';
    return param.split('T')[0];
  }

  // State for the report generation form
  const [reportType, setReportType] = useState<'daily' | 'weekly'>(searchParams.get('week') ? 'weekly' : 'daily');
  const [startDate, setStartDate] = useState(getFormattedDateFromParam(searchParams.get('start')));
  const [endDate, setEndDate] = useState(getFormattedDateFromParam(searchParams.get('end')));
  const [week, setWeek] = useState(searchParams.get('week') || '');
  const [batchNo, setBatchNo] = useState('');
  const [batches, setBatches] = useState<BatchResponse[]>([]);
  const [sheds, setSheds] = useState<ShedResponse[]>([]);
  
  const rowsPerPage = 10;
  const validGridData = gridData.filter(row => row && Object.keys(row).length > 0);
  const totalPages = validGridData.length > 0 ? Math.ceil(validGridData.length / rowsPerPage) : 0;

  useEffect(() => {
    shedApi.getSheds().then(shedData => {
      const validSheds = Array.isArray(shedData) ? shedData : [];
      setSheds(validSheds);
    }).catch(err => {
      toast.error(err.message || "Failed to load sheds.");
    });

    configApi.getAllConfigs().then(configs => {
      const hdConfig = configs.find(c => c.name === 'henDayDeviation');
      setHenDayDeviation(hdConfig ? Number(hdConfig.value) : 10);
    });

    batchApi.getBatches(0, 1000).then(batchData => {
        const validBatches = Array.isArray(batchData) ? batchData : [];
        setBatches(validBatches);
        if (batchIdFromUrl) {
            const foundBatch = validBatches.find(b => String(b.id) === batchIdFromUrl);
            if (foundBatch) {
                setBatchNo(foundBatch.batch_no);
            }
        }
    }).catch(err => {
        toast.error(err.message || "Failed to load batches.");
    });
  }, [batchIdFromUrl]);

  const fetchData = async (batchIdToFetch?: string, start?: string, end?: string, weekToFetch?: string) => {
    setIsLoading(true);
    try {
      // Reset previous data and errors
      setGridData([]);
      setSummaryData(null);
      setWeekData(null);
      setAgeRange(null);
      setHenHousing(null);
      setCumulativeReportData(null);
      setError(null);

      let reportDetails: GridRow[];
      let reportSummary: GridRow | null = null;

      if (reportType === 'weekly') {
        if (!batchIdToFetch || !weekToFetch) {
            const msg = 'Batch number and week are required for weekly reports.';
            toast.error(msg);
            setError(msg);
            return;
        }
        
        const weeklyReport = await fetchWeeklyLayerReport(
          batchIdToFetch,
          weekToFetch
        );
        reportDetails = weeklyReport.details;
        reportSummary = weeklyReport.summary;
        setWeekData(weeklyReport.week ?? null);
        setAgeRange(weeklyReport.age_range ?? null);
        setHenHousing(weeklyReport.hen_housing ?? null);
        setCumulativeReportData(weeklyReport.cumulative_report ?? null);
      } else {
        const dailyReport = await fetchBatchData(
          start || '',
          end || '',
          batchIdToFetch
        );
        reportDetails = dailyReport.details;
        reportSummary = dailyReport.summary;
      }

      const detailsWithShedNo = reportDetails.map(d => ({
        ...d,
        shed_no: sheds.find(s => s.id == d.shed_id)?.shed_no || 'N/A'
      }));

      setGridData(detailsWithShedNo);
      setSummaryData(reportSummary);

    } catch (error: any) {
      const errorMsg = error?.message || 'Failed to fetch data';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data fetch based on URL parameters
  useEffect(() => {
    if (sheds.length > 0) {
      fetchData(batchIdFromUrl, searchParams.get('start') || '', searchParams.get('end') || '', searchParams.get('week') || '');
    }
  }, [batchIdFromUrl, searchParams, sheds]);

  const handleViewReport = () => {
    let batchIdToFetch: string | undefined;

    if (batchNo) {
        const foundBatch = batches.find(b => b.batch_no.toLowerCase() === batchNo.toLowerCase().trim());
        if (foundBatch) {
            batchIdToFetch = String(foundBatch.id);
        } else {
          if (batchNo) { // only error if a batchNo was actually selected/entered
            toast.error(`Batch with number "${batchNo}" not found.`);
            return;
          }
        }
    }

    const params = new URLSearchParams();
    if (reportType === 'weekly') {
        if (week && parseInt(week, 10) >= 18) {
            params.set('week', week);
        } else {
            toast.error('Week number must be 18 or greater for weekly reports.');
            return;
        }
    } else {
        if (startDate) params.set('start', startDate);
        if (endDate) params.set('end', endDate);
    }
    
    const path = batchIdToFetch ? `/previous-day-report/${batchIdToFetch}` : '/previous-day-report';
    navigate(`${path}?${params.toString()}`);
    
    // We call fetchData directly instead of relying on useEffect from navigation
    fetchData(batchIdToFetch, startDate, endDate, week);
  };

  const handleExport = () => {
    const batchIdForExport = batchNo ? batches.find(b => b.batch_no.toLowerCase() === batchNo.toLowerCase().trim())?.id : undefined;
    exportBatchDataToExcel(gridData, String(batchIdForExport) || '');
  };

  const handleShare = async () => {
    if (!reportContentRef.current) {
      toast.error("Table element not found.");
      return;
    }

    if (!navigator.share) {
      toast.error("Web Share API is not supported in your browser.");
      return;
    }
    
    const contentNode = reportContentRef.current;
    setIsSharing(true);
    const files: File[] = [];
    const originalPage = currentPage;

    const tableNode = contentNode.querySelector('table');
    if (!tableNode) {
      toast.error("Table element not found inside report content.");
      setIsSharing(false);
      return;
    }
    const originalTableStyle: { width: string; minWidth: string; whiteSpace: string } = {
      width: tableNode.style.width,
      minWidth: tableNode.style.minWidth,
      whiteSpace: tableNode.style.whiteSpace,
    };

    try {
      tableNode.style.width = 'auto';
      tableNode.style.minWidth = '1200px';
      tableNode.style.whiteSpace = 'nowrap';

      for (let i = 1; i <= totalPages; i++) {
        flushSync(() => {
          setCurrentPage(i);
        });

        // Get the full content dimensions including summary
        const contentWidth = Math.max(tableNode.scrollWidth, contentNode.scrollWidth);
        const contentHeight = contentNode.scrollHeight;
        
        const dataUrl = await htmlToImage.toPng(contentNode, {
          backgroundColor: '#ffffff',
          width: contentWidth,
          height: contentHeight,
          style: {
            transform: 'scale(1)',
            transformOrigin: 'top left',
            width: contentWidth + 'px',
            height: contentHeight + 'px'
          }
        });
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], `report-page-${i}.png`, { type: 'image/png' });
        files.push(file);
      }

      if (navigator.canShare && navigator.canShare({ files })) {
        await navigator.share({
          title: 'Batch Report',
          text: `Batch report.`,
          files: files,
        });
        toast.success("Report shared successfully!");
      } else {
        toast.error("Sharing files is not supported on this device.");
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Sharing failed', error);
        toast.error(`Failed to share report: ${error.message}`);
      }
    } finally {
      tableNode.style.width = originalTableStyle.width;
      tableNode.style.minWidth = originalTableStyle.minWidth;
      tableNode.style.whiteSpace = originalTableStyle.whiteSpace;

      setCurrentPage(originalPage);
      setIsSharing(false);
    }
  };

  const handleEdit = (batchId: number, batchDate: string) => {
    const [day, month, year] = batchDate.split('-');
    const formattedDate = `${year}-${month}-${day}`;
    navigate(`/batch/${batchId}/${formattedDate}/edit`);
  };

  return (
    <>
    <PageHeader title="Batch Reports" buttonLabel='Back' buttonVariant='secondary'/>
    <div className="container">
        <div className="col-12 mb-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Report</h5>
              <div className="row g-3 align-items-end">
                <div className="col-12 col-md-auto">
                    <label htmlFor="batchNoSelect" className="form-label">Batch Number</label>
                    <select
                        className="form-select"
                        id="batchNoSelect"
                        value={batchNo}
                        onChange={(e) => setBatchNo(e.target.value)}
                    >
                        <option value="">All Batches (Daily Report Only)</option>
                        {batches.map(b => (
                            <option key={b.id} value={b.batch_no}>
                                {b.batch_no}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="col-12 col-md-auto">
                    <label className="form-label d-block">&nbsp;</label> {/* Spacer for alignment */}
                    <div className="btn-group" role="group" aria-label="Report type">
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
                </div>
              </div>
              <div className="row g-3 align-items-end mt-2">
                {reportType === 'daily' ? (
                  <>
                    <div className="col-auto d-flex align-items-center mt-3">
            <label className="form-label me-3 mb-0">Start Date</label>
                      <DatePicker
                        selected={startDate ? new Date(startDate) : null}
                        onChange={(date: Date | null) => date && setStartDate(date.toISOString().slice(0, 10))}
                        showMonthDropdown
                        showYearDropdown
                        dropdownMode="select"
                        maxDate={endDate ? new Date(endDate) : undefined}
                        className="form-control"
                      />
                    </div>
                    <div className="col-auto d-flex align-items-center mt-3">
            <label className="form-label me-3 mb-0">End Date</label>
                      <DatePicker
                        selected={endDate ? new Date(endDate) : null}
                        onChange={(date: Date | null) => date && setEndDate(date.toISOString().slice(0, 10))}
                        showMonthDropdown
                        showYearDropdown
                        dropdownMode="select"
                        minDate={startDate ? new Date(startDate) : undefined}
                        maxDate={new Date()}
                        className="form-control"
                      />
                    </div>
                  </>
                ) : (
                  <div className="col-12 col-md-auto">
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
                <div className="col-12 col-md-auto d-flex justify-content-center justify-content-md-end">
                  <button
                    className="btn btn-primary mb-2"
                    onClick={handleViewReport}
                  >
                    View Data
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

      {isLoading && <Loading message="Loading report..." />}
      {error && <div className="alert alert-danger text-center">{error}</div>}
      {!isLoading && !error && validGridData.length === 0 && (
        <div className="text-center text-muted my-4">
          <p>No reports found for the selected criteria.</p>
        </div>
      )}
      
      <div className="row mb-4">
        <div className="d-flex flex-column mb-4">
          <div className="d-flex gap-2 mt-2 align-self-end">
            <button
              className="btn btn-info"
              onClick={handleShare}
              disabled={gridData.length === 0 || isSharing}
            >
              {isSharing ? 'Generating...' : 'Share as Image'}
            </button>
            <button
              className="btn btn-success"
              onClick={handleExport}
              disabled={gridData.length === 0 || isSharing}
            >
              Export to Excel
            </button>
          </div>
          <div>
            {weekData ? (
              <>
                <span className="me-3">Week: {weekData}</span>
                <span className="me-3">Age Range: {ageRange}</span>
                <span className="me-3">Hen Housing: {henHousing}</span>
                <span>Batch No: {batchNo}</span>
              </>
            ) : (
              <div>
                <span className="d-block d-sm-inline-block me-3">Date Range: {formatDateForDisplay(startDate)} to {formatDateForDisplay(endDate)}</span>
                {batchNo && <span className="d-block d-sm-inline-block">Batch No: {batchNo}</span>}
              </div>
            )}
          </div>
        </div>
      </div>

      {validGridData.length > 0 && (
        <div ref={reportContentRef}>
          <table className="table table-bordered">
            <thead>
              <tr>
                {batchIdFromUrl && <th>Batch Date</th>}
                <th>Shed No</th>
                <th>{!batchIdFromUrl ? "Highest Age" : "Age"}</th>
                <th>Opening</th>
                <th>Mortality</th>
                <th>Culls</th>
                <th>Closing Count</th>
                <th>Table</th>
                <th>Jumbo</th>
                <th>CR</th>
                <th>Total Eggs</th>
                <th>HD</th>
                <th>Standard</th>
                {reportType !== 'daily' && <>
                  <th>Actual Feed</th>
                  <th>Standard Feed</th>
                </>}
                {batchIdFromUrl && <th>Edit</th>}
              </tr>
            </thead>
            <tbody>
              {validGridData
                .slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
                .map((row) => {
                  let hdCellClassName = '';
                  let hdCellStyle = {};
                  let feedCellClassName = '';
                  let feedCellStyle = {};

                  // Only apply styling for Layer batches
                  if (row.batch_type === 'Layer') {
                    // Apply conditional styling for HD cell
                    if (row.hd !== undefined && row.standard_hen_day_percentage !== undefined) {
                      const actualHDPercentage = Number(row.hd) * 100;
                      const standardHDPercentage = Number(row.standard_hen_day_percentage);
                      const difference = standardHDPercentage - actualHDPercentage;
  
                      if (henDayDeviation >= difference) { // Difference is within deviation (e.g., -10 or more)
                        hdCellClassName = 'text-success fw-bold';
                        hdCellStyle = { backgroundColor: '#f5fff9' }; // Light green background
                      } else { // Difference is outside deviation
                        hdCellClassName = 'text-danger fw-bold';
                        hdCellStyle = { backgroundColor: '#fff9f5' }; // Light yellow background
                      }
                    }
  
                    // Apply conditional styling for Feed cell
                    if (reportType !== 'daily' && row.actual_feed_consumed !== undefined && row.standard_feed_consumption !== undefined) {
                      const actualFeed = Number(row.actual_feed_consumed);
                      const standardFeed = Number(row.standard_feed_consumption);
  
                      if (actualFeed <= standardFeed) { // Good performance: actual is less than or equal to standard
                        feedCellClassName = 'text-success fw-bold';
                        feedCellStyle = { backgroundColor: '#f5fff9' }; // Light green background
                      } else { // Needs attention: actual is greater than standard
                        feedCellClassName = 'text-danger fw-bold';
                        feedCellStyle = { backgroundColor: '#fff9f5' }; // Light yellow background
                      }
                    }
                  }


                  return (
                    <tr key={!batchIdFromUrl ? row.batch_id : `${row.batch_id}-${row.batch_date}`}>
                      {batchIdFromUrl && <td>{row.batch_date}</td>}
                      <td>{row.shed_no}</td>
                      <td>{!batchIdFromUrl ? row.highest_age : row.age}</td>
                      <td>{row.opening_count}</td>
                      <td>{row.mortality}</td>
                      <td>{row.culls}</td>
                      <td>{row.closing_count}</td>
                      <td>{row.table_eggs}</td>
                      <td>{row.jumbo}</td>
                      <td>{row.cr}</td>
                      <td>{row.total_eggs}</td>
                      <td className={hdCellClassName} style={hdCellStyle}>
                        {row.hd != null ? (Number(row.hd) * 100).toFixed(2) : ''}
                      </td>
                      <td>{row.standard_hen_day_percentage != null ? row.standard_hen_day_percentage.toFixed(2) : ''}</td>
                      {reportType !== 'daily' && <>
                        <td className={feedCellClassName} style={feedCellStyle}>
                          {row.actual_feed_consumed != null ? Number(row.actual_feed_consumed).toFixed(2) : ''}
                        </td>
                        <td>
                          {row.standard_feed_consumption != null ? Number(row.standard_feed_consumption).toFixed(2) : ''}
                        </td>
                      </>}
                      {batchIdFromUrl && (
                        <td>
                          <button
                            className="btn btn-sm btn-warning"
                            onClick={() => handleEdit(row.batch_id, row.batch_date!)}
                          >Edit</button>
                        </td>
                      )}
                    </tr>
                  );
                })}
            </tbody>
          </table>
          {summaryData && weekData && (
            <div className="mt-4 p-3 border rounded bg-light">
              <h5 className="mb-3">Report Summary</h5>
              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th></th>
                    <th>Opening</th>
                    <th>Mortality</th>
                    <th>Culls</th>
                    <th>Closing</th>
                    <th>Feed/Bird (g)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Count</td>
                    <td>{summaryData.opening_count}</td>
                    <td>{summaryData.mortality}</td>
                    <td>{summaryData.culls}</td>
                    <td>{summaryData.closing_count}</td>
                    <td rowSpan={2}>{summaryData.feed_per_bird_per_day_grams}</td>
                  </tr>
                  <tr>
                    <td>%</td>
                    <td>{summaryData.opening_percent}</td>
                    <td>{summaryData.mort_percent}</td>
                    <td>{summaryData.culls_percent}</td>
                    <td>{summaryData.closing_percent}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
          {summaryData && !weekData && (
            <div className="mt-4 p-3 border rounded bg-light">
              <h5 className="mb-3">Report Summary</h5>
              <div className="row g-3">
                <div className="col-md-3"><span className="fw-bold">Opening:</span> {summaryData.opening_count}</div>
                <div className="col-md-3"><span className="fw-bold">Total Mortality:</span> {summaryData.mortality}</div>
                <div className="col-md-3"><span className="fw-bold">Total Culls:</span> {summaryData.culls}</div>
                <div className="col-md-3"><span className="fw-bold">Closing:</span> {summaryData.closing_count}</div>
                <div className="col-md-3"><span className="fw-bold">Total Table Eggs:</span> {summaryData.table_eggs}</div>
                <div className="col-md-3"><span className="fw-bold">Total Jumbo:</span> {summaryData.jumbo}</div>
                <div className="col-md-3"><span className="fw-bold">Total CR:</span> {summaryData.cr}</div>
                <div className="col-md-3"><span className="fw-bold">Total Eggs:</span> {summaryData.total_eggs}</div>
                <div className="col-md-3"><span className="fw-bold">Avg HD:</span> {summaryData.hd != null ? (Number(summaryData.hd) * 100).toFixed(2) : 'N/A'}%</div>
                <div className="col-md-3"><span className="fw-bold">Avg Std HD:</span> {summaryData.standard_hen_day_percentage != null ? Number(summaryData.standard_hen_day_percentage).toFixed(2) : 'N/A'}%</div>
              </div>
            </div>
          )}
          {cumulativeReportData && (
            <div className="mt-4 p-3 border rounded bg-light">
              <h5 className="mb-3">Cumulative Report</h5>
              <div className="row g-3">
                <div className="col-md-6">
                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        <th></th>
                        <th>Cum</th>
                        <th>Actual</th>
                        <th>Standard</th>
                        <th>Diff</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Cum Feed</td>
                        <td>{cumulativeReportData.section1.cum_feed.cum}</td>
                        <td>{cumulativeReportData.section1.cum_feed.actual}</td>
                        <td>{cumulativeReportData.section1.cum_feed.standard}</td>
                        <td>{cumulativeReportData.section1.cum_feed.diff}</td>
                      </tr>
                      <tr>
                        <td>Weekly Feed</td>
                        <td>{cumulativeReportData.section1.weekly_feed.cum}</td>
                        <td>{cumulativeReportData.section1.weekly_feed.actual}</td>
                        <td>{cumulativeReportData.section1.weekly_feed.standard}</td>
                        <td>{cumulativeReportData.section1.weekly_feed.diff}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="col-md-6">
                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        <th></th>
                        <th>Actual</th>
                        <th>Standard</th>
                        <th>Diff</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Livability</td>
                        <td>{cumulativeReportData.section2.livability.actual}</td>
                        <td>{cumulativeReportData.section2.livability.standard}</td>
                        <td>{cumulativeReportData.section2.livability.diff}</td>
                      </tr>
                      <tr>
                        <td>Feed Grams</td>
                        <td>{cumulativeReportData.section2.feed_grams.actual}</td>
                        <td>{cumulativeReportData.section2.feed_grams.standard}</td>
                        <td>{cumulativeReportData.section2.feed_grams.diff}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {totalPages > 1 && (
        <div className="d-flex justify-content-between align-items-center mt-3">
          <button
            className="btn btn-secondary"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="btn btn-secondary"
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
    </>
  );
};

export default PreviousDayReport;
