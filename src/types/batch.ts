export interface Batch {
  shed_no: string;
  batch_no: string;
  age: string;   // Format: "week.day" (e.g., "1.1" for 8 days)
  opening_count: number;
  date: string;
  isChickBatch?: boolean;   // Optional field to indicate if it's a chick batch
  closing_date?: string; // Optional field for closing date
  // standard_hen_day_percentage?: number; // 0-100, default 0, accepts up to 2 decimal places
}


export interface BatchResponse {
  id: number;
  shed_no: string;
  batch_no: string;
  age: string;   // Format: "week.day" (e.g., "1.1" for 8 days)
  opening_count: number;
  date: string;
  isChickBatch?: boolean;
  closing_date?: string;
  is_active?: boolean; // Indicates if the batch is currently active
  // standard_hen_day_percentage?: number; // 0-100, default 0, accepts up to 2 decimal places
}

export interface BatchUpdate {
  age: string;
  opening_count: number;
  batch_no: string;
  shed_no: string;
  date: string;
  isChickBatch?: boolean;
  closing_date?: string;
  // standard_hen_day_percentage?: number; // 0-100, default 0, accepts up to 2 decimal places
}