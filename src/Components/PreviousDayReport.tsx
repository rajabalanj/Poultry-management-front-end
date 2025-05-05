import React, { useEffect, useState } from 'react';
import { useLocation, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import PageHeader from './PageHeader';
import { GridRow } from '../types/GridRow';
import { fetchBatchData, exportBatchDataToExcel } from '../utility/api-utils';



const PreviousDayReport = () => {
  const { batchId } = useParams<{ batchId?: string }>();
  const [searchParams] = useSearchParams();
  // Get dates from URL or use defaults
  const startDate = searchParams.get('start') || '';;
  const endDate = searchParams.get('end') || '';
  const [gridData, setGridData] = useState<GridRow[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const rowsPerPage = 10;

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
    } catch (error) {
      toast.error('Failed to fetch data');
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
      <PageHeader title="Batch Report"></PageHeader>
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
                .map((row, index) => (
                  <tr key={index}>
                    <td>{row.batch_date}</td>
                    <td>{row.age}</td>
                    <td>{row.opening_count}</td>
                    <td>{row.mortality}</td>
                    <td>{row.culls}</td>
                    <td>{row.closing_count}</td>
                    <td>{row.table}</td>
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

export default PreviousDayReport;