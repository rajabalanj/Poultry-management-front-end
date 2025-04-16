import axios, { AxiosError } from 'axios';
import { mockApi } from '../mocks/mockApi';

// Define types for our data
export interface Batch {
  id?: string;
  batchNo: string;
  shedNo: number;
  age: string;
  openingCount: number;
  mortality: number;
  culls: number;
  closingCount: number;
  table: number;
  jumbo: number;
  cr: number;
  totalEggs: number;
  date: string;
  createdAt?: string;
  updatedAt?: string;
}

// Define API response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

// Check if we're in development mode
const isDevelopment = import.meta.env.MODE === 'development';

// Create axios instance with base URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Add request interceptor for logging
api.interceptors.request.use(
  (config) => {
    // You can add auth token here if needed
    // config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Error response:', error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up request:', error.message);
    }
    return Promise.reject(error);
  }
);

// Batch related API calls
export const batchApi = {
  // Create a new batch
  createBatch: async (batchData: Omit<Batch, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Batch>> => {
    if (isDevelopment) {
      return mockApi.createBatch(batchData);
    }
    try {
      const response = await api.post<ApiResponse<Batch>>('/batches', batchData);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to create batch');
      }
      throw error;
    }
  },

  // Get all batches
  getBatches: async (): Promise<ApiResponse<Batch[]>> => {
    if (isDevelopment) {
      return mockApi.getBatches();
    }
    try {
      const response = await api.get<ApiResponse<Batch[]>>('/batches');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to fetch batches');
      }
      throw error;
    }
  },

  // Get a single batch by ID
  getBatch: async (id: string): Promise<ApiResponse<Batch>> => {
    if (isDevelopment) {
      return mockApi.getBatch(id);
    }
    try {
      const response = await api.get<ApiResponse<Batch>>(`/batches/${id}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to fetch batch');
      }
      throw error;
    }
  },

  // Update a batch
  updateBatch: async (id: string, batchData: Partial<Batch>): Promise<ApiResponse<Batch>> => {
    if (isDevelopment) {
      return mockApi.updateBatch(id, batchData);
    }
    try {
      const response = await api.put<ApiResponse<Batch>>(`/batches/${id}`, batchData);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to update batch');
      }
      throw error;
    }
  },

  // Delete a batch
  deleteBatch: async (id: string): Promise<ApiResponse<void>> => {
    if (isDevelopment) {
      return mockApi.deleteBatch(id);
    }
    try {
      const response = await api.delete<ApiResponse<void>>(`/batches/${id}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to delete batch');
      }
      throw error;
    }
  },
};

export default api; 