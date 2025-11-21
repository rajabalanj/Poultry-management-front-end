export interface GridRow {
    batch_id: number;
    shed_no: string;
    shed_id?: number;
    batch_no: string;
    batch_type?: string;
    batch_date?: string;
    age?: string;
    highest_age?: number;
    opening_count: number;
    mortality: number;
    culls: number;
    closing_count: number;
    table_eggs: number;
    jumbo: number;
    cr: number;
    total_eggs: number;
    hd: number; // Computed field
    standard_hen_day_percentage?: number; // 0-100, default 0, accepts up to 2 decimal places
    actual_feed_consumed?: number;
    standard_feed_consumption?: number | null;
    date_range?: string; // Optional field for date range display
    days_count?: number; // Optional field for days count display
    opening_percent?: number;
    mort_percent?: number;
    culls_percent?: number;
    closing_percent?: number;
    feed_per_bird_per_day_grams?: number;
  }