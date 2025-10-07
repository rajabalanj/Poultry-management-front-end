import { dailyBatchApi, reportsApi } from '../services/api';
import { toast } from 'react-toastify';
import { saveAs } from 'file-saver';
import { GridRow } from '../types/GridRow';
import { DailyBatch } from '../types/daily_batch';

export const fetchWeeklyLayerReport = async (batchId: string, week: string): Promise<{ details: GridRow[], summary: DailyBatch | null, week: number, age_range: string, hen_housing: number }> => {
  try {
    const response = await reportsApi.getWeeklyLayerReport(
      Number(batchId),
      Number(week)
    );

    const { details, summary, week: responseWeek, age_range, hen_housing } = response;

    const mapBatchToGridRow = (batch: any): GridRow => ({
      batch_id: batch.batch_id,
      shed_no: batch.shed_no,
      batch_no: batch.batch_no,
      batch_type: batch.batch_type,
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
      hd: batch.hd,
      standard_hen_day_percentage: batch.standard_hen_day_percentage || 0,
      actual_feed_consumed: batch.actual_feed_consumed,
      standard_feed_consumption: batch.standard_feed_consumption,
    });

    const mappedDetails = details.map(mapBatchToGridRow);

    return { details: mappedDetails, summary, week: responseWeek, age_range, hen_housing };
  } catch (error) {
    console.error('Error fetching data:', error);
    throw new Error('Failed to fetch data');
  }
};

export const fetchBatchData = async (startDate: string, endDate: string, batchId?: string): Promise<{ details: GridRow[], summary: DailyBatch | null }> => {
  try {
    const response = await dailyBatchApi.getSnapshot(
      startDate,
      endDate,
      batchId ? Number(batchId) : undefined
    );

    let details: GridRow[];
    let summary: DailyBatch | null = null;

    const mapBatchToGridRow = (batch: any): GridRow => ({
      batch_id: batch.batch_id,
      shed_no: batch.shed_no,
      batch_no: batch.batch_no,
      batch_type: batch.batch_type,
      age: batch.age,
      highest_age: batch.highest_age,
      opening_count: batch.opening_count,
      mortality: batch.mortality,
      culls: batch.culls,
      closing_count: batch.closing_count,
      table_eggs: batch.table_eggs,
      jumbo: batch.jumbo,
      cr: batch.cr,
      total_eggs: batch.total_eggs,
      batch_date: batch.batch_date,
      hd: batch.hd,
      standard_hen_day_percentage: batch.standard_hen_day_percentage || 0,
      actual_feed_consumed: batch.actual_feed_consumed,
      standard_feed_consumption: batch.standard_feed_consumption,
    });

    if (Array.isArray(response)) {
      // Case where batchId is provided and API returns an array
      details = response.map(mapBatchToGridRow);
    } else {
      // Case where batchId is not provided and API returns an object
      details = response.details.map(mapBatchToGridRow);
      summary = response.summary;
    }

    return { details, summary };
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
      'Opening',
      'Mortality',
      'Culls',
      'Closing Count',
      'Table',
      'Jumbo',
      'CR',
      'Total Eggs',
      'HD',
      'Standard HD Percentage',
      'Actual Feed Consumed',
      'Standard Feed Consumption',
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
      row.hd,
      row.standard_hen_day_percentage?.toFixed(2), // Ensure 2 decimal places
      row.actual_feed_consumed,
      row.standard_feed_consumption,
    ]),
  ]
    .map((e) => e.join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `batch_${batchId || 'all'}_report.csv`);
  toast.success('Data exported successfully!');
};
