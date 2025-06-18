import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import PageHeader from './Layout/PageHeader';
import { GridRow } from '../types/GridRow';
import { fetchBatchData, exportBatchDataToExcel } from '../utility/api-utils';


const PreviousDayReportReadOnly = () => {
  const { batchId } = useParams<{ batchId?: string }>();
  const [searchParams] = useSearchParams();
  // Get dates from URL or use defaults
  const startDate = searchParams.get('start') || '';;
  const endDate = searchParams.get('end') || '';
  const [gridData, setGridData] = useState<GridRow[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const rowsPerPage = 10;
  const [error, setError] = useState<string | null>(null);

  const validGridData = gridData.filter(row => row && Object.keys(row).length > 0);
  const totalPages = validGridData.length > 0 ? Math.ceil(validGridData.length / rowsPerPage) : 0;

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
    <div className="container-fluid">
      <PageHeader title="Batch Overview"></PageHeader>
      {/* Error message */}
      {error && <div className="alert alert-danger text-center">{error}</div>}
      <div className="row mb-4">
        <div className="d-flex justify-content-between mb-4">
          <div>
            <span className="me-3">
              Date Range: {startDate} to {endDate}
            </span>
            {batchId && <span>Batch ID: {batchId}</span>}
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

      {gridData.length > 0 && (
        <div className="table-responsive">
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>Batch Date</th>
                <th>Shed No</th>
                <th>Age</th>
                <th>Opening Count</th>
                <th>Mortality</th>
                <th>Culls</th>
                <th>Closing Count</th>
                <th>Table</th>
                <th>Jumbo</th>
                <th>CR</th>
                <th>Total Eggs</th>
              </tr>
            </thead>
            <tbody>
              {validGridData
                .slice(
                  (currentPage - 1) * rowsPerPage,
                  currentPage * rowsPerPage
                )
                .map((row) => (
                  <tr key={`${row.batch_id}-${row.batch_date}`}>
                    {" "}
                    {/* Unique key */}
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
                  </tr>
                ))}
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
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PreviousDayReportReadOnly;