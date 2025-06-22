export interface Batch {
  shed_no: string;
  batch_no: string;
  age: string;   // Format: "week.day" (e.g., "1.1" for 8 days)
  opening_count: number;
  date: string;
  isChickBatch?: boolean;   // Optional field to indicate if it's a chick batch
}


export interface BatchResponse {
  id: number;
  shed_no: string;
  batch_no: string;
  age: string;   // Format: "week.day" (e.g., "1.1" for 8 days)
  opening_count: number;
  date: string;
  isChickBatch?: boolean;
}

export interface BatchUpdate {
  age: string;
  opening_count: number;
  batch_no: string;
  shed_no: string;
  date: string;
  isChickBatch?: boolean;
}