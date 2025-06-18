import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import PageHeader from './Layout/PageHeader';
import { GridRow } from '../types/GridRow';
import { fetchBatchData, exportBatchDataToExcel } from '../utility/api-utils';
import { dailyBatchApi } from '../services/api';


const PreviousDayReport = () => {
  const { batchId } = useParams<{ batchId?: string }>();
  const [searchParams] = useSearchParams();
  // Get dates from URL or use defaults
  const startDate = searchParams.get('start') || '';;
  const endDate = searchParams.get('end') || '';
  const [gridData, setGridData] = useState<GridRow[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const rowsPerPage = 10;
  const [error, setError] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ [key: string]: any }>({});
  const [saving, setSaving] = useState<number | null>(null);

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

  // Sort data by batch_date ascending
  const sortedGridData = validGridData.slice().sort((a, b) => new Date(a.batch_date).getTime() - new Date(b.batch_date).getTime());
  const firstRow = sortedGridData[0];
  const firstRowBatchId = firstRow?.batch_id;
  const firstRowBatchDate = firstRow?.batch_date;

  const handleInputChange = (batch_id: number, batch_date: string, field: string, value: string | number) => {
    setEditValues((prev) => ({ ...prev, [`${batch_id}_${batch_date}_${field}`]: value }));
  };

  const handleSave = async (row: GridRow) => {
    setSaving(row.batch_id);
    // Collect only changed fields for this row
    const changedFields: string[] = [];
    const payload: any = {};
    const possibleFields = [
      'shed_no', 'age', 'opening_count',
      'mortality', 'culls', 'table_eggs', 'jumbo', 'cr',
    ];
    possibleFields.forEach((field) => {
      const key = `${row.batch_id}_${row.batch_date}_${field}`;
      if (editValues.hasOwnProperty(key)) {
        changedFields.push(field);
        payload[field] = editValues[key];
      }
    });
    if (changedFields.length === 0) {
      toast.info('No changes to save');
      return;
    }
    try {
      await (dailyBatchApi as any).updateDailyBatch?.(row.batch_id, row.batch_date, payload); // user will implement this
      toast.success('Updated successfully');
      setEditValues((prev) => {
        const updated = { ...prev };
        changedFields.forEach((field) => delete updated[`${row.batch_id}_${row.batch_date}_${field}`]);
        return updated;
      });
      fetchData();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update');
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="container-fluid">
      <PageHeader title="Batch Overview" />
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

      {sortedGridData.length > 0 && (
        <div className="table-responsive">
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>Batch Date</th>
                <th>Shed No.</th>
                <th>Age</th>
                <th>Opening Count</th>
                <th>Mortality</th>
                <th>Culls</th>
                <th>Closing Count</th>
                <th>Table</th>
                <th>Jumbo</th>
                <th>CR</th>
                <th>Total Eggs</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedGridData
                .slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
                .map((row) => {
                  const isFirst = row.batch_id === firstRowBatchId && row.batch_date === firstRowBatchDate;
                  return (
                    <tr key={`${row.batch_id}-${row.batch_date}`}>
                      <td>{row.batch_date}</td>
                      <td>
                        {isFirst ? (
                          <input
                            type="text"
                            value={editValues[`${row.batch_id}_${row.batch_date}_shed_no`] ?? row.shed_no}
                            onChange={e => handleInputChange(row.batch_id, row.batch_date, 'shed_no', e.target.value)}
                            className="form-control form-control-sm"
                          />
                        ) : (
                          <input
                            type="text"
                            value={row.shed_no}
                            className="form-control form-control-sm"
                            disabled
                            readOnly
                          />
                        )}
                      </td>
                      <td>
                        {isFirst ? (
                          <input
                            type="text"
                            value={editValues[`${row.batch_id}_${row.batch_date}_age`] ?? row.age}
                            onChange={e => handleInputChange(row.batch_id, row.batch_date, 'age', e.target.value)}
                            className="form-control form-control-sm"
                          />
                        ) : (
                          <input
                            type="text"
                            value={row.age}
                            className="form-control form-control-sm"
                            disabled
                            readOnly
                          />
                        )}
                      </td>
                      <td>
                        {isFirst ? (
                          <input
                            type="number"
                            value={editValues[`${row.batch_id}_${row.batch_date}_opening_count`] ?? row.opening_count}
                            onChange={e => handleInputChange(row.batch_id, row.batch_date, 'opening_count', e.target.value)}
                            className="form-control form-control-sm"
                          />
                        ) : (
                          <input
                            type="number"
                            value={row.opening_count}
                            className="form-control form-control-sm"
                            disabled
                            readOnly
                          />
                        )}
                      </td>
                      <td>
                        <input
                          type="number"
                          value={editValues[`${row.batch_id}_${row.batch_date}_mortality`] ?? row.mortality}
                          onChange={e => handleInputChange(row.batch_id, row.batch_date, 'mortality', e.target.value)}
                          className="form-control form-control-sm"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={editValues[`${row.batch_id}_${row.batch_date}_culls`] ?? row.culls}
                          onChange={e => handleInputChange(row.batch_id, row.batch_date, 'culls', e.target.value)}
                          className="form-control form-control-sm"
                        />
                      </td>
                      <td>{row.closing_count}</td>
                      <td>
                        <input
                          type="number"
                          value={editValues[`${row.batch_id}_${row.batch_date}_table_eggs`] ?? row.table_eggs}
                          onChange={e => handleInputChange(row.batch_id, row.batch_date, 'table_eggs', e.target.value)}
                          className="form-control form-control-sm"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={editValues[`${row.batch_id}_${row.batch_date}_jumbo`] ?? row.jumbo}
                          onChange={e => handleInputChange(row.batch_id, row.batch_date, 'jumbo', e.target.value)}
                          className="form-control form-control-sm"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={editValues[`${row.batch_id}_${row.batch_date}_cr`] ?? row.cr}
                          onChange={e => handleInputChange(row.batch_id, row.batch_date, 'cr', e.target.value)}
                          className="form-control form-control-sm"
                        />
                      </td>
                      <td>{row.total_eggs}</td>
                      <td>
                        <button
                          className="btn btn-primary btn-sm"
                          disabled={saving === row.batch_id}
                          onClick={() => handleSave(row)}
                        >
                          {saving === row.batch_id ? 'Saving...' : 'Save'}
                        </button>
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
  );
};

export default PreviousDayReport;