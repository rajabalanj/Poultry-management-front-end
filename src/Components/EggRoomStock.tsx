import React, { useState, useRef, useEffect } from 'react';
import { useEggRoomStock } from '../hooks/useEggRoomStock';
import CustomDatePicker from './Common/CustomDatePicker';
import { StockFormSection } from '../Components/StockFormSection';
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
  readOnly?: boolean;
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
      { key: 'table_opening', label: 'Opening', readOnly: true },
      { key: 'table_received', label: 'Received', readOnly: true },
      { key: 'table_transfer', label: 'Sold(Transfer)', readOnly: true },
      { key: 'table_damage', label: 'Damage' },
      { key: 'table_out', label: 'Out (To Jumbo)' },
      { key: 'table_in', label: 'In (From Jumbo)', readOnly: true, controlledBy: 'jumbo_out' },
    ],
  },
  {
    id: 'jumbo',
    title: 'Jumbo',
    icon: 'bi-egg-fried',
    color: 'primary',
    fields: [
      { key: 'jumbo_opening', label: 'Opening', readOnly: true },
      { key: 'jumbo_received', label: 'Received', readOnly: true },
      { key: 'jumbo_transfer', label: 'Sold(Transfer)', readOnly: true },
      { key: 'jumbo_waste', label: 'Waste' },
      { key: 'jumbo_in', label: 'In (From Table)', readOnly: true, controlledBy: 'table_out' },
      { key: 'jumbo_out', label: 'Out (To Table)' },
    ],
  },
  {
    id: 'gradec',
    title: 'Grade C',
    icon: 'bi-award',
    color: 'primary',
    fields: [
      { key: 'grade_c_opening', label: 'Opening', readOnly: true },
      { key: 'grade_c_shed_received', label: 'Shed Received', readOnly: true },
      { key: 'grade_c_room_received', label: 'Room Received', readOnly: true, controlledBy: 'table_damage' },
      { key: 'grade_c_transfer', label: 'Sold(Transfer)', readOnly: true },
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
    setSelectedDate,
    dateError,
    setSummary,
    summary,
  } = useEggRoomStock();

  const todayDate = new Date();
  const [startDate, setStartDate] = useState<Date | null>(todayDate);
  const [endDate, setEndDate] = useState<Date | null>(todayDate);
  const [dateRangeError, setDateRangeError] = useState<string | null>(null);
  const [reports, setReports] = useState<EggRoomStockEntry[]>([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [suggestedStartDate, setSuggestedStartDate] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<string>('table');
  const stockFormSectionToShareRef = useRef<HTMLDivElement>(null); // New ref for the stock form section

  useEffect(() => {
    if (dateError) {
      const dateMatches = dateError.match(/(\d{4}-\d{2}-\d{2})/g);
      if (dateMatches && dateMatches.length > 1) {
        setSuggestedStartDate(dateMatches[1]);
        setShowDateModal(true);
      }
    }
  }, [dateError]);

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

  const fetchReports = async (overrideStartDate?: string | Date) => {
    const effectiveStartDate = overrideStartDate ?? startDate;

    if (!effectiveStartDate || !endDate) {
      setDateRangeError('Please select both a Start Date and an End Date.');
      return;
    }
    const start = effectiveStartDate instanceof Date ? effectiveStartDate : new Date(effectiveStartDate);
    const end = endDate instanceof Date ? endDate : new Date(endDate);

    if (start > end) {
      setDateRangeError('End Date cannot be before Start Date.');
      return;
    } else {
      setDateRangeError(null);
    }

    setReportLoading(true);
    setReportError(null);
    try {
      const startStr = start.toISOString().slice(0,10);
      const endStr = end.toISOString().slice(0,10);
      const { details, summary: summaryData } = await eggRoomReportApi.getReports(startStr, endStr);
      const reportsData: EggRoomStockEntry[] = details.map((item: any) => ({
        ...item,
        date: item.report_date
      }));
      setReports(reportsData);
      setSummary(summaryData);
    } catch (err: any) {
      const isAxiosError = typeof err === 'object' && err !== null && 'response' in err;
      const detail = isAxiosError ? err.response?.data?.detail : undefined;
      if (typeof detail === 'string') {
        const dateMatches = detail.match(/(\d{4}-\d{2}-\d{2})/g);
        if (dateMatches && dateMatches.length > 1) {
          setSuggestedStartDate(dateMatches[1]);
          setShowDateModal(true);
        } else {
          setReportError("The selected date is before the Egg Room Start Date. Please select a valid date.");
        }
      } else {
        setReportError(err?.message || 'Failed to fetch reports');
      }
    } finally {
      setReportLoading(false);
    }
  };

  const handleConfirmDateChange = () => {
    if (suggestedStartDate) {
      const parsed = new Date(suggestedStartDate);
      console.debug('Confirm suggested start date:', { suggestedStartDate, parsed });
      // If parsed is invalid, warn and abort
      if (isNaN(parsed.getTime())) {
        toast.error(`Suggested date '${suggestedStartDate}' is invalid`);
      } else {
        setStartDate(parsed);
        // If end date is before parsed, bump end date to parsed
        if (endDate && parsed > endDate) {
          setEndDate(parsed);
        }
        // Also update the report date picker to the suggested date
        try {
          setSelectedDate(parsed.toISOString().slice(0,10));
        } catch (e) {
          console.warn('Failed to set selectedDate from suggested date', e);
        }
        // Show a toast so it's obvious in the UI that the date changed
        toast.info(`Start date set to ${parsed.toISOString().slice(0,10)}`);
        fetchReports(parsed);
      }
    }
    setShowDateModal(false);
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

  const handleShareStockForm = async () => {
    if (!stockFormSectionToShareRef.current) {
      toast.error("Stock Form section element not found.");
      return;
    }

    if (!navigator.share) {
      toast.error("Web Share API is not supported in your browser.");
      return;
    }

    const stockFormNode = stockFormSectionToShareRef.current;
    setIsSharing(true);

    // Store original inline styles to restore them later
    let originalStockFormStyle = {
      width: stockFormNode.style.width,
      minWidth: stockFormNode.style.minWidth,
      whiteSpace: stockFormNode.style.whiteSpace,
    };

    // Store original icon elements to restore them later
    const originalIcons = new Map<HTMLElement, ChildNode>();

    try {
      const iconElements = stockFormNode.querySelectorAll('i[class*="bi-"]');
      iconElements.forEach((iconElement: Element) => {
        const placeholder = document.createElement('div');
        placeholder.style.width = '16px';
        placeholder.style.height = '16px';
        placeholder.style.backgroundColor = 'lightgray';
        placeholder.style.display = 'inline-block';
        placeholder.style.marginRight = '5px';
        if (iconElement.parentNode) {
          iconElement.parentNode.replaceChild(placeholder, iconElement);
          originalIcons.set(placeholder, iconElement);
        }
      });

      // Temporarily apply styles for a consistent, wide image
      stockFormNode.style.width = 'auto';
      stockFormNode.style.minWidth = '1500px'; // Adjust as needed
      stockFormNode.style.whiteSpace = 'nowrap';

      const dataUrl = await htmlToImage.toPng(stockFormNode, {
        backgroundColor: '#ffffff',
      });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `egg-room-stock-form-${selectedDate}.png`, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Egg Room Stock Form',
          text: `Egg Room Stock Form for ${selectedDate}.`,
          files: [file],
        });
        toast.success("Stock Form details shared successfully!");
      } else {
        toast.error("Sharing files is not supported on this device.");
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') { // User cancellation should not be treated as an error
        console.error('Sharing failed', error);
        toast.error(`Failed to share stock form details: ${error.message}`);
      }
    } finally {
      // Restore original styles
      stockFormNode.style.width = originalStockFormStyle.width;
      stockFormNode.style.minWidth = originalStockFormStyle.minWidth;
      stockFormNode.style.whiteSpace = originalStockFormStyle.whiteSpace;

      // Restore original icon elements
      originalIcons.forEach((originalIcon: ChildNode, placeholder: HTMLElement) => {
        if (placeholder.parentNode) {
          placeholder.parentNode.replaceChild(originalIcon, placeholder);
        }
      });
      setIsSharing(false);
    }
  };

  return (
    <>
      <PageHeader title="Egg Room Stock" />
      <div className="container">
        {error && <div className="alert alert-danger text-center">{error}</div>}

        <form onSubmit={handleSave} className="card p-3 mb-4 mt-2">
          <div ref={stockFormSectionToShareRef}>
            <div className="row g-3 mb-3">
              <div className="d-flex align-items-center mt-3">
                <label className="form-label me-3 mb-0">Report Date</label>
                <CustomDatePicker
                  selected={selectedDate ? new Date(selectedDate) : null}
                  onChange={(date: Date | null) => date && setSelectedDate(date.toISOString().slice(0, 10))}
                  maxDate={new Date()}
                  disabled={loading}
                  className="form-control"
                  dateFormat="dd-MM-yyyy"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  placeholderText="Select Report Date"
                />
              </div>
            </div>

            {sectionConfigs.map((config) => (
              <StockFormSection
                key={config.id}
                config={config}
                values={form}
                onChange={handleFormChange}
                calculateClosing={(values) => {
                  const closingKey = closingFields[config.id];
                  const value = calculateClosings(values)[closingKey];
                  return typeof value === "number" ? value : 0;
                }}
                isMobile={isMobile}
              />
            ))}
          </div>

          <div className="col-12 col-md-4 d-flex gap-2 mb-2 mt-3">
            <SaveControls
              editing={editing}
              loading={loading}
              onSave={handleSave}
              className=""
              style={{ minWidth: '140px' }}
            />
            <button
              type="button"
              className="btn btn-info"
              onClick={handleShareStockForm}
              disabled={isSharing}
              style={{ minWidth: '140px' }}
            >
              {isSharing ? "Generating..." : "Share as Image"}
            </button>
          </div>
        </form>

        <div className="card p-3 mb-4 mt-2">
          <h5 className="card-title">View Report</h5>
          <div className="row g-3 mb-3">
          <div className="col-auto d-flex align-items-center mt-3">
            <label className="form-label me-3 mb-0">Start Date</label>
            <CustomDatePicker
              selected={startDate}
              onChange={(date: Date | null) => date && setStartDate(date)}
              maxDate={endDate || new Date()}
              dateFormat="dd-MM-yyyy"
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
              className="form-control"
              placeholderText="Start Date"
              key={`start-date-${startDate ? startDate.toISOString().slice(0,10) : ''}`}
            />
          </div>
          <div className="col-auto d-flex align-items-center mt-3">
            <label className="form-label me-3 mb-0">End Date</label>
            <CustomDatePicker
              selected={endDate}
              onChange={(date: Date | null) => date && setEndDate(date)}
              minDate={startDate || undefined}
              maxDate={todayDate}
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
              className="form-control"
              dateFormat="dd-MM-yyyy"
              placeholderText="End Date"
            />
          </div>
          </div>
            <div className="col-12 col-md-4 d-flex gap-2 mb-2 mt-3">
              <button
                className="btn btn-primary"
                onClick={() => fetchReports()}
                disabled={
                  !startDate || !endDate || reportLoading || !!dateRangeError
                }
                style={{ minWidth: '140px' }}
              >
                {reportLoading ? "Loading..." : "Get Report"}
              </button>
              <button
                className="btn btn-info"
                onClick={handleShare}
                disabled={reports.length === 0 || reportLoading || isSharing}
                style={{ minWidth: '140px' }}
              >
                {isSharing ? "Generating..." : "Share as Image"}
              </button>
            </div>
          
          {dateRangeError && (
            <div className="text-danger mt-2">
              {dateRangeError}
            </div>
          )}
        </div>

        
        {reportError && (
          <div className="alert alert-danger text-center">{reportError}</div>
        )}

        {showDateModal && (
          <div
            className="modal show"
            tabIndex={-1}
            style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Invalid Start Date</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowDateModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <p>
                    The selected date is before the system start date. Would you
                    like to use the earliest available date,{" "}
                    {suggestedStartDate}?
                  </p>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowDateModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleConfirmDateChange}
                  >
                    Use Suggested Date
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {reports.length > 0 && (
          <div className="table-responsive">
            <ul className="nav nav-tabs">
              {sectionConfigs.map((config) => (
                <li className="nav-item" key={config.id}>
                  <button
                    className={`nav-link ${
                      activeTab === config.id ? "active" : ""
                    }`}
                    onClick={() => setActiveTab(config.id)}
                  >
                    {config.title}
                  </button>
                </li>
              ))}
            </ul>
            <table className="table table-bordered" ref={tableRef}>
              <thead>
                <tr>
                  <th className="text-center align-middle">Date</th>
                  {sectionConfigs
                    .find((c) => c.id === activeTab)
                    ?.fields.map((field) => (
                      <th key={field.key} className="text-center">
                        {field.label}
                      </th>
                    ))}
                  <th className="text-center">Closing</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.report_date}>
                    <td>{r.report_date}</td>
                    {sectionConfigs
                      .find((c) => c.id === activeTab)
                      ?.fields.map((field) => {
                        const value = r[field.key];
                        return (
                          <td key={field.key}>
                            {typeof value === "number"
                              ? value
                              : String(value ?? "")}
                          </td>
                        );
                      })}
                    <td>{r[closingFields[activeTab]]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {summary && (
          <div className="card p-3 mb-4 mt-2">
            <h5 className="card-title">Report Summary</h5>
            <div className="row g-3">
              <div className="col-md-4"><span className="fw-bold">Table Opening:</span> {summary.table_opening}</div>
              <div className="col-md-4"><span className="fw-bold">Table Closing:</span> {summary.table_closing}</div>
              <div className="col-md-4"><span className="fw-bold">Table Received:</span> {summary.total_table_received}</div>
              <div className="col-md-4"><span className="fw-bold">Table Transfer:</span> {summary.total_table_transfer}</div>
              <div className="col-md-4"><span className="fw-bold">Table Damage:</span> {summary.total_table_damage}</div>
              <div className="col-md-4"><span className="fw-bold">Table Out:</span> {summary.total_table_out}</div>
              <div className="col-md-4"><span className="fw-bold">Table In:</span> {summary.total_table_in}</div>
            </div>
            <hr />
            <div className="row g-3">
              <div className="col-md-4"><span className="fw-bold">Jumbo Opening:</span> {summary.jumbo_opening}</div>
              <div className="col-md-4"><span className="fw-bold">Jumbo Closing:</span> {summary.jumbo_closing}</div>
              <div className="col-md-4"><span className="fw-bold">Jumbo Received:</span> {summary.total_jumbo_received}</div>
              <div className="col-md-4"><span className="fw-bold">Jumbo Transfer:</span> {summary.total_jumbo_transfer}</div>
              <div className="col-md-4"><span className="fw-bold">Jumbo Waste:</span> {summary.total_jumbo_waste}</div>
              <div className="col-md-4"><span className="fw-bold">Jumbo In:</span> {summary.total_jumbo_in}</div>
              <div className="col-md-4"><span className="fw-bold">Jumbo Out:</span> {summary.total_jumbo_out}</div>
            </div>
            <hr />
            <div className="row g-3">
              <div className="col-md-4"><span className="fw-bold">Grade C Opening:</span> {summary.grade_c_opening}</div>
              <div className="col-md-4"><span className="fw-bold">Grade C Closing:</span> {summary.grade_c_closing}</div>
              <div className="col-md-4"><span className="fw-bold">Grade C Shed Received:</span> {summary.total_grade_c_shed_received}</div>
              <div className="col-md-4"><span className="fw-bold">Grade C Room Received:</span> {summary.total_grade_c_room_received}</div>
              <div className="col-md-4"><span className="fw-bold">Grade C Transfer:</span> {summary.total_grade_c_transfer}</div>
              <div className="col-md-4"><span className="fw-bold">Grade C Labour:</span> {summary.total_grade_c_labour}</div>
              <div className="col-md-4"><span className="fw-bold">Grade C Waste:</span> {summary.total_grade_c_waste}</div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default EggRoomStock;