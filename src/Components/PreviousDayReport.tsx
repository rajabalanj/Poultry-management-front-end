import { useEffect, useState, useRef } from 'react';
import { flushSync } from 'react-dom'; // Import flushSync
import { useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import PageHeader from './Layout/PageHeader';
import { GridRow } from '../types/GridRow';
import { fetchBatchData, exportBatchDataToExcel } from '../utility/api-utils';
import { configApi } from '../services/api';
import * as htmlToImage from 'html-to-image';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

const PreviousDayReport = () => {
  const { batchId } = useParams<{ batchId?: string }>();
  const [searchParams] = useSearchParams();
  // Get dates from URL or use defaults
  const startDate = searchParams.get('start') || '';
  const endDate = searchParams.get('end') || '';
  const [gridData, setGridData] = useState<GridRow[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const rowsPerPage = 10;
  const [error, setError] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const navigate = useNavigate(); // Initialize useNavigate
  const tableRef = useRef<HTMLTableElement>(null);

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
      const data = await fetchBatchData(
        startDate,
        endDate,
        batchId // Pass undefined if batchId doesn't exist
      );
      setGridData(data);
      setError(null);
    } catch (error: any) {
      setError(error?.message || 'Failed to fetch data');
      toast.error(error?.message || 'Failed to fetch data');
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate, batchId]);

  const handleExport = () => {
    exportBatchDataToExcel(gridData, batchId);
  };

  const handleShare = async () => {
    if (!tableRef.current) {
      toast.error("Table element not found.");
      return;
    }

    if (!navigator.share) {
      toast.error("Web Share API is not supported in your browser.");
      return;
    }

    const tableNode = tableRef.current;
    setIsSharing(true);
    const files: File[] = [];
    const originalPage = currentPage;
    // Store original inline styles to restore them later
    const originalTableStyle = {
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

        const dataUrl = await htmlToImage.toPng(tableNode, {
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
            <span className="me-3">
              Date Range: {startDate} to {endDate}
            </span>
            {batchId && (
              <span>
                Batch No: {(() => {
                  const found = gridData.find(row => String(row.batch_id) === String(batchId));
                  return found ? found.batch_no : batchId;
                })()}
              </span>
            )}
          </div>
          <div className="d-flex gap-2 mt-2 align-self-end">
            <button
              className="btn btn-primary"
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
        <div className="table-responsive">
          <table className="table table-bordered" ref={tableRef}>
            <thead>
              <tr>
                <th>Batch Date</th>
                <th>Shed No</th>
                <th>Age</th>
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
              </tr>
            </thead>
            <tbody>
              {validGridData
                .slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
                .map((row) => {
                  let hdCellClassName = '';
                  let hdCellStyle = {};

                  // Apply conditional styling for HD cell
                  if (row.hd !== undefined && row.standard_hen_day_percentage !== undefined) {
                    const actualHDPercentage = Number(row.hd) * 100;
                    const standardHDPercentage = Number(row.standard_hen_day_percentage);
                    const difference = standardHDPercentage - actualHDPercentage;

                    if (henDayDeviation >= difference) { // Difference is -10 or more (meaning actual HD is at most 10% less than standard, or higher)
                      hdCellClassName = 'text-success fw-bold';
                      hdCellStyle = { backgroundColor: '#E8F8D9 ' }; // Light green background
                    } else { // Difference is between -20 and -10 (actual HD is 10-20% less than standard)
                      hdCellClassName = 'text-danger fw-bold';
                      hdCellStyle = { backgroundColor: '#fff9f5' }; // Light yellow background
                    } 
                  }

                  return (
                    <tr key={`${row.batch_id}-${row.batch_date}`}>
                      <td>{row.batch_date}</td>
                      <td>{row.shed_no}</td>
                      <td>{row.age}</td>
                      <td>{row.opening_count}</td>
                      <td>{row.mortality}</td>
                      <td>{row.culls}</td>
                      <td>{row.closing_count}</td>
                      <td>{row.table_eggs}</td>
                      <td>{row.jumbo}</td>
                      <td>{row.cr}</td>
                      <td>{row.total_eggs}</td>
                      {/* Apply conditional styling to the HD cell */}
                      <td className={hdCellClassName} style={hdCellStyle}>
                        {row.hd !== undefined ? Number(row.hd).toFixed(5) : ''}
                      </td>
                      <td>{row.standard_hen_day_percentage !== undefined ? row.standard_hen_day_percentage.toFixed(2) : ''}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-warning"
                          onClick={() => handleEdit(row.batch_id, row.batch_date)}
                        >Edit</button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
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
      )}
    </div>
    </>
  );
};

export default PreviousDayReport;