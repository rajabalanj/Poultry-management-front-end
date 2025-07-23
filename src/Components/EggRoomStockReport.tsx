import React, { useState } from 'react';
import { eggRoomReportApi } from '../services/api';
import { EggRoomStockEntry } from '../types/eggRoomReport';
import PageHeader from './Layout/PageHeader';
import { DateSelector } from './DateSelector';
// import './EggRoomStockReport.css'; // Import a new CSS file for custom styles

const EggRoomStockReport: React.FC = () => {
  const today = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [reports, setReports] = useState<EggRoomStockEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRangeError, setDateRangeError] = useState<string | null>(null);

  const fetchReports = async () => {
    if (!startDate || !endDate) {
      setDateRangeError('Please select both a Start Date and an End Date.');
      return;
    }
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      setDateRangeError('End Date cannot be before Start Date.');
      return;
    } else {
      setDateRangeError(null);
    }

    setLoading(true);
    setError(null);
    try {
      const response = await eggRoomReportApi.getReports(startDate, endDate);
      const reportsData: EggRoomStockEntry[] = response.map((item: any) => ({
        ...item,
        date: item.report_date
      }));
      setReports(reportsData);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <PageHeader title="Egg Room Stock Report" />
    <div className="container-fluid">
      <div className="row mb-4">
        <div className="col-md-6 d-flex align-items-end gap-2 flex-wrap">
          <DateSelector
            label="Start Date"
            value={startDate}
            onChange={setStartDate}
            maxDate={endDate || today}
            className="flex-grow-1"
          />
          <DateSelector
            label="End Date"
            value={endDate}
            onChange={setEndDate}
            minDate={startDate}
            maxDate={today}
            className="flex-grow-1"
          />
          <button
            className="btn btn-info ms-2 mb-2"
            onClick={fetchReports}
            disabled={!startDate || !endDate || loading || !!dateRangeError}
          >
            {loading ? 'Loading...' : 'Get Report'}
          </button>
        </div>
      </div>
      {dateRangeError && <div className="alert alert-danger text-center">{dateRangeError}</div>}
      {error && <div className="alert alert-danger text-center">{error}</div>}

      {reports.length > 0 && (
        <div className="table-responsive">
          <table className="table table-bordered">
            <thead>
              <tr>
                <th rowSpan={2} className="text-center align-middle">Date</th>
                <th colSpan={6} className="text-center">Table</th>
                <th colSpan={6} className="text-center">Jumbo</th>
                <th colSpan={7} className="text-center">Grade C</th>
              </tr>
              <tr>
                <th className="text-center">Opening</th>
                <th className="text-center">Received</th>
                <th className="text-center">Transfer</th>
                <th className="text-center">Damage</th>
                <th className="text-center">Out</th>
                <th className="text-center">Closing</th>
                <th className="text-center">Opening</th>
                <th className="text-center">Received</th>
                <th className="text-center">Transfer</th>
                <th className="text-center">Waste</th>
                <th className="text-center">In</th>
                <th className="text-center">Closing</th>
                <th className="text-center">Opening</th>
                <th className="text-center">Shed Received</th>
                <th className="text-center">Room Received</th>
                <th className="text-center">Transfer</th>
                <th className="text-center">Labour</th>
                <th className="text-center">Waste</th>
                <th className="text-center">Closing</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
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
    </>
  );
};

export default EggRoomStockReport;