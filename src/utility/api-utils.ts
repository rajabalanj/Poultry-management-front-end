import { dailyBatchApi, reportsApi } from '../services/api';
import { GridRow } from '../types/GridRow';
import { DailyBatch } from '../types/daily_batch';

export interface CumulativeReport {
  section1: {
    cum_feed: {
      cum: number;
      actual: number;
      standard: number;
      diff: number;
    };
    weekly_feed: {
      cum: number;
      actual: number;
      standard: number;
      diff: number;
    };
    cum_egg: {
      cum: number;
      actual: number;
      standard: number;
      diff: number;
    };
    weekly_egg: {
      cum: number;
      actual: number;
      standard: number;
      diff: number;
    };
  };
  section2: {
    livability: {
      actual: number;
      standard: number;
      diff: number;
    };
    feed_grams: {
      actual: number;
      standard: number;
      diff: number;
    };
  };
}

export const fetchWeeklyLayerReport = async (batchId: string, week: string): Promise<{ details: GridRow[], summary: DailyBatch | null, week: number, age_range?: string, hen_housing?: number, cumulative_report: CumulativeReport | null }> => {
  try {
    const response = await reportsApi.getWeeklyLayerReport(
      Number(batchId),
      Number(week)
    );

    const { details, summary, week: responseWeek, age_range, hen_housing, cumulative_report } = response;

    const mapBatchToGridRow = (batch: any): GridRow => ({
      is_active: batch.is_active,
      batch_id: batch.batch_id,
      shed_id: batch.shed_id,
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
      standard_feed_consumption: batch.standard_feed_consumption ?? undefined,
      opening_percent: batch.opening_percent,
      mort_percent: batch.mort_percent,
      culls_percent: batch.culls_percent,
      closing_percent: batch.closing_percent,
      feed_per_bird_per_day_grams: batch.feed_per_bird_per_day_grams,
    });

    const mappedDetails = (details || []).map(mapBatchToGridRow);

    // Normalize cumulative_report into CumulativeReport | null when possible
    let normalizedCumulative: CumulativeReport | null = null;
    if (cumulative_report && typeof cumulative_report === 'object') {
      // Basic validation: ensure expected sections exist
      if (cumulative_report.section1 && cumulative_report.section2) {
        normalizedCumulative = cumulative_report as CumulativeReport;
      }
    }

    return { details: mappedDetails, summary: summary as DailyBatch | null, week: responseWeek, age_range, hen_housing, cumulative_report: normalizedCumulative };
  } catch (error: any) {
    console.error('Error fetching data:', error);
    throw new Error(error.message || 'Failed to fetch data');
  }
};

export const fetchBatchData = async (start_date: string, end_date: string, batch_id?: string) => {
  const response = await dailyBatchApi.getSnapshot(
    start_date,
    end_date,
    batch_id ? Number(batch_id) : undefined
  );

  const mapBatchToGridRow = (batch: any): GridRow => ({
    is_active: batch.is_active,
    batch_id: batch.batch_id,
    shed_id: batch.shed_id,
    shed_no: batch.shed_no || '', // Fallback, will be populated in component
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
    standard_feed_consumption: batch.standard_feed_consumption ?? undefined,
    opening_percent: batch.opening_percent,
    mort_percent: batch.mort_percent,
    culls_percent: batch.culls_percent,
    closing_percent: batch.closing_percent,
    feed_per_bird_per_day_grams: batch.feed_per_bird_per_day_grams,
  });

  // If API returned the snapshot structure with details & summary
  if ('details' in response && 'summary' in response) {
    const { details, summary } = response as any;
    const mappedDetails = (details || []).map(mapBatchToGridRow);

    return {
      details: mappedDetails,
      summary: summary as DailyBatch | null,
    };
  }

  // Otherwise API may return an array of DailyBatch directly
  return {
    details: (response as DailyBatch[]).map(mapBatchToGridRow),
    summary: null,
  };
};
