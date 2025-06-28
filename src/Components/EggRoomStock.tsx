import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useMediaQuery } from 'react-responsive';
import { eggRoomReportApi } from '../services/api';

// Data model for Egg Room Stock (frontend form state)
export interface EggRoomStockEntry {
  id: number;
  date: string; // ISO date
  // Table section
  table_opening: number;
  table_received: number;
  table_transfer: number;
  table_damage: number;
  table_out: number;
  table_closing: number; // calculated
  // Jumbo section
  jumbo_opening: number;
  jumbo_received: number;
  jumbo_transfer: number;
  jumbo_waste: number;
  jumbo_in: number;
  jumbo_closing: number; // calculated
  // Grade C section
  grade_c_opening: number;
  grade_c_shed_received: number;
  grade_c_room_received: number;
  grade_c_transfer: number;
  grade_c_labour: number;
  grade_c_waste: number;
  grade_c_closing: number; // calculated
}

const defaultEntry = (): EggRoomStockEntry => ({
  id: Date.now(),
  date: new Date().toISOString().slice(0, 10),
  table_opening: 0,
  table_received: 0,
  table_transfer: 0,
  table_damage: 0,
  table_out: 0,
  table_closing: 0,
  jumbo_opening: 0,
  jumbo_received: 0,
  jumbo_transfer: 0,
  jumbo_waste: 0,
  jumbo_in: 0,
  jumbo_closing: 0,
  grade_c_opening: 0,
  grade_c_shed_received: 0,
  grade_c_room_received: 0,
  grade_c_transfer: 0,
  grade_c_labour: 0,
  grade_c_waste: 0,
  grade_c_closing: 0,
});

const EggRoomStock: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [form, setForm] = useState<EggRoomStockEntry>(defaultEntry());
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const [openSection, setOpenSection] = useState<'table' | 'gradec' | 'jumbo' | null>('table');
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
  setLoading(true);
  eggRoomReportApi.getReport(selectedDate)
    .then((entry) => {
      if (entry) {
        setForm(fromApiEntry(entry));
        setEditing(true);
      } else {
        setForm({ ...defaultEntry(), date: selectedDate });
        setEditing(false);
      }
      setError(null);
    })
    .catch(() => {
      setForm({ ...defaultEntry(), date: selectedDate });
      setEditing(false);
      setError(null);
    })
    .finally(() => setLoading(false));
}, [selectedDate]);



  // Calculate closing values
  const calculateClosings = (entry: EggRoomStockEntry): EggRoomStockEntry => ({
    ...entry,
    table_closing:
      entry.table_opening +
      entry.table_received +
      entry.table_transfer -
      entry.table_damage -
      entry.table_out,
    jumbo_closing:
      entry.jumbo_opening +
      entry.jumbo_received +
      entry.jumbo_in -
      entry.jumbo_transfer -
      entry.jumbo_waste,
    grade_c_closing:
      entry.grade_c_opening +
      entry.grade_c_shed_received +
      entry.grade_c_room_received +
      entry.grade_c_transfer -
      entry.grade_c_labour -
      entry.grade_c_waste,
  });

  const handleChange = (field: keyof EggRoomStockEntry, value: number | string) => {
    setForm((prev) => ({ ...prev, [field]: typeof value === 'string' && field !== 'date' ? Number(value) : value }));
    if (field === 'date') setSelectedDate(value as string);
  };

  // Helper to map frontend entry to API entry (for create/update)
  const toApiEntry = (entry: EggRoomStockEntry) => {
    const {
      id,
      date,
      ...rest
    } = calculateClosings(entry);
    return {
      report_date: date,
      ...rest,
    };
  };

  // Helper to map API entry to frontend entry (for form state)
  const fromApiEntry = (entry: any): EggRoomStockEntry => ({
  id: entry.id ?? Date.now(),
  date: entry.report_date || entry.date || new Date().toISOString().slice(0, 10),
  table_opening: entry.table_opening ?? 0,
  table_received: entry.table_received ?? 0,
  table_transfer: entry.table_transfer ?? 0,
  table_damage: entry.table_damage ?? 0,
  table_out: entry.table_out ?? 0,
  table_closing: entry.table_closing ?? 0,
  jumbo_opening: entry.jumbo_opening ?? 0,
  jumbo_received: entry.jumbo_received ?? 0,
  jumbo_transfer: entry.jumbo_transfer ?? 0,
  jumbo_waste: entry.jumbo_waste ?? 0,
  jumbo_in: entry.jumbo_in ?? 0,
  jumbo_closing: entry.jumbo_closing ?? 0,
  grade_c_opening: entry.grade_c_opening ?? 0,
  grade_c_shed_received: entry.grade_c_shed_received ?? 0,
  grade_c_room_received: entry.grade_c_room_received ?? 0,
  grade_c_transfer: entry.grade_c_transfer ?? 0,
  grade_c_labour: entry.grade_c_labour ?? 0,
  grade_c_waste: entry.grade_c_waste ?? 0,
  grade_c_closing: entry.grade_c_closing ?? 0,
});


  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    // Simple validation: check for negative values
    for (const key in form) {
      if (typeof form[key as keyof EggRoomStockEntry] === 'number' && (form[key as keyof EggRoomStockEntry] as number) < 0) {
        setError('Values cannot be negative');
        toast.error('Values cannot be negative');
        return;
      }
    }
    setError(null);
    setLoading(true);
    const apiEntry = toApiEntry(form);
    try {
      await eggRoomReportApi.updateReport(form.date, apiEntry as any); // always use update (PATCH/PUT)
      toast.success('Report saved');
      setEditing(false);
      // Fetch the latest data from backend after save
      const updatedEntry = await eggRoomReportApi.getReport(form.date);
      if (updatedEntry) {
        setForm(fromApiEntry(updatedEntry));
      } else {
        setForm({ ...defaultEntry(), date: selectedDate });
      }
    } catch (err: any) {
      setError('Failed to save report');
      toast.error('Failed to save report');
      console.error('Save error', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await eggRoomReportApi.deleteReport(form.date);
      setForm({ ...defaultEntry(), date: selectedDate });
      setEditing(false);
      toast.success('Report deleted');
    } catch (err: any) {
      setError('Failed to delete report');
      toast.error('Failed to delete report');
    } finally {
      setLoading(false);
    }
  };

  // const handleCancel = () => {
  //   setEditing(false);
  //   setForm({ ...defaultEntry(), date: selectedDate });
  // };

  // Section renderers
  const maxLabelWidth = 110; // px, fits 'Shed Received' and similar

  const renderTableSection = (withTitle: boolean = true) => (
    <div>
      {withTitle && (
        <div className="fw-bold border-bottom pb-1 mb-2 text-success">
          <i className="bi bi-box-seam me-2" />Table Stock
        </div>
      )}
      <div className={isMobile ? '' : 'row g-2 align-items-end'}>
        {['table_opening', 'table_received', 'table_transfer', 'table_damage', 'table_out'].map((field) => (
          <div className={isMobile ? 'mb-2' : 'col'} key={field}>
            {isMobile ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label className="form-label text-capitalize mb-0" style={{ minWidth: maxLabelWidth, width: maxLabelWidth, flexShrink: 0 }}>{field.replace('table_', '').replace('_', ' ')}</label>
                <input
                  type="number"
                  className="form-control"
                  style={{ flex: 1 }}
                  value={form[field as keyof EggRoomStockEntry] as number}
                  onChange={e => handleChange(field as keyof EggRoomStockEntry, e.target.value)}
                  min={0}
                />
              </div>
            ) : (
              <>
                <label className="form-label text-capitalize">{field.replace('table_', '').replace('_', ' ')}</label>
                <input
                  type="number"
                  className="form-control"
                  value={form[field as keyof EggRoomStockEntry] as number}
                  onChange={e => handleChange(field as keyof EggRoomStockEntry, e.target.value)}
                  min={0}
                />
              </>
            )}
          </div>
        ))}
        <div className={isMobile ? 'mb-2' : 'col'}>
          {isMobile ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label className="form-label mb-0" style={{ minWidth: maxLabelWidth, width: maxLabelWidth, flexShrink: 0 }}>Closing</label>
              <input
                type="number"
                className="form-control bg-light"
                value={form.table_closing}
                disabled
                style={{ flex: 1 }}
              />
            </div>
          ) : (
            <>
              <label className="form-label">Closing</label>
              <input
                type="number"
                className="form-control bg-light"
                value={form.table_closing}
                disabled
              />
            </>
          )}
        </div>
      </div>
    </div>
  );

  const renderGradeCSection = (withTitle: boolean = true) => (
    <div>
      {withTitle && (
        <div className="fw-bold border-bottom pb-1 mb-2 text-warning">
          <i className="bi bi-award me-2" />Grade C
        </div>
      )}
      <div className={isMobile ? '' : 'row g-2 align-items-end'}>
        {['grade_c_opening', 'grade_c_shed_received', 'grade_c_room_received', 'grade_c_transfer', 'grade_c_labour', 'grade_c_waste'].map((field) => (
          <div className={isMobile ? 'mb-2' : 'col'} key={field}>
            {isMobile ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label className="form-label text-capitalize mb-0" style={{ minWidth: maxLabelWidth, width: maxLabelWidth, flexShrink: 0 }}>{field.replace('grade_c_', '').replace('_', ' ')}</label>
                <input
                  type="number"
                  className="form-control"
                  style={{ flex: 1 }}
                  value={form[field as keyof EggRoomStockEntry] as number}
                  onChange={e => handleChange(field as keyof EggRoomStockEntry, e.target.value)}
                  min={0}
                />
              </div>
            ) : (
              <>
                <label className="form-label text-capitalize">{field.replace('grade_c_', '').replace('_', ' ')}</label>
                <input
                  type="number"
                  className="form-control"
                  value={form[field as keyof EggRoomStockEntry] as number}
                  onChange={e => handleChange(field as keyof EggRoomStockEntry, e.target.value)}
                  min={0}
                />
              </>
            )}
          </div>
        ))}
        <div className={isMobile ? 'mb-2' : 'col'}>
          {isMobile ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label className="form-label mb-0" style={{ minWidth: maxLabelWidth, width: maxLabelWidth, flexShrink: 0 }}>Closing</label>
              <input
                type="number"
                className="form-control bg-light"
                value={form.grade_c_closing}
                disabled
                style={{ flex: 1 }}
              />
            </div>
          ) : (
            <>
              <label className="form-label">Closing</label>
              <input
                type="number"
                className="form-control bg-light"
                value={form.grade_c_closing}
                disabled
              />
            </>
          )}
        </div>
      </div>
    </div>
  );

  const renderJumboSection = (withTitle: boolean = true) => (
    <div>
      {withTitle && (
        <div className="fw-bold border-bottom pb-1 mb-2 text-primary">
          <i className="bi bi-egg-fried me-2" />Jumbo
        </div>
      )}
      <div className={isMobile ? '' : 'row g-2 align-items-end'}>
        {['jumbo_opening', 'jumbo_received', 'jumbo_transfer', 'jumbo_waste', 'jumbo_in'].map((field) => (
          <div className={isMobile ? 'mb-2' : 'col'} key={field}>
            {isMobile ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label className="form-label text-capitalize mb-0" style={{ minWidth: maxLabelWidth, width: maxLabelWidth, flexShrink: 0 }}>{field.replace('jumbo_', '').replace('_', ' ')}</label>
                <input
                  type="number"
                  className="form-control"
                  style={{ flex: 1 }}
                  value={form[field as keyof EggRoomStockEntry] as number}
                  onChange={e => handleChange(field as keyof EggRoomStockEntry, e.target.value)}
                  min={0}
                />
              </div>
            ) : (
              <>
                <label className="form-label text-capitalize">{field.replace('jumbo_', '').replace('_', ' ')}</label>
                <input
                  type="number"
                  className="form-control"
                  value={form[field as keyof EggRoomStockEntry] as number}
                  onChange={e => handleChange(field as keyof EggRoomStockEntry, e.target.value)}
                  min={0}
                />
              </>
            )}
          </div>
        ))}
        <div className={isMobile ? 'mb-2' : 'col'}>
          {isMobile ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label className="form-label mb-0" style={{ minWidth: maxLabelWidth, width: maxLabelWidth, flexShrink: 0 }}>Closing</label>
              <input
                type="number"
                className="form-control bg-light"
                value={form.jumbo_closing}
                disabled
                style={{ flex: 1 }}
              />
            </div>
          ) : (
            <>
              <label className="form-label">Closing</label>
              <input
                type="number"
                className="form-control bg-light"
                value={form.jumbo_closing}
                disabled
              />
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="container py-4">
      <h2 className="mb-4">Egg Room Stock</h2>
      {error && <div className="alert alert-danger text-center">{error}</div>}
      <form onSubmit={handleSave} className="card p-3 mb-4">
        <div className="mb-2">
          <label>Date:</label>
          <input
            type="date"
            className="form-control w-auto d-inline-block ms-2"
            value={form.date}
            onChange={e => handleChange('date', e.target.value)}
            required
            disabled={loading}
            max={today}
          />
        </div>
        {/* Responsive layout */}
        {isMobile ? (
          <>
            {/* Mobile: Accordion style */}
            <div className="mb-2">
              <div
                className={`fw-bold border-bottom pb-1 mb-2 d-flex align-items-center ${openSection === 'table' ? 'text-primary' : 'text-success'}`}
                style={{ cursor: 'pointer', userSelect: 'none' }}
                onClick={() => setOpenSection(openSection === 'table' ? null : 'table')}
              >
                <i className="bi bi-box-seam me-2" />
                <span className="flex-grow-1">Table Stock</span>
                <span className="ms-2" style={{ fontSize: '1.2em' }}>{openSection === 'table' ? '▼' : '►'}</span>
              </div>
              {openSection === 'table' && <div className="mt-2">{renderTableSection(false)}</div>}
            </div>
            <div className="mb-2">
              <div
                className={`fw-bold border-bottom pb-1 mb-2 d-flex align-items-center ${openSection === 'gradec' ? 'text-primary' : 'text-warning'}`}
                style={{ cursor: 'pointer', userSelect: 'none' }}
                onClick={() => setOpenSection(openSection === 'gradec' ? null : 'gradec')}
              >
                <i className="bi bi-award me-2" />
                <span className="flex-grow-1">Grade C</span>
                <span className="ms-2" style={{ fontSize: '1.2em' }}>{openSection === 'gradec' ? '▼' : '►'}</span>
              </div>
              {openSection === 'gradec' && <div className="mt-2">{renderGradeCSection(false)}</div>}
            </div>
            <div className="mb-2">
              <div
                className={`fw-bold border-bottom pb-1 mb-2 d-flex align-items-center ${openSection === 'jumbo' ? 'text-primary' : 'text-primary'}`}
                style={{ cursor: 'pointer', userSelect: 'none' }}
                onClick={() => setOpenSection(openSection === 'jumbo' ? null : 'jumbo')}
              >
                <i className="bi bi-egg-fried me-2" />
                <span className="flex-grow-1">Jumbo</span>
                <span className="ms-2" style={{ fontSize: '1.2em' }}>{openSection === 'jumbo' ? '▼' : '►'}</span>
              </div>
              {openSection === 'jumbo' && <div className="mt-2">{renderJumboSection(false)}</div>}
            </div>
          </>
        ) : (
          <>
            {/* Desktop: All sections open, styled */}
            <div className="mb-4">{renderTableSection()}</div>
            <div className="mb-4">{renderGradeCSection()}</div>
            <div className="mb-4">{renderJumboSection()}</div>
          </>
        )}
        <div className="mt-3 d-flex gap-2">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {editing ? 'Update' : 'Add'} Report
          </button>
          {editing && (
            <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={loading}>
              Delete
            </button>
          )}
          {/* {editing && (
            <button type="button" className="btn btn-secondary" onClick={handleCancel} disabled={loading}>
              Cancel
            </button>
          )} */}
        </div>
      </form>
    </div>
  );
};

export default EggRoomStock;
