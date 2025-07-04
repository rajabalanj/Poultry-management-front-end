import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { EggRoomStockEntry, EggRoomSingleReportResponse } from '../types/eggRoomReport';
import { eggRoomReportApi } from '../services/api';

const defaultEntry = (reportDate?: string): EggRoomStockEntry => ({
  report_date: reportDate || new Date().toISOString().slice(0, 10), // Use report_date
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

export const useEggRoomStock = () => {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [form, setForm] = useState<EggRoomStockEntry>(defaultEntry());
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate closing values
  const calculateClosings = useCallback((entry: EggRoomStockEntry): EggRoomStockEntry => ({
    ...entry,
    table_closing:
      entry.table_opening +
      entry.table_received -
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
      entry.grade_c_room_received -
      entry.grade_c_transfer -
      entry.grade_c_labour -
      entry.grade_c_waste,
  }), []);

  // Simplified to directly map from EggRoomSingleReportResponse, now expecting 'report_date'
  const fromApiEntry = (entry: EggRoomSingleReportResponse): EggRoomStockEntry => {
    return {
      report_date: entry.report_date, // Use report_date
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
    };
  };

  // Fetch data when date changes
  useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    setError(null); // Clear previous errors
    try {
      const response = await eggRoomReportApi.getReport(selectedDate);
      // Ensure the date is a valid string before setting, prioritize report_date
      if (typeof response.report_date === 'string' && response.report_date) {
        setSelectedDate(response.report_date); 
      } else {
        // Fallback: If API response is missing a valid date, keep the current selectedDate
        // to prevent it from becoming "undefined".
        console.warn("API response 'report_date' is invalid, keeping current selectedDate.");
        // No change to selectedDate, it remains what it was before the fetch.
      }
      setForm(fromApiEntry(response));
      setEditing(true);
    } catch (err) {
      console.error("Error fetching report:", err);
      // If fetching fails (e.g., 404), set form to default values for the selectedDate
      setForm(defaultEntry(selectedDate)); // Use the current selectedDate for default
      setEditing(false);
      setError("Failed to load report for this date. It might not exist yet.");
    } finally {
      setLoading(false);
    }
  };
  
  fetchData();
}, [selectedDate]); // Dependency array: re-run when selectedDate changes.

  const handleChange = useCallback((field: keyof EggRoomStockEntry, value: number | string) => {
    setForm(prev => ({
      ...prev,
      [field]: typeof value === 'string' && field !== 'report_date' ? Number(value) : value // Use report_date
    }));
    if (field === 'report_date') setSelectedDate(value as string); // Use report_date
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('Current report_date value:', form.report_date); // Debug log
    console.log('Type of report_date:', typeof form.report_date); // Debug log
    
    // Validation
    if (!form.report_date) {
    toast.error('Please select a valid date');
    return;
    }

    for (const key in form) {
      if (typeof form[key as keyof EggRoomStockEntry] === 'number' && 
          (form[key as keyof EggRoomStockEntry] as number) < 0) {
        setError('Values cannot be negative');
        toast.error('Values cannot be negative');
        return;
      }
    }

    setLoading(true);
  try {
    const apiEntry = calculateClosings(form);

    // Debug log to verify the date
    console.log('Sending report for report_date:', apiEntry.report_date); // Use report_date

    await eggRoomReportApi.updateReport(apiEntry.report_date, apiEntry); // Use report_date
    toast.success('Report saved');
      
      // Refresh data
      const updatedEntry = await eggRoomReportApi.getReport(apiEntry.report_date); // Use report_date
      if (updatedEntry) {
      setForm(fromApiEntry(updatedEntry));
      }
    } catch (err) {
        console.error('Error saving report:', err);
      setError('Failed to save report');
      toast.error('Failed to save report');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = useCallback(async () => {
    setLoading(true);
    try {
      await eggRoomReportApi.deleteReport(form.report_date); // Use report_date
      setForm(defaultEntry(selectedDate));
      setEditing(false);
      toast.success('Report deleted');
    } catch (err) {
      setError('Failed to delete report');
      toast.error('Failed to delete report');
    } finally {
      setLoading(false);
    }
  }, [form.report_date, selectedDate]); // Dependency array should use report_date

  return {
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
  };
};