import { useEffect, useState, useRef } from 'react';
import { flushSync } from 'react-dom'; // Import flushSync
import { useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import PageHeader from './Layout/PageHeader';
import { GridRow } from '../types/GridRow';
import { fetchBatchData, exportBatchDataToExcel, fetchWeeklyLayerReport } from '../utility/api-utils';
import { configApi } from '../services/api';
import * as htmlToImage from 'html-to-image';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

const PreviousDayReport = () => {
  const { batchId } = useParams<{ batchId?: string }>();
  const [searchParams] = useSearchParams();
  // Get dates from URL or use defaults
  const startDate = searchParams.get('start') || '';
  const endDate = searchParams.get('end') || '';
  const week = searchParams.get('week') || '';

  const [gridData, setGridData] = useState<GridRow[]>([]);
  const [summaryData, setSummaryData] = useState<GridRow | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const rowsPerPage = 10;
  const [error, setError] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const navigate = useNavigate(); // Initialize useNavigate
  const reportContentRef = useRef<HTMLDivElement>(null);

  // New state for weekly report
  const [weekData, setWeekData] = useState<number | null>(null);
  const [ageRange, setAgeRange] = useState<string | null>(null);
  const [henHousing, setHenHousing] = useState<number | null>(null);

  const validGridData = gridData.filter(row => row && Object.keys(row).length > 0);
  const totalPages = validGridData.length > 0 ? Math.ceil(validGridData.length / rowsPerPage) : 0;
  const [henDayDeviation, setHenDayDeviation] = useState(10); // default fallback

  useEffect(() => {
    // Fetch config on mount
    configApi.getAllConfigs().then(configs => {
      const hdConfig = configs.find(c => c.name === 'henDayDeviation');
      setHenDayDeviation(hdConfig ? Number(hdConfig.value) : 10);
    });
  }, []);

  const fetchData = async () => {
    try {
      if (week && batchId) {
        const { details, summary, week: responseWeek, age_range, hen_housing } = await fetchWeeklyLayerReport(
          batchId,
          week
        );
        setGridData(details);
        setSummaryData(summary);
        setWeekData(responseWeek);
        setAgeRange(age_range);
        setHenHousing(hen_housing);
        setError(null);
      } else {
        const { details, summary } = await fetchBatchData(
          startDate,
          endDate,
          batchId // Pass undefined if batchId doesn't exist
        );
        setGridData(details);
        setSummaryData(summary);
        setError(null);
      }
    } catch (error: any) {
      setError(error?.message || 'Failed to fetch data');
      toast.error(error?.message || 'Failed to fetch data');
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate, batchId, week]);

  const handleExport = () => {
    exportBatchDataToExcel(gridData, batchId);
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
    // Store original inline styles to restore them later
    const originalTableStyle: { width: string; minWidth: string; whiteSpace: string } = {
      width: tableNode.style.width,
      minWidth: tableNode.style.minWidth,
      whiteSpace: tableNode.style.whiteSpace,
    };

    try {
      // Temporarily apply styles to ensure the table is rendered wide and without text wrapping.
      // This creates a consistent, desktop-like image regardless of the user's screen size.
      tableNode.style.width = 'auto'; // Let content determine width
      tableNode.style.minWidth = '1200px'; // Force a wide layout
      tableNode.style.whiteSpace = 'nowrap'; // Prevent text wrapping in cells

      // Loop through each page of the table
      for (let i = 1; i <= totalPages; i++) {
        // Use flushSync to force a synchronous state update and DOM re-render.
        // This is much faster and more reliable than using a timeout.
        flushSync(() => {
          setCurrentPage(i);
        });

        const dataUrl = await htmlToImage.toPng(contentNode, {
          backgroundColor: '#ffffff', // Set a white background for the image
        });
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], `report-page-${i}.png`, { type: 'image/png' });
        files.push(file);
      }

      // Use the Web Share API to share the generated files
      if (navigator.canShare && navigator.canShare({ files })) {
        await navigator.share({
          title: 'Batch Report',
          text: `Batch report from ${startDate} to ${endDate}.`,
          files: files,
        });
        toast.success("Report shared successfully!");
      } else {
        toast.error("Sharing files is not supported on this device.");
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') { // User cancellation should not be treated as an error
        console.error('Sharing failed', error);
        toast.error(`Failed to share report: ${error.message}`);
      }
    } finally {
      // Restore the original styles to avoid affecting the user's view
      tableNode.style.width = originalTableStyle.width;
      tableNode.style.minWidth = originalTableStyle.minWidth;
      tableNode.style.whiteSpace = originalTableStyle.whiteSpace;

      setCurrentPage(originalPage); // Restore the original page view
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
    <PageHeader title="Batch Overview" buttonLabel='Back' buttonVariant='secondary'/>
    <div className="container-fluid">
      {/* Error message */}
      {error && <div className="alert alert-danger text-center">{error}</div>}
      <div className="row mb-4">
        <div className="d-flex flex-column mb-4">
          <div>
            {weekData ? (
              <>
                <span className="me-3">
                  Week: {weekData}
                </span>
                <span className="me-3">
                  Age Range: {ageRange}
                </span>
                <span className="me-3">
                  Hen Housing: {henHousing}
                </span>
                <span>
                  Batch No: {(() => {
                    const found = gridData.find(row => String(row.batch_id) === String(batchId));
                    return found ? found.batch_no : batchId;
                  })()}
                </span>
              </>
            ) : batchId ? (
              <>
                <span className="me-3">
                  Date Range: {startDate} to {endDate}
                </span>
                <span>
                  Batch No: {(() => {
                    const found = gridData.find(row => String(row.batch_id) === String(batchId));
                    return found ? found.batch_no : batchId;
                  })()}
                </span>
              </>
            ) : (
              <span className="me-3">
                Date Range: {startDate} to {endDate}
              </span>
            )}
          </div>
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
        </div>
      </div>

      {validGridData.length > 0 && (
        <div ref={reportContentRef}>
          <table className="table table-bordered">
            <thead>
              <tr>
                {batchId && <th>Batch Date</th>}
                <th>Shed No</th>
                <th>{!batchId ? "Highest Age" : "Age"}</th>
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
                <th>Actual Feed</th>
                <th>Standard Feed</th>
                {batchId && <th>Edit</th>}
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
                    if (row.actual_feed_consumed !== undefined && row.standard_feed_consumption !== undefined) {
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
                    <tr key={!batchId ? row.batch_id : `${row.batch_id}-${row.batch_date}`}>
                      {batchId && <td>{row.batch_date}</td>}
                      <td>{row.shed_no}</td>
                      <td>{!batchId ? row.highest_age : row.age}</td>
                      <td>{row.opening_count}</td>
                      <td>{row.mortality}</td>
                      <td>{row.culls}</td>
                      <td>{row.closing_count}</td>
                      <td>{row.table_eggs}</td>
                      <td>{row.jumbo}</td>
                      <td>{row.cr}</td>
                      <td>{row.total_eggs}</td>
                      <td className={hdCellClassName} style={hdCellStyle}>
                        {row.hd !== undefined ? (Number(row.hd) * 100).toFixed(2) : ''}
                      </td>
                      <td>{row.standard_hen_day_percentage !== undefined ? row.standard_hen_day_percentage.toFixed(2) : ''}</td>
                      <td className={feedCellClassName} style={feedCellStyle}>
                        {row.actual_feed_consumed !== undefined ? Number(row.actual_feed_consumed).toFixed(2) : ''}
                      </td>
                      <td>
                        {row.standard_feed_consumption !== undefined ? Number(row.standard_feed_consumption).toFixed(2) : ''}
                      </td>
                      {batchId && (
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
          {summaryData && (
            <div className="mt-4 p-3 border rounded bg-light">
              <h5 className="mb-3">Report Summary</h5>
              <div className="row g-3">
                <div className="col-md-3"><span className="fw-bold">Total Opening:</span> {summaryData.opening_count}</div>
                <div className="col-md-3"><span className="fw-bold">Total Mortality:</span> {summaryData.mortality}</div>
                <div className="col-md-3"><span className="fw-bold">Total Culls:</span> {summaryData.culls}</div>
                <div className="col-md-3"><span className="fw-bold">Total Closing:</span> {summaryData.closing_count}</div>
                <div className="col-md-3"><span className="fw-bold">Total Table Eggs:</span> {summaryData.table_eggs}</div>
                <div className="col-md-3"><span className="fw-bold">Total Jumbo:</span> {summaryData.jumbo}</div>
                <div className="col-md-3"><span className="fw-bold">Total CR:</span> {summaryData.cr}</div>
                <div className="col-.md-3"><span className="fw-bold">Total Eggs:</span> {summaryData.total_eggs}</div>
                <div className="col-md-3"><span className="fw-bold">Average HD:</span> {Number(summaryData.hd).toFixed(2)}%</div>
                <div className="col-md-3"><span className="fw-bold">Average Standard HD:</span> {Number(summaryData.standard_hen_day_percentage).toFixed(2)}%</div>
                {summaryData.actual_feed_consumed && <div className="col-md-3"><span className="fw-bold">Total Actual Feed Consumed:</span> {Number(summaryData.actual_feed_consumed).toFixed(2)}</div>}
                {summaryData.standard_feed_consumption && <div className="col-md-3"><span className="fw-bold">Total Standard Feed Consumption:</span> {Number(summaryData.standard_feed_consumption).toFixed(2)}</div>}
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