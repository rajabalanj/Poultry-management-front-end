import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import PageHeader from './Layout/PageHeader';
import { GridRow } from '../types/GridRow';
import { fetchBatchData, exportBatchDataToExcel } from '../utility/api-utils';
import { configApi } from '../services/api';

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

  return (
    <>
    <PageHeader title="Batch Overview" />
    <div className="container-fluid">
      {/* Error message */}
      {error && <div className="alert alert-danger text-center">{error}</div>}
      <div className="row mb-4">
        <div className="d-flex justify-content-between mb-4">
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
          <button
            className="btn btn-success"
            onClick={handleExport}
            disabled={gridData.length === 0}
          >
            Export to Excel
          </button>
        </div>
      </div>

      {validGridData.length > 0 && (
        <div className="table-responsive">
          <table className="table table-bordered">
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