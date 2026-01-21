export interface DailyBatch {
  is_active?: boolean;
  batch_id: number; // Foreign key to Batch
  shed_no: string;
  batch_no: string;
  uploaded_date: string; // ISO date string
  batch_date: string; // ISO date string
  age: string; // Format: "week.day" (e.g., "1.1")
  opening_count: number;
  mortality: number;
  culls: number;
  closing_count: number;
  table_eggs: number;
  jumbo: number;
  cr: number;
  total_eggs: number; // Computed field
  hd: number; // Computed field
  notes?: string;
  standard_hen_day_percentage?: number; // 0-100, default 0, accepts up to 2 decimal places
  feed_in_kg?: number;
  standard_feed_in_kg?: number;
  batch_type?: string;
  /** Optional shed id returned by some APIs */
  shed_id?: number;
  /** Actual feed consumed (backend field name varies) */
  actual_feed_consumed?: number;
  standard_feed_consumption?: number | null;
  date_range?: string; // Optional field for date range display
  days_count?: number; // Optional field for days count display
  opening_percent?: number;
  mort_percent?: number;
  culls_percent?: number;
  closing_percent?: number;
  feed_per_bird_per_day_grams?: number;
  birds_added: number;
}

export interface SnapshotSummary {
  opening_count: number;
  mortality: number;
  culls: number;
  closing_count: number;
  table_eggs: number;
  jumbo: number;
  cr: number;
  total_eggs: number;
  hd: number;
  standard_hen_day_percentage: number | null;
  highest_age?: number;
  actual_feed_consumed?: number;
  standard_feed_consumption?: number | null;
  hen_housing?: number;
  opening_percent?: number;
  mort_percent?: number;
  culls_percent?: number;
  closing_percent?: number;
  feed_per_bird_per_day_grams?: number;
}

export interface SnapshotResponse {
  details: DailyBatch[];
  // summary can be a DailyBatch-like aggregate or null when not provided
  summary: DailyBatch | null;
}

export interface WeeklyLayerReportResponse extends SnapshotResponse {
  week: number;
  age_range?: string;
  hen_housing?: number;
  cumulative_report?: Record<string, any>;
}