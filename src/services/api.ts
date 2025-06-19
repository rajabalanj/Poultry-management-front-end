import axios, { AxiosError, AxiosResponse } from 'axios';
import { Feed, FeedResponse } from '../types/Feed';
import { BatchResponse, Batch, BatchUpdate } from '../types/batch';
import { CompositionResponse } from '../types/compositon';
import { DailyBatch } from '../types/daily_batch';

// Define types for our data

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

// Default values for new batches
export const DEFAULT_BATCH_VALUES: Partial<Batch> = {
  mortality: 0,
  culls: 0,
  table_eggs: 0,
  jumbo: 0,
  cr: 0,
  date: new Date().toISOString().split('T')[0], // Set to today's date
};

/** Fields that can be updated in a batch */
export type BatchUpdateFields = Partial<BatchUpdate>;

// Define the DailyBatch interface to match the backend model


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
  table_eggs: number = 0,
  jumbo: number = 0,
  cr: number = 0
): number => {
  return table_eggs + jumbo + cr;
};

// Helper function to validate a new batch before sending to API
export const validateBatch = (batch: Batch): string[] => {
  const errors: string[] = [];

  // Validate age format
  const ageError = validateBatchData.age(batch.age);
  if (ageError) errors.push(ageError);

  // Validate non-negative values
  const fields: Array<[keyof Batch, string]> = [
    ['opening_count', 'Opening count'],
    ['mortality', 'Mortality'],
    ['culls', 'Culls'],
    ['table_eggs', 'Table eggs'],
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
export const createNewBatch = (data: Partial<Batch>): Batch => {
  return {
    ...DEFAULT_BATCH_VALUES,
    ...data,
  } as Batch;
};

// Helper to extract error message
function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.detail || error.message || fallback;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}

// Define and export API functions
export const batchApi = {
  // Create a new batch with validation
  createBatch: async (batchData: Batch): Promise<Batch> => {
    const errors = validateBatch(batchData);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
    try {
      const response = await api.post<Batch>('/batches/', batchData);
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to create batch'));
    }
  },

  // Get all batches with pagination
  getBatches: async (skip: number = 0, limit: number = 100): Promise<BatchResponse[]> => {
    try {
      const response = await api.get<BatchResponse[]>(`/batches/fallback/?skip=${skip}&limit=${limit}`);
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to fetch batches'));
    }
  },

  // Get a single batch by ID
  getBatch: async (id: number): Promise<BatchResponse> => {
    try {
      const response = await api.get<BatchResponse>(`/batches/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to fetch batch'));
    }
  },

  getBatchFallback: async (id: number): Promise<BatchResponse> => {
  try {
    const response = await api.get<BatchResponse>(`/batches/${id}/fallback`);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Failed to fetch batch fallback'));
  }
},

  // Update a batch (using PATCH instead of PUT)
  updateBatch: async (id: number, batchData: BatchUpdateFields): Promise<BatchUpdateFields> => {
    try {
      // Remove any attempt to update computed fields
      const { closing_count, ...updateData } = batchData as any;

      const response = await api.patch<BatchUpdateFields>(`/batches/${id}`, updateData);
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to update batch'));
    }
  },

  // Delete a batch
  deleteBatch: async (id: number): Promise<void> => {
    try {
      await api.delete(`/batches/${id}`);
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to delete batch'));
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
      throw new Error(getApiErrorMessage(error, 'Failed to fetch daily report'));
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
      throw new Error(getApiErrorMessage(error, 'Failed to fetch snapshot data'));
    }
  },

  // Create a new daily batch record
  createDailyBatch: async (batchData: Omit<DailyBatch, 'batch_id' | 'total_eggs' | 'hd'>): Promise<DailyBatch> => {
    try {
      const response = await api.post<DailyBatch>(`/daily-batch/`, batchData);
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to create daily batch'));
    }
  },

  // Upload Excel file for daily batches
  uploadExcel: async (formData: FormData): Promise<void> => {
    try {
      await api.post('/daily-batch/upload-excel/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to upload Excel file'));
    }
  },
  
  // PATCH daily batch by batch_id and batch_date
  updateDailyBatch: async (batch_id: number, batch_date: string, payload: Partial<DailyBatch>): Promise<DailyBatch> => {
    // Convert batch_date to yyyy-mm-dd if needed
    let formattedDate = batch_date;
    if (/^\d{2}-\d{2}-\d{4}$/.test(batch_date)) {
      // dd-mm-yyyy -> yyyy-mm-dd
      const [dd, mm, yyyy] = batch_date.split('-');
      formattedDate = `${yyyy}-${mm}-${dd}`;
    }
    try {
      const response = await api.patch<DailyBatch>(`/daily-batch/${batch_id}/${formattedDate}`, payload);
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to update daily batch'));
    }
  }
};

export const feedApi = {
  createFeed: async (feedData: Feed): Promise<Feed> => {
    console.log('Request body:', feedData);
    try {
      const response = await api.post<Feed>("/feed/", feedData);
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to create feed'));
    }
  },

  getFeeds: async (skip: number = 0, limit: number = 100): Promise<FeedResponse[]> => {
    try {
      const response = await api.get<FeedResponse[]>(`/feed/all/?skip=${skip}&limit=${limit}`);
      console.log('Response data:', response.data); // Debug log
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to fetch feeds'));
    }
  },

  getFeed: async (id: number): Promise<FeedResponse> => {
    try {
      const response = await api.get<FeedResponse>(`/feed/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to fetch feed'));
    }
  },

  updateFeed: async (id: number, feedData: FeedResponse): Promise<FeedResponse> => {
    try {
      const response = await api.patch<FeedResponse>(`/feed/${id}`, feedData);
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to update feed'));
    }
  },

  deleteFeed: async (id: number): Promise<void> => {
    try {
      await api.delete(`/feed/${id}`);
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to delete feed'));
    }
  },
};

// Composition API for create, read, update, delete

export const compositionApi = {
  createComposition: async (composition: Omit<CompositionResponse, 'id'>): Promise<CompositionResponse> => {
    try {
      const response = await api.post<CompositionResponse>('/compositions/', composition);
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to create composition'));
    }
  },
  getCompositions: async (): Promise<CompositionResponse[]> => {
    try {
      const response = await api.get<CompositionResponse[]>('/compositions/');
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to fetch compositions'));
    }
  },
  getComposition: async (id: number): Promise<CompositionResponse> => {
    try {
      const response = await api.get<CompositionResponse>(`/compositions/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to fetch composition'));
    }
  },
  updateComposition: async (id: number, composition: Omit<CompositionResponse, 'id'>): Promise<CompositionResponse> => {
    try {
      const response = await api.patch<CompositionResponse>(`/compositions/${id}`, composition);
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to update composition'));
    }
  },
  deleteComposition: async (id: number): Promise<void> => {
    try {
      await api.delete(`/compositions/${id}`);
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to delete composition'));
    }
  },

  useComposition: async ({ compositionId, times, usedAt }: { compositionId: number, times: number, usedAt: string }) => {
    try {
      await api.post('/compositions/use-composition', {
        compositionId,
        times,
        usedAt,
      });
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to use composition'));
    }
  },

  getCompositionUsageHistory: async (compositionId?: number) => {
    try {
      const response = await api.get('/compositions/usage-history', {
        params: compositionId ? { composition_id: compositionId } : {},
      });
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to fetch composition usage history'));
    }
  },

  getCompositionUsageHistoryById: async (compositionId: number) => {
    try {
      const response = await api.get(`/compositions/${compositionId}/usage-history`);
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to fetch composition usage history'));
    }
  },
};

// Configuration API for low stock thresholds and other settings
export interface AppConfig {
  id?: number; // optional, for update
  lowKgThreshold: number;
  lowTonThreshold: number;
  // Add more config fields as needed
}

export const configApi = {
  // Create a new configuration (POST)
  createConfig: async (config: AppConfig): Promise<AppConfig> => {
    try {
      const response = await api.post<AppConfig>('/configurations/', config);
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to create configuration'));
    }
  },

  // Get configuration (GET)
  getConfig: async (): Promise<AppConfig> => {
    try {
      const response = await api.get<AppConfig>('/configurations/');
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to fetch configuration'));
    }
  },

  // Update configuration (PATCH)
  updateConfig: async (id: number, config: Partial<AppConfig>): Promise<AppConfig> => {
    try {
      const response = await api.patch<AppConfig>(`/configurations/${id}/`, config);
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to update configuration'));
    }
  },
};

export default api;
