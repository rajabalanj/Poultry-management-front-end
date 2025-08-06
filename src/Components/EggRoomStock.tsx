import React, { useState, useRef } from 'react';
import { useEggRoomStock } from '../hooks/useEggRoomStock';
import { StockFormSection } from '../Components/StockFormSection';
import { DateSelector } from '../Components/DateSelector';
import { SaveControls } from '../Components/SaveControls';
import PageHeader from '../Components/Layout/PageHeader';
import { useMediaQuery } from 'react-responsive';
import { EggRoomStockEntry } from '../types/eggRoomReport';
import { eggRoomReportApi } from '../services/api';
import * as htmlToImage from 'html-to-image';
import { toast } from 'react-toastify';

// Define a common type for the fields to ensure consistency
type StockFieldConfig = {
  key: keyof EggRoomStockEntry;
  label: string;
  disabled?: boolean;
  controlledBy?: keyof EggRoomStockEntry;
};

const sectionConfigs: Array<{
  id: string;
  title: string;
  icon: string;
  color: string;
  fields: StockFieldConfig[];
}> = [
  {
    id: 'table',
    title: 'Table Stock',
    icon: 'bi-box-seam',
    color: 'primary',
    fields: [
      { key: 'table_opening', label: 'Opening', disabled: true },
      { key: 'table_received', label: 'Received' },
      { key: 'table_transfer', label: 'Transfer' },
      { key: 'table_damage', label: 'Damage' },
      { key: 'table_out', label: 'Out (Move to Jumbo)' },
      { key: 'table_in', label: 'In (From Jumbo)', disabled: true, controlledBy: 'jumbo_out' },
    ],
  },
  {
    id: 'jumbo',
    title: 'Jumbo',
    icon: 'bi-egg-fried',
    color: 'primary',
    fields: [
      { key: 'jumbo_opening', label: 'Opening', disabled: true },
      { key: 'jumbo_received', label: 'Received' },
      { key: 'jumbo_transfer', label: 'Transfer' },
      { key: 'jumbo_waste', label: 'Waste' },
      { key: 'jumbo_in', label: 'In (From Table)', disabled: true, controlledBy: 'table_out' },
      { key: 'jumbo_out', label: 'Out (Move to Table)' },
    ],
  },
  {
    id: 'gradec',
    title: 'Grade C',
    icon: 'bi-award',
    color: 'primary',
    fields: [
      { key: 'grade_c_opening', label: 'Opening', disabled: true },
      { key: 'grade_c_shed_received', label: 'Shed Received' },
      { key: 'grade_c_room_received', label: 'Room Received', disabled: true, controlledBy: 'table_damage' },
      { key: 'grade_c_transfer', label: 'Transfer' },
      { key: 'grade_c_labour', label: 'Labour' },
      { key: 'grade_c_waste', label: 'Waste' },
    ],
  },
];

const closingFields: Record<string, keyof EggRoomStockEntry> = {
  table: 'table_closing',
  jumbo: 'jumbo_closing',
  gradec: 'grade_c_closing'
};

const EggRoomStock: React.FC = () => {
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const {
    form,
    loading,
    editing,
    error,
    selectedDate,
    calculateClosings,
    handleChange,
    handleSave,
    handleDelete,
    setSelectedDate,
  } = useEggRoomStock();

  const today = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [dateRangeError, setDateRangeError] = useState<string | null>(null);
  const [reports, setReports] = useState<EggRoomStockEntry[]>([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const [isSharing, setIsSharing] = useState(false);

  const handleFormChange = (field: keyof EggRoomStockEntry, value: number | string) => {
    handleChange(field, value);

    sectionConfigs.forEach(config => {
      config.fields.forEach(f => {
        if (f.controlledBy === field) {
          handleChange(f.key, value);
        }
      });
    });
  };

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

    setReportLoading(true);
    setReportError(null);
    try {
      const response = await eggRoomReportApi.getReports(startDate, endDate);
      const reportsData: EggRoomStockEntry[] = response.map((item: any) => ({
        ...item,
        date: item.report_date
      }));
      setReports(reportsData);
    } catch (err: any) {
      setReportError(err?.message || 'Failed to fetch reports');
    } finally {
      setReportLoading(false);
    }
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

    // Store original inline styles to restore them later
    const originalTableStyle = {
      width: tableNode.style.width,
      minWidth: tableNode.style.minWidth,
      whiteSpace: tableNode.style.whiteSpace,
    };

    try {
      // Temporarily apply styles for a consistent, wide image
      tableNode.style.width = 'auto';
      tableNode.style.minWidth = '1800px'; // Force a wide layout to prevent wrapping
      tableNode.style.whiteSpace = 'nowrap';

      const dataUrl = await htmlToImage.toPng(tableNode, {
        backgroundColor: '#ffffff',
      });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `egg-room-report.png`, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Egg Room Stock Report',
          text: `Egg Room Stock Report from ${startDate} to ${endDate}.`,
          files: [file],
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
      // Restore original styles
      tableNode.style.width = originalTableStyle.width;
      tableNode.style.minWidth = originalTableStyle.minWidth;
      tableNode.style.whiteSpace = originalTableStyle.whiteSpace;
      setIsSharing(false);
    }
  };

  return (
    <>
    <PageHeader title="Egg Room Stock" />
    <div className="container">
      {error && <div className="alert alert-danger text-center">{error}</div>}

      <form onSubmit={handleSave} className="card p-3 mb-4 mt-2">
        <DateSelector
          value={selectedDate}
          onChange={setSelectedDate}
          maxDate={new Date().toISOString().slice(0, 10)}
          disabled={loading}
          label='Report Date'
        />

        {sectionConfigs.map((config) => (
        <StockFormSection
          key={config.id}
          config={config}
          values={form}
          onChange={handleFormChange}
          calculateClosing={(values) => {
            const closingKey = closingFields[config.id];
            const value = calculateClosings(values)[closingKey];
            return typeof value === 'number' ? value : 0;
        }}
          isMobile={isMobile}
        />
      ))}

        <SaveControls
          editing={editing}
          loading={loading}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      </form>

      <div className="card p-3 mb-4 mt-2">
        <h5 className="card-title">View Report</h5>
        <div className="row g-3 align-items-end">
          <div className="col-12 col-md-4">
            <DateSelector
              label="Start Date"
              value={startDate}
              onChange={setStartDate}
              maxDate={endDate || today}
            />
          </div>
          <div className="col-12 col-md-4">
            <DateSelector
              label="End Date"
              value={endDate}
              onChange={setEndDate}
              minDate={startDate}
              maxDate={today}
            />
          </div>
          <div className="col-12 col-md-4">
            <button
              className="btn btn-info w-100"
              onClick={fetchReports}
              disabled={!startDate || !endDate || reportLoading || !!dateRangeError}
            >
              {reportLoading ? 'Loading...' : 'Get Report'}
            </button>
            <button
              className="btn btn-primary w-100 mt-2"
              onClick={handleShare}
              disabled={reports.length === 0 || reportLoading || isSharing}
            >
              {isSharing ? 'Generating...' : 'Share as Image'}
            </button>
          </div>
        </div>
        {dateRangeError && <div className="alert alert-danger text-center mt-2">{dateRangeError}</div>}
      </div>

      {reportError && <div className="alert alert-danger text-center">{reportError}</div>}

      {reports.length > 0 && (
        <div className="table-responsive">
          <table className="table table-bordered" ref={tableRef}>
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
                <th className="text-center">In</th>
                <th className="text-center">Closing</th>
                <th className="text-center">Opening</th>
                <th className="text-center">Received</th>
                <th className="text-center">Transfer</th>
                <th className="text-center">Waste</th>
                <th className="text-center">In</th>
                <th className="text-center">Out</th>
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
                  <td>{r.table_in}</td>
                  <td>{r.table_closing}</td>
                  <td>{r.jumbo_opening}</td>
                  <td>{r.jumbo_received}</td>
                  <td>{r.jumbo_transfer}</td>
                  <td>{r.jumbo_waste}</td>
                  <td>{r.jumbo_in}</td>
                  <td>{r.jumbo_out}</td>
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

export default EggRoomStock;
