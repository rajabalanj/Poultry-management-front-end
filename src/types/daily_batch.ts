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
}