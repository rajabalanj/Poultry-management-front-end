export interface GridRow {
    batch_id: number;
    shed_no: string;
    batch_no: string;
    batch_date: string;
    age: string;
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
  }