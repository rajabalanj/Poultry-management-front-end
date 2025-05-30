export interface Batch {
  shed_no: number;
  batch_no: string;
  age: string;   // Format: "week.day" (e.g., "1.1" for 8 days)
  opening_count: number;
  mortality: number;
  culls: number;
  closing_count: number;
  table: number;
  jumbo: number;
  cr: number;
  date: string;
}


export interface BatchResponse {
  id: number;
  shed_no: number;
  batch_no: string;
  age: string;   // Format: "week.day" (e.g., "1.1" for 8 days)
  opening_count: number;
  mortality: number;
  culls: number;
  closing_count: number;
  table: number;
  jumbo: number;
  cr: number;
  date: string;
  calculated_closing_count: number;   // Computed field from backend
  total_eggs: number;   // Computed field from backend
  HD: number;   // Computed field from backend
}

export interface BatchUpdate {
  age: string;
  opening_count: number;
  mortality: number;
  culls: number;
  table: number;
  jumbo: number;
  cr: number;
  shed_no: number;
  date: string;
}