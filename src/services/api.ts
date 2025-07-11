import axios, { AxiosError } from 'axios';
import { Feed, FeedResponse } from '../types/Feed';
import { CompositionResponse } from '../types/compositon';
import { DailyBatch } from '../types/daily_batch';
import { Batch, BatchResponse, BatchUpdate } from '../types/batch';
import { EggRoomReportResponse, EggRoomReportCreate, EggRoomReportUpdate, EggRoomSingleReportResponse } from '../types/eggRoomReport';
import { FeedAudit } from '../types/feed_audit';
import { Medicine, MedicineResponse } from '../types/Medicine';
import { BovansPerformance, PaginatedBovansPerformanceResponse } from "../types/bovans"; // Ensure this import is present
import { MedicineAudit } from '../types/medicine_audit';

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

/** Fields that can be updated in a batch */
// export type BatchUpdateFields = Partial<BatchUpdate>;

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
    // Convert batch_date to YYYY-mm-dd if needed
    let formattedDate = batch_date;
    if (/^\d{2}-\d{2}-\d{4}$/.test(batch_date)) {
      // dd-mm-yyyy -> YYYY-mm-dd
      const [dd, mm, yyyy] = batch_date.split('-');
      formattedDate = `${yyyy}-${mm}-${dd}`;
    }
    try {
      const response = await api.patch<DailyBatch>(`/daily-batch/${batch_id}/${formattedDate}`, payload);
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to update daily batch'));
    }
  },

  getDailyBatches: async (batch_date: string): Promise<DailyBatch[]> => {
    try {
      const response = await api.get<DailyBatch[]>(`/daily-batch/?batch_date=${batch_date}`);
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to fetch daily batches'));
    }
  },
  
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
  getFeedAudit: async (feed_id: number): Promise<FeedAudit[]> => {
  try {
    const response = await api.get<FeedAudit[]>(`/feed/${feed_id}/audit/`);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Failed to fetch feed audit report'));
  }
},
};

export const medicineApi = {
  createMedicine: async (medicineData: Medicine): Promise<Medicine> => {
    console.log('Request body:', medicineData);
    try {
      const response = await api.post<Medicine>("/medicine/", medicineData);
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to create medicine'));
    }
  },

  getMedicines: async (skip: number = 0, limit: number = 100): Promise<MedicineResponse[]> => {
    try {
      const response = await api.get<MedicineResponse[]>(`/medicine/all/?skip=${skip}&limit=${limit}`);
      console.log('Response data:', response.data); // Debug log
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to fetch medicines'));
    }
  },

  getMedicine: async (id: number): Promise<MedicineResponse> => {
    try {
      const response = await api.get<MedicineResponse>(`/medicine/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to fetch medicine'));
    }
  },

  updateMedicine: async (id: number, medicineData: MedicineResponse): Promise<MedicineResponse> => {
    try {
      const response = await api.patch<MedicineResponse>(`/medicine/${id}`, medicineData);
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to update medicine'));
    }
  },

  deleteMedicine: async (id: number): Promise<void> => {
    try {
      await api.delete(`/medicine/${id}`);
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to delete medicine'));
    }
  },
  getMedicineAudit: async (medicine_id: number): Promise<MedicineAudit[]> => {
  try {
    const response = await api.get<MedicineAudit[]>(`/medicine/${medicine_id}/audit/`);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Failed to fetch medicine audit report'));
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

  useComposition: async ({ compositionId, times, usedAt, shedNo }: { compositionId: number, times: number, usedAt: string, shedNo?: string }) => {
    try {
      await api.post('/compositions/use-composition', {
        compositionId,
        times,
        usedAt,
        shed_no: shedNo, // Include shed_no here
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

// Configuration API for key-value settings
export interface AppConfigKV {
  id?: number;
  name: string;
  value: string;
}

export const configApi = {
  // Get all configurations (GET)
  getAllConfigs: async (): Promise<AppConfigKV[]> => {
    try {
      const response = await api.get<AppConfigKV[]>('/configurations/');
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to fetch configurations'));
    }
  },

  // Update a configuration by name (PATCH)
  updateConfig: async (name: string, value: string): Promise<AppConfigKV> => {
    try {
      const response = await api.patch<AppConfigKV>(`/configurations/${name}/`, { value });
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to update configuration'));
    }
  },

  // Create a configuration (POST)
  createConfig: async (name: string, value: string): Promise<AppConfigKV> => {
    try {
      const response = await api.post<AppConfigKV>('/configurations/', { name, value });
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to create configuration'));
    }
  },
};

// Restore batchApi for master batch operations
export const batchApi = {
  createBatch: async (batchData: Batch): Promise<BatchResponse> => {
    try {
      const response = await api.post<BatchResponse>('/batches/', batchData);
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to create batch'));
    }
  },
  getBatches: async (skip: number = 0, limit: number = 100): Promise<BatchResponse[]> => {
    try {
      const response = await api.get<BatchResponse[]>(`/batches/all/?skip=${skip}&limit=${limit}`);
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to fetch batches'));
    }
  },
  getBatch: async (id: number): Promise<BatchResponse> => {
    try {
      const response = await api.get<BatchResponse>(`/batches/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to fetch batch'));
    }
  },
  updateBatch: async (id: number, batchData: Partial<BatchUpdate>): Promise<BatchResponse> => {
    try {
      const response = await api.patch<BatchResponse>(`/batches/${id}`, batchData);
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to update batch'));
    }
  },

  closeBatch: async (batch_id: number): Promise<{ message: string }> => {
  try {
    const response = await api.put<{ message: string }>(`/batch/${batch_id}/close`);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Failed to close batch'));
  }
},
};

// Egg Room Report API
export const eggRoomReportApi = {
  getReport: async (report_date: string): Promise<EggRoomSingleReportResponse> => {
    const response = await api.get<EggRoomSingleReportResponse>(`/egg-room-report/${report_date}`);
    return response.data;
  },
  createReport: async (report: EggRoomReportCreate): Promise<EggRoomReportResponse> => {
    const response = await api.post<EggRoomReportResponse>('/egg-room-report/', report);
    return response.data;
  },
  // In api.ts
updateReport: async (report_date: string, reportData: EggRoomReportUpdate) => { // Renamed 'report' to 'reportData' for clarity
    if (!report_date || report_date === 'undefined') {
      throw new Error('Invalid date parameter');
    }
    
    try {
      const response = await api.put<EggRoomReportResponse>(
        `/egg-room-report/${encodeURIComponent(report_date)}`,
        reportData // Use reportData here
      );
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },
  deleteReport: async (report_date: string): Promise<void> => {
    await api.delete(`/egg-room-report/${report_date}`);
  },

  getReports: async (start_date: string, end_date: string): Promise<EggRoomReportResponse[]> => {
    const response = await api.get<EggRoomReportResponse[]>(`/egg-room-report/`, {
      params: { start_date, end_date }
    });
    return response.data;
  },
};

// New Bovans Performance API
export const bovansApi = {
 getAllBovansPerformance: async (skip: number = 0, limit: number = 10): Promise<PaginatedBovansPerformanceResponse> => {
    try {
      // The response from the API will now be of type PaginatedBovansPerformanceResponse
      const response = await api.get<PaginatedBovansPerformanceResponse>(`/bovans/?skip=${skip}&limit=${limit}`);
      return response.data; // This 'response.data' will now contain { data: [...], total_count: ... }
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to fetch Bovans performance data'));
    }
  },
  getBovansPerformanceByAge: async (age_weeks: number): Promise<BovansPerformance> => {
    try {
      const response = await api.get<BovansPerformance>(`/bovans/${age_weeks}`);
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, `Failed to fetch Bovans performance data for age ${age_weeks}`));
    }
  },
};

export default api;
