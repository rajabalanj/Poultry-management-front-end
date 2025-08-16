export interface DailyBatch {
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
  batch_type?: 'Chick' | 'Layer' | 'Grower';
  date_range?: string; // Optional field for date range display
  days_count?: number; // Optional field for days count display
}