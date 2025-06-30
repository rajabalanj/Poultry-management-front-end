import React, { useState } from 'react';
import { eggRoomReportApi } from '../services/api';
import { EggRoomStockEntry } from '../types/eggRoomReport'; // Adjust the import path as necessary
import PageHeader from './Layout/PageHeader';

const EggRoomStockReport: React.FC = () => {
  const today = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reports, setReports] = useState<EggRoomStockEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async () => {
  setLoading(true);
  setError(null);
  try {
    const formattedStartDate = startDate.split('-').reverse().join('-');
      const formattedEndDate = endDate.split('-').reverse().join('-');
    // 1. Get API response
    const response = await eggRoomReportApi.getReports(formattedStartDate, formattedEndDate);
    
    // 2. Extract and flatten entries from all reports
    const reportsData: EggRoomStockEntry[] = response.map((item: any) => ({
        ...item,
        date: item.report_date // Map report_date to date
      }));

    setReports(reportsData);
  } catch (err: any) {
    setError(err?.message || 'Failed to fetch reports');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="container-fluid">
      <PageHeader title="Egg Room Stock Report" />
      <div className="row mb-4">
        <div className="col-md-6 d-flex align-items-end gap-2">
          <div>
            <label>Start Date: </label>
            <input
              type="date"
              className="form-control"
              value={startDate}
              max={today}
              onChange={e => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label>End Date: </label>
            <input
              type="date"
              className="form-control"
              value={endDate}
              max={today}
              min={startDate}
              onChange={e => setEndDate(e.target.value)}
            />
          </div>
          <button className="btn btn-primary ms-2" onClick={fetchReports} disabled={!startDate || !endDate || loading}>
            {loading ? 'Loading...' : 'Get Report'}
          </button>
        </div>
      </div>
      {error && <div className="alert alert-danger text-center">{error}</div>}
      {reports.length > 0 && (
        <div className="table-responsive">
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>Date</th>
                <th>Table Opening</th>
                <th>Table Received</th>
                <th>Table Transfer</th>
                <th>Table Damage</th>
                <th>Table Out</th>
                <th>Table Closing</th>
                <th>Jumbo Opening</th>
                <th>Jumbo Received</th>
                <th>Jumbo Transfer</th>
                <th>Jumbo Waste</th>
                <th>Jumbo In</th>
                <th>Jumbo Closing</th>
                <th>Grade C Opening</th>
                <th>Grade C Shed Received</th>
                <th>Grade C Room Received</th>
                <th>Grade C Transfer</th>
                <th>Grade C Labour</th>
                <th>Grade C Waste</th>
                <th>Grade C Closing</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                // Add a check directly here as a safeguard, though filtering above should prevent this.
                // Using r.id if available, or fall back to date if id is optional and date is reliable unique key
                // For simplicity, sticking to date as key as per original code, assuming it's unique per entry.
                <tr key={r.report_date}>
                  <td>{r.report_date}</td>
                  <td>{r.table_opening}</td>
                  <td>{r.table_received}</td>
                  <td>{r.table_transfer}</td>
                  <td>{r.table_damage}</td>
                  <td>{r.table_out}</td>
                  <td>{r.table_closing}</td>
                  <td>{r.jumbo_opening}</td>
                  <td>{r.jumbo_received}</td>
                  <td>{r.jumbo_transfer}</td>
                  <td>{r.jumbo_waste}</td>
                  <td>{r.jumbo_in}</td>
                  <td>{r.jumbo_closing}</td>
                  <td>{r.grade_c_opening}</td>
                  <td>{r.grade_c_shed_received}</td>
                  <td>{r.grade_c_room_received}</td>
                  <td>{r.grade_c_transfer}</td>
                  <td>{r.grade_c_labour}</td>
                  <td>{r.grade_c_waste}</td>
                  <td>{r.grade_c_closing}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EggRoomStockReport;