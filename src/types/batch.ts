export interface Batch {
  shed_no: string;
  batch_no: string;
  age: number;   // Format: week.day (e.g., 1.1 for 8 days)
  opening_count: number;
  date: string;
  closing_date?: string; // Optional field for closing date
  // standard_hen_day_percentage?: number; // 0-100, default 0, accepts up to 2 decimal places
}


export interface BatchResponse {
  id: number;
  shed_no: string;
  batch_no: string;
  age: number;   // Format: week.day (e.g., 1.1 for 8 days)
  opening_count: number;
  date: string;
  closing_date?: string;
  shed_change_date?: string;
  is_active?: boolean; // Indicates if the batch is currently active
  batch_type?: string; // Type of the batch (e.g. 'Chick', 'Layer')
  tenant_id?: string;
  /** Current shed if assigned, otherwise null */
  current_shed?: { id: number; shed_no: string } | null;
}

export interface BatchUpdate {
  age: number;
  opening_count: number;
  batch_no: string;
  shed_no: string;
  date: string;
  closing_date?: string;
  shed_change_date?: string;
  // standard_hen_day_percentage?: number; // 0-100, default 0, accepts up to 2 decimal places
}

export interface CreateBatchPayload {
  age: number;
  opening_count: number;
  batch_no: string;
  shed_id: number;
  date: string;
}

export interface CreateBatchResponse {
  id: number;
  age: number;
  opening_count: number;
  batch_no: string;
  date: string;
  tenant_id: string;
  batch_type: string;
}