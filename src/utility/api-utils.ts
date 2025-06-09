import { dailyBatchApi } from '../services/api';
import { toast } from 'react-toastify';
import { saveAs } from 'file-saver';
import { GridRow } from '../types/GridRow';

export const fetchBatchData = async (startDate: string, endDate: string, batchId?: string): Promise<GridRow[]> => {
  try {
    const response = await dailyBatchApi.getSnapshot(
      startDate,
      endDate,
      batchId ? Number(batchId) : undefined
    );
    return response.map((batch) => ({
      batch_id: batch.batch_id,
      shed_no: batch.shed_no,
      batch_no: batch.batch_no,
      age: batch.age,
      opening_count: batch.opening_count,
      mortality: batch.mortality,
      culls: batch.culls,
      closing_count: batch.closing_count,
      table_eggs: batch.table_eggs,
      jumbo: batch.jumbo,
      cr: batch.cr,
      total_eggs: batch.total_eggs,
      batch_date: batch.batch_date,
    }));
  } catch (error) {
    console.error('Error fetching data:', error);
    throw new Error('Failed to fetch data');
  }
};

export const exportBatchDataToExcel = (gridData: GridRow[], batchId?: string): void => {
  if (!Array.isArray(gridData) || gridData.length === 0) {
    toast.error('No data to export');
    return;
  }

  const csvContent = [
    [
      'Batch No',
      'Shed No',
      'Batch Date',
      'Age',
      'Opening Count',
      'Mortality',
      'Culls',
      'Closing Count',
      'Table',
      'Jumbo',
      'CR',
      'Total Eggs',
    ],
    ...gridData.map((row) => [
      row.batch_no,
      row.shed_no,
      row.batch_date,
      row.age,
      row.opening_count,
      row.mortality,
      row.culls,
      row.closing_count,
      row.table_eggs,
      row.jumbo,
      row.cr,
      row.total_eggs,
    ]),
  ]
    .map((e) => e.join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `batch_${batchId || 'all'}_report.csv`);
  toast.success('Data exported successfully!');
};