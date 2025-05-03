import axios, { AxiosError, AxiosResponse } from 'axios';

// Define types for our data
export interface Batch {
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
}

// Define API response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

// Create axios instance with base URL
const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, ''),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});


// Add user ID header handling
let currentUserId: string | null = null;

export const setUserId = (userId: string) => {
  currentUserId = userId;
};

// Update api instance to include user ID header when available
api.interceptors.request.use(
  (config) => {
    console.log('Request URL:', config.url);
    if (currentUserId) {
      config.headers['x-user-id'] = currentUserId;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log('Raw API Response:', response); // Debug log
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      console.error('Error response:', error.response.data);
      console.error('Error status:', error.response.status);
      console.error('Error headers:', error.response.headers);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error setting up request:', error.message);
    }
    return Promise.reject(error);
  }
);

// Validation utilities
export const validateBatchData = {
  age: (value: string): string | null => {
    if (!value.match(/^\d+\.\d+$/)) {
      return 'Age must be in the format week.day (e.g., "1.1")';
    }
    const [week, day] = value.split('.').map(Number);
    if (day < 1 || day > 7) {
      return 'Day must be between 1 and 7';
    }
    if (week < 1) {
      return 'Week must be greater than 0';
    }
    return null;
  },

  nonNegative: (value: number, fieldName: string): string | null => {
    if (value < 0) {
      return `${fieldName} must be greater than or equal to 0`;
    }
    return null;
  }
};

export interface BatchBase {
  /** Age in format "week.day" (e.g., "1.1") */
  age: string;
  /** Number of birds at the start of the day */
  opening_count: number;
  /** Number of birds that died */
  mortality: number;
  /** Number of birds culled */
  culls: number;
  /** Number of table eggs */
  table: number;
  /** Number of jumbo eggs */
  jumbo: number;
  /** Number of crack eggs */
  cr: number;
}

// Default values for new batches
export const DEFAULT_BATCH_VALUES: Partial<BatchCreate> = {
  mortality: 0,
  culls: 0,
  table: 0,
  jumbo: 0,
  cr: 0
};

/** Fields that can be updated in a batch */
export type BatchUpdateFields = Partial<{
  age: string;
  opening_count: number;
  mortality: number;
  culls: number;
  table: number;
  jumbo: number;
  cr: number;
  shed_no: number;
  date: string;
}>;

// Remove closing_count from BatchCreate as it's computed
export interface BatchCreate extends Omit<BatchBase, 'closing_count'> {
  /** Shed number where the batch is located */
  shed_no: number;
}

export interface Batch extends BatchBase {
  /** Unique identifier for the batch */
  id: number;
  /** Shed number where the batch is located */
  shed_no: number;
  /** Auto-generated batch number in format "B-XXXX" */
  batch_no: string;
  /** Date of the record (auto-set to creation date) */
  date: string;
  /** Automatically calculated as opening_count - (mortality + culls) */
  closing_count: number;
  /** Automatically calculated as opening_count - (mortality + culls) */
  calculated_closing_count: number;
  /** Total eggs (table + jumbo + cr) */
  total_eggs: number;
}

// Define the DailyBatch interface to match the backend model
export interface DailyBatch {
  batch_id: number; // Foreign key to Batch
  shed_no: number;
  batch_no: string;
  uploaded_date: string; // ISO date string
  batch_date: string; // ISO date string
  age: string; // Format: "week.day" (e.g., "1.1")
  opening_count: number;
  mortality: number;
  culls: number;
  closing_count: number;
  table: number;
  jumbo: number;
  cr: number;
  total_eggs: number; // Computed field
}

// Helper function to calculate closing count
export const calculateClosingCount = (
  opening_count: number,
  mortality: number = 0,
  culls: number = 0
): number => {
  return opening_count - (mortality + culls);
};

// Helper function to calculate total eggs
export const calculateTotalEggs = (
  table: number = 0,
  jumbo: number = 0,
  cr: number = 0
): number => {
  return table + jumbo + cr;
};

// Helper function to validate a new batch before sending to API
export const validateBatch = (batch: BatchCreate): string[] => {
  const errors: string[] = [];

  // Validate age format
  const ageError = validateBatchData.age(batch.age);
  if (ageError) errors.push(ageError);

  // Validate non-negative values
  const fields: Array<[keyof BatchCreate, string]> = [
    ['opening_count', 'Opening count'],
    ['mortality', 'Mortality'],
    ['culls', 'Culls'],
    ['table', 'Table eggs'],
    ['jumbo', 'Jumbo eggs'],
    ['cr', 'Crack eggs']
  ];

  fields.forEach(([field, label]) => {
    const error = validateBatchData.nonNegative(batch[field] as number, label);
    if (error) errors.push(error);
  });

  return errors;
};

// Helper function to create a new batch with defaults
export const createNewBatch = (data: Partial<BatchCreate>): BatchCreate => {
  return {
    ...DEFAULT_BATCH_VALUES,
    ...data,
  } as BatchCreate;
};

// Define and export API functions
export const batchApi = {
  // Create a new batch with validation
  createBatch: async (batchData: BatchCreate): Promise<Batch> => {
    const errors = validateBatch(batchData);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    try {
      const response = await api.post<Batch>('/batches/', batchData);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.detail || 'Failed to create batch');
      }
      throw error;
    }
  },

  // Get all batches with pagination
  getBatches: async (skip: number = 0, limit: number = 100): Promise<Batch[]> => {
    try {
      const response = await api.get<Batch[]>(`/batches/?skip=${skip}&limit=${limit}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.detail || 'Failed to fetch batches');
      }
      throw error;
    }
  },

  // Get a single batch by ID
  getBatch: async (id: number): Promise<Batch> => {
    try {
      const response = await api.get<Batch>(`/batches/${id}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.detail || 'Failed to fetch batch');
      }
      throw error;
    }
  },

  // Update a batch (using PATCH instead of PUT)
  updateBatch: async (id: number, batchData: BatchUpdateFields): Promise<Batch> => {
    try {
      // Remove any attempt to update computed fields
      const { closing_count, ...updateData } = batchData as any;

      const response = await api.patch<Batch>(`/batches/${id}`, updateData);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.detail || 'Failed to update batch');
      }
      throw error;
    }
  },

  // Delete a batch
  deleteBatch: async (id: number): Promise<void> => {
    try {
      await api.delete(`/batches/${id}`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.detail || 'Failed to delete batch');
      }
      throw error;
    }
  },

  // Fetch daily report as Excel file
  getDailyReportExcel: async (startDate: string, endDate: string): Promise<void> => {
    try {
      const response: AxiosResponse<Blob> = await api.get(
        `/reports/daily-report?start_date=${startDate}&end_date=${endDate}`,
        {
          responseType: 'blob', // Important: Tell Axios to expect a Blob
        }
      );

      // Create a Blob URL for the downloaded file
      const url = window.URL.createObjectURL(new Blob([response.data]));

      // Create a temporary link element to trigger the download
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `daily_report_${startDate}_to_${endDate}.xlsx`); // Set the filename
      document.body.appendChild(link);
      link.click();

      // Clean up the Blob URL
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.detail || 'Failed to fetch daily report');
      }
      throw error;
    }
  },
};

// Move the `getSnapshot` function to a new `dailyBatchApi` object
export const dailyBatchApi = {
  getSnapshot: async (startDate: string, endDate: string, batchId?: number): Promise<DailyBatch[]> => {
    try {
      const response = await api.get<DailyBatch[]>(`/reports/snapshot`, {
        params: {
          start_date: startDate,
          end_date: endDate,
          batch_id: batchId || undefined,
        },
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.detail || 'Failed to fetch snapshot data');
      }
      throw error;
    }
  },
};

export default api;
