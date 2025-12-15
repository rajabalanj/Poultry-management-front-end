import axios, { AxiosError } from 'axios';
import { CompositionResponse, PaginatedCompositionUsageHistoryResponse } from '../types/compositon';
import { DailyBatch, WeeklyLayerReportResponse } from '../types/daily_batch';
import { TopSellingItem } from '../types/topSellingItem';import { BatchResponse, BatchUpdate, CreateBatchPayload, CreateBatchResponse } from '../types/batch';
import { EggRoomReportResponse, EggRoomReportCreate, EggRoomReportUpdate, EggRoomSingleReportResponse } from '../types/eggRoomReport.ts';
import { BovansPerformance, PaginatedBovansPerformanceResponse } from "../types/bovans"; // Ensure this import is present
import { BusinessPartner, BusinessPartnerCreate, BusinessPartnerUpdate, PartnerStatus } from '../types/BusinessPartner';
import { InventoryItemResponse, InventoryItemCreate, InventoryItemUpdate, InventoryItemCategory } from '../types/InventoryItem';
import { InventoryItemAudit } from '../types/InventoryItemAudit';
import { InventoryStockLevel } from '../types/inventoryStockLevel';
import {
  PurchaseOrderResponse,
  PurchaseOrderCreate,
  PurchaseOrderUpdate,
  PurchaseOrderStatus,
  PaymentCreate, // NEW
  PaymentResponse, // NEW
  PaymentUpdate, // NEW
} from '../types/PurchaseOrder'; // NEW IMPORT
import {
PurchaseOrderItemResponse,
  PurchaseOrderItemCreate,
  PurchaseOrderItemUpdate,
} from '../types/PurchaseOrderItem';
import {
  SalesOrderResponse,
  SalesOrderCreate,
  SalesOrderUpdate,
  SalesOrderStatus,
  PaymentCreate as SalesPaymentCreate,
} from '../types/SalesOrder';
import {
  SalesOrderItemResponse,
  SalesOrderItemCreate,
  SalesOrderItemUpdate,
} from '../types/SalesOrderItem';
import { OperationalExpense } from '../types/operationalExpense';
import { ProfitAndLoss, BalanceSheet } from '../types/financialReports'; // NEW IMPORT
import { FinancialConfig } from '../types/financialConfig';
import { GeneralLedger, PurchaseLedger, SalesLedger, InventoryLedger } from '../types/ledgers';
import { Shed, ShedResponse } from '../types/shed';
// Define types for our data
// Define types for our data

// Define API response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

// Create axios instance with base URL
const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:8000'),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});


// Add user ID header handling



// JWT token storage
let accessToken: string | null = null;
let tenantId: string | null = null;

export const setTenantId = (id: string | null) => {
  tenantId = id;
};

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;
export const getTenantId = () => tenantId;


// Update api instance to include user ID header and JWT token when available
api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    if (tenantId) {
      config.headers['X-Tenant-ID'] = tenantId;
    }
    console.log("Request config with Tenant ID:", config.headers['X-Tenant-ID']);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);  

// Add response interceptor for error handling and token refresh
api.interceptors.response.use(
  (response) => {
    console.log('Raw API Response:', response); // Debug log
    return response;
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - trigger re-authentication
      accessToken = null;
      window.dispatchEvent(new CustomEvent('auth:token-expired'));
    }
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

// Helper function to extract error message
export function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.detail || error.message || fallback;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}

// Helper function to trigger file download


export const s3Upload = async (uploadUrl: string, file: File) => {
  try {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`S3 upload failed: ${response.statusText} - ${errorText}`);
    }
    return response;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`S3 upload failed: ${error.message}`);
    }
    throw new Error('S3 upload failed with an unknown error.');
  }
};


export const reportsApi = {
  getWeeklyLayerReport: async (batch_id: number, week: number): Promise<import('../types/daily_batch').WeeklyLayerReportResponse> => {
    try {
      const response = await api.get<WeeklyLayerReportResponse>(`/reports/weekly-layer-report`, {        params: {
          batch_id,
          week,
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to fetch weekly layer report'));
    }
  },
  getMonthlyEggProduction: async (startDate: string, endDate: string): Promise<{ month: string, total_eggs: number }[]> => {
    try {
      const response = await api.get<{ month: string, total_eggs: number }[]>('/reports/monthly-egg-production', {
        params: {
          start_date: startDate,
          end_date: endDate,
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to fetch monthly egg production report'));
    }
  },

  getTopSellingItems: async (startDate?: string, endDate?: string, limit?: number): Promise<TopSellingItem[]> => {
    try {
      const params: { [key: string]: any } = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (limit) params.limit = limit;

      const response = await api.get<TopSellingItem[]>('/reports/top-selling-items', { params });
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to fetch top selling items'));
    }
  },

  getCompositionUsageReport: async (startDate: string, endDate: string): Promise<{ report: { composition_name: string, total_usage: number, unit: string }[] }> => {
    try {
      const response = await api.get<{ report: { composition_name: string, total_usage: number, unit: string }[] }>('/reports/composition-usage-report', {
        params: {
          start_date: startDate,
          end_date: endDate,
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to fetch composition usage report'));
    }
  },
};

// Move the `getSnapshot` function to a new `dailyBatchApi` object
export const dailyBatchApi = {
  getSnapshot: async (startDate: string, endDate: string, batchId?: number): Promise<import('../types/daily_batch').SnapshotResponse> => {
    try {
      const response = await api.get<import('../types/daily_batch').SnapshotResponse>(`/reports/snapshot`, {
        params: {
          start_date: startDate.split('T')[0],
          end_date: endDate.split('T')[0],
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

  // Upload weekly report Excel file for a specific batch
  uploadWeeklyReport: async (batchId: number, formData: FormData): Promise<{ message: string }> => {
    try {
      const response = await api.post<{ message: string }>(`/daily-batch/upload-weekly-report/${batchId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to upload weekly report'));
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

// Composition API for create, read, update, delete

export const compositionApi = {
  createComposition: async (composition: { name: string, inventory_items: { inventory_item_id: number, weight: number, tenant_id: string }[], tenant_id: string }): Promise<CompositionResponse> => {
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
  updateComposition: async (id: number, composition: { name: string, inventory_items: { inventory_item_id: number, weight: number, tenant_id: string }[], tenant_id: string }): Promise<CompositionResponse> => {
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

  useComposition: async ({ compositionId, times, usedAt, batch_no }: { compositionId: number, times: number, usedAt: string, batch_no?: string }) => {
    try {
      await api.post('/compositions/use-composition', {
        compositionId,
        times,
        usedAt,
        batch_no,
      });
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to use composition'));
    }
  },

  getFilteredCompositionUsageHistory: async (batchDate: string, batchId?: number): Promise<any[]> => {
    try {
      const response = await api.get('/compositions/usage-history/filtered', {
        params: {
          batch_date: batchDate,
          batch_id: batchId || undefined,
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to fetch filtered composition usage history'));
    }
  },


  getCompositionUsageHistory: async (offset: number = 0, limit: number = 10, startDate?: string, endDate?: string): Promise<PaginatedCompositionUsageHistoryResponse> => {
    try {
      const params: { [key: string]: any } = { offset, limit };
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await api.get('/compositions/usage-history', {
        params
      });
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to fetch composition usage history'));
    }
  },

  getCompositionUsageHistoryById: async (compositionId: number, offset: number = 0, limit: number = 10, startDate?: string, endDate?: string): Promise<PaginatedCompositionUsageHistoryResponse> => {
    try {
      const params: { [key: string]: any } = { offset, limit };
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await api.get(`/compositions/${compositionId}/usage-history`, {
        params
      });
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to fetch composition usage history'));
    }
  },
  revertCompositionUsage: async (usageId: number): Promise<{ message: string }> => {
  try {
    const response = await api.post<{ message: string }>(`/compositions/revert-usage/${usageId}`);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Failed to revert composition usage'));
  }
},

    /**
     * Get feed usage summary by date (and optional batch_id)
     * @param usageDate - string (YYYY-MM-DD)
     * @param batchId - optional number
     * @returns { total_feed: number, feed_breakdown: Array<{feed_type: string, amount: number, composition_name?: string, composition_items?: Array<{inventory_item_id: number, weight: number}>}> }
     */
      getFeedUsageByDate: async (usageDate: string, batchId?: number): Promise<{ total_feed: number, feed_breakdown: { feed_type: string, amount: number }[] }> => {
      try {
        const response = await api.get(`/compositions/usage-by-date/`, {
          params: {
            usage_date: usageDate,
            batch_id: batchId || undefined,
          },
        });
        // The backend now returns total_feed and amount as strings.
        // We parse them into numbers for frontend use.
        const rawData = response.data as { total_feed: string, feed_breakdown: { feed_type: string, amount: string }[] };
        return {
          total_feed: parseFloat(rawData.total_feed) || 0,
          feed_breakdown: rawData.feed_breakdown.map(item => ({
            ...item,
            amount: parseFloat(item.amount) || 0,
          })),
        };
      } catch (error) {
        throw new Error(getApiErrorMessage(error, 'Failed to fetch feed usage by date'));
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

  // Save or update a configuration (PATCH)
  saveConfig: async (name: string, value: string): Promise<AppConfigKV> => {
    try {
      const response = await api.patch<AppConfigKV>(`/configurations/${name}/`, { value });
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to save configuration'));
    }
  },



  getFinancialConfig: async (): Promise<FinancialConfig> => {
    try {
      const response = await api.get<FinancialConfig>('/configurations/financial');
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to fetch financial configuration'));
    }
  },

  updateFinancialConfig: async (config: FinancialConfig): Promise<FinancialConfig> => {
    try {
      const response = await api.patch<FinancialConfig>('/configurations/financial', config);
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to update financial configuration'));
    }
  }
};

// Restore batchApi for master batch operations
export const batchApi = {
  createBatch: async (batchData: CreateBatchPayload): Promise<CreateBatchResponse> => {
    // Basic validation before sending to backend
    const ageError = validateBatchData.age(String(batchData.age));
    if (ageError) {
      throw new Error(`Invalid age: ${ageError}`);
    }
    const openingError = validateBatchData.nonNegative(Number(batchData.opening_count), 'opening_count');
    if (openingError) {
      throw new Error(openingError);
    }

    try {
      const response = await api.post<CreateBatchResponse>('/batches/', batchData);
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

  closeBatch: async (batch_id: number, closingDate?: string): Promise<{ message: string }> => {
    try {
      const payload = closingDate ? { closing_date: closingDate } : {};
      const response = await api.put<{ message: string }>(`/batches/${batch_id}/close`, payload);
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to close batch'));
    }
  },
  moveShed: async (batch_id: number, new_shed_id: number, move_date: string): Promise<string> => {
    try {
      const response = await api.post<string>(`/batches/${batch_id}/move-shed`, {
        new_shed_id,
        move_date,
      });
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to move batch to a new shed'));
    }
  },
  swapSheds: async (data: { batch_id_1: number, batch_id_2: number, swap_date: string }): Promise<string> => {
    try {
      const response = await api.post<string>(`/batches/swap-sheds`, data);
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to swap sheds'));
    }
  },
};

// Egg Room Report API
export const eggRoomReportApi = {
  // POST /egg-room-report/initial-setup
  getReport: async (report_date: string): Promise<EggRoomSingleReportResponse> => {
    const response = await api.get<EggRoomSingleReportResponse>(`/egg-room-report/${report_date}`);
    return response.data;
  },
  createReport: async (report: EggRoomReportCreate): Promise<EggRoomReportResponse> => {
    const response = await api.post<EggRoomReportResponse>('/egg-room-report/', report);
    return response.data;
  },
  updateReport: async (report_date: string, reportData: EggRoomReportUpdate) => {
    if (!report_date || report_date === 'undefined') {
      throw new Error('Invalid date parameter');
    }
    
    try {
      const response = await api.put<EggRoomReportResponse>(
        `/egg-room-report/${encodeURIComponent(report_date)}`,
        reportData
      );
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },


  getReports: async (start_date: string, end_date: string): Promise<EggRoomReportResponse> => {
    const response = await api.get<EggRoomReportResponse>(`/egg-room-report/`, {
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

export const businessPartnerApi = {
  createBusinessPartner: async (partnerData: BusinessPartnerCreate): Promise<BusinessPartner> => {
    try {
      const response = await api.post<BusinessPartner>("/business-partners/", partnerData);
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to create people'));
    }
  },

  getBusinessPartners: async (
    skip: number = 0,
    limit: number = 100,
    status?: PartnerStatus,
    isVendor?: boolean,
    isCustomer?: boolean
  ): Promise<BusinessPartner[]> => {
    try {
      const params: { [key: string]: any } = { skip, limit };
      if (status) params.status = status;
      if (isVendor !== undefined) params.is_vendor = isVendor;
      if (isCustomer !== undefined) params.is_customer = isCustomer;
      
      const response = await api.get<BusinessPartner[]>(`/business-partners/`, { params });
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to fetch peoples'));
    }
  },

  getBusinessPartner: async (id: number): Promise<BusinessPartner> => {
    try {
      const response = await api.get<BusinessPartner>(`/business-partners/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to fetch people'));
    }
  },

  updateBusinessPartner: async (id: number, partnerData: BusinessPartnerUpdate): Promise<BusinessPartner> => {
    try {
      const response = await api.patch<BusinessPartner>(`/business-partners/${id}`, partnerData);
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to update people'));
    }
  },

  deleteBusinessPartner: async (id: number): Promise<void> => {
    try {
      await api.delete(`/business-partners/${id}`);
    } catch (error) {
      const errorMessage = getApiErrorMessage(error, 'Failed to delete people');
      if (errorMessage.includes("has associated") && errorMessage.includes("Status changed to Inactive")) {
          throw new Error("people has associated records and was marked as Inactive instead of deleted.");
      }
      throw new Error(errorMessage);
    }
  },

  getVendors: async (): Promise<BusinessPartner[]> => {
    return businessPartnerApi.getBusinessPartners(0, 100, undefined, true, undefined);
  },

  getCustomers: async (): Promise<BusinessPartner[]> => {
    return businessPartnerApi.getBusinessPartners(0, 100, undefined, undefined, true);
  },
};

export const inventoryItemApi = {
  createInventoryItem: async (itemData: InventoryItemCreate): Promise<InventoryItemResponse> => {
    try {
      const response = await api.post<InventoryItemResponse>("/inventory-items/", itemData);
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to create inventory item'));
    }
  },

  getInventoryItems: async (
    skip: number = 0,
    limit: number = 100,
    category?: InventoryItemCategory // Optional category filter
  ): Promise<InventoryItemResponse[]> => {
    try {
      const params: { skip: number; limit: number; category?: InventoryItemCategory } = { skip, limit };
      if (category) {
        params.category = category;
      }
      const response = await api.get<InventoryItemResponse[]>(`/inventory-items/`, { params });
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to fetch inventory items'));
    }
  },

  getInventoryItem: async (id: number): Promise<InventoryItemResponse> => {
    try {
      const response = await api.get<InventoryItemResponse>(`/inventory-items/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to fetch inventory item'));
    }
  },

  updateInventoryItem: async (id: number, itemData: InventoryItemUpdate): Promise<InventoryItemResponse> => {
    try {
      const response = await api.patch<InventoryItemResponse>(`/inventory-items/${id}`, itemData);
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to update inventory item'));
    }
  },

  deleteInventoryItem: async (id: number): Promise<void> => {
    try {
      await api.delete(`/inventory-items/${id}`);
    } catch (error) {
      // Backend returns 409 if associated with Purchase items
      const errorMessage = getApiErrorMessage(error, 'Failed to delete inventory item');
      if (errorMessage.includes("has associated Purchase items")) {
          throw new Error("Cannot delete item: It is associated with existing Purchase.");
      }
      throw new Error(errorMessage);
    }
  },

  getInventoryItemAudit: async (id: number, startDate?: string, endDate?: string): Promise<InventoryItemAudit[]> => {
    try {
      let url = `/inventory-items/${id}/audit`;
      const params = new URLSearchParams();
      
      if (startDate) {
        params.append('start_date', startDate);
      }
      
      if (endDate) {
        params.append('end_date', endDate);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await api.get<InventoryItemAudit[]>(url);
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to fetch inventory item audit'));
    }
  },

  getInventoryStockLevels: async (category?: string): Promise<InventoryStockLevel[]> => {
    try {
      const params: { [key: string]: any } = {};
      if (category) {
        params.category = category;
      }
      const response = await api.get<InventoryStockLevel[]>('/inventory-items/reports/stock-levels', { params });
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to fetch inventory stock levels'));
    }
  },

  getLowStockItems: async (): Promise<InventoryStockLevel[]> => {
    try {
      const response = await api.get<InventoryStockLevel[]>('/inventory-items/reports/low-stock');
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to fetch low stock items'));
    }
  },

  getInventoryValue: async (): Promise<{ total_inventory_value: number }> => {
    try {
      const response = await api.get<{ total_inventory_value: number }>('/inventory-items/reports/inventory-value');
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to fetch inventory value'));
    }
  },
};

// Helper function to handle backend returning decimal values as strings
const parsePurchaseOrderResponse = (Purchase: any): PurchaseOrderResponse => {
  // The backend may serialize Decimal fields as strings.
  // We parse them into numbers for frontend calculations and display.
  return {
    ...Purchase,
    total_amount: Purchase.total_amount != null ? parseFloat(Purchase.total_amount) : 0,
    total_amount_paid: Purchase.total_amount_paid != null ? parseFloat(Purchase.total_amount_paid) : 0,
    items: (Purchase.items || []).map((item: any) => ({
      ...item,
      price_per_unit: item.price_per_unit != null ? parseFloat(item.price_per_unit) : 0,
      subtotal: item.subtotal != null ? parseFloat(item.subtotal) : 0,
      line_total: item.line_total != null ? parseFloat(item.line_total) : 0,
    })),
  } as PurchaseOrderResponse;
};

export const purchaseOrderApi = {
  getPurchaseOrderReceiptUploadUrl: async (poId: number, filename: string): Promise<{ upload_url: string, s3_path: string }> => {
    const response = await api.post(`/purchase-orders/${poId}/receipt-upload-url`, { filename });
    return response.data;
  },
  getPaymentReceiptUploadUrl: async (paymentId: number, filename: string): Promise<{ upload_url: string, s3_path: string }> => {
    const response = await api.post(`/payments/${paymentId}/receipt-upload-url`, { filename });
    return response.data;
  },
  downloadPurchaseOrderReceipt: async (poId: number): Promise<void> => {
    try {
      const { data } = await api.get(`/purchase-orders/${poId}/receipt-download-url`);
      if (data.download_url) {
        window.open(data.download_url, '_blank');
      } else {
        throw new Error('Download URL not found in response');
      }
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to download purchase order receipt'));
    }
  },

  downloadPaymentReceipt: async (paymentId: number): Promise<void> => {
    try {
      const { data } = await api.get(`/payments/${paymentId}/receipt-download-url`);
      if (data.download_url) {
        window.open(data.download_url, '_blank');
      } else {
        throw new Error('Download URL not found in response');
      }
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to download payment receipt'));
    }
  },
  createPurchaseOrder: async (poData: PurchaseOrderCreate): Promise<PurchaseOrderResponse> => {
    try {
      const response = await api.post<PurchaseOrderResponse>("/purchase-orders/", poData);
      return parsePurchaseOrderResponse(response.data);
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to create Purchase'));
    }
  },

  getPurchaseOrders: async (
    skip: number = 0,
    limit: number = 100,
    vendorId?: number,
    status?: PurchaseOrderStatus,
    startDate?: string, // YYYY-MM-DD
    endDate?: string,   // YYYY-MM-DD
  ): Promise<PurchaseOrderResponse[]> => {
    try {
      const params: { [key: string]: any } = { skip, limit };
      if (vendorId) params.vendor_id = vendorId;
      if (status) params.status = status;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await api.get<PurchaseOrderResponse[]>(`/purchase-orders/`, { params });
      return response.data.map(parsePurchaseOrderResponse);
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to fetch Purchase'));
    }
  },

  getPurchaseOrder: async (id: number): Promise<PurchaseOrderResponse> => {
    try {
      const response = await api.get<PurchaseOrderResponse>(`/purchase-orders/${id}`);
      return parsePurchaseOrderResponse(response.data);
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to fetch Purchase'));
    }
  },

  updatePurchaseOrder: async (id: number, poData: PurchaseOrderUpdate): Promise<PurchaseOrderResponse> => {
    try {
      const response = await api.patch<PurchaseOrderResponse>(`/purchase-orders/${id}`, poData);
      return parsePurchaseOrderResponse(response.data);
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to update Purchase'));
    }
  },

  deletePurchaseOrder: async (id: number): Promise<void> => {
    try {
      await api.delete(`/purchase-orders/${id}`);
    } catch (error) {
      const errorMessage = getApiErrorMessage(error, 'Failed to delete Purchase');
      if (errorMessage.includes("can only be deleted if its status is DRAFT or CANCELLED")) {
          throw new Error("Cannot delete Purchase: Only DRAFT or CANCELLED orders can be deleted.");
      }
      throw new Error(errorMessage);
    }
  },

  // Purchase Items (nested endpoints)
  addPurchaseOrderItem: async (poId: number, itemData: PurchaseOrderItemCreate): Promise<PurchaseOrderItemResponse> => {
    try {
      const response = await api.post<PurchaseOrderItemResponse>(`/purchase-orders/${poId}/items`, itemData);
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to add item to Purchase'));
    }
  },

  updatePurchaseOrderItem: async (poId: number, itemId: number, itemData: PurchaseOrderItemUpdate): Promise<PurchaseOrderItemResponse> => {
    try {
      const response = await api.patch<PurchaseOrderItemResponse>(`/purchase-orders/${poId}/items/${itemId}`, itemData);
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to update Purchase item'));
    }
  },

  deletePurchaseOrderItem: async (poId: number, itemId: number): Promise<void> => {
    try {
      await api.delete(`/purchase-orders/${poId}/items/${itemId}`);
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to remove item from Purchase'));
    }
  },

  addPaymentToPurchaseOrder: async (payment: PaymentCreate): Promise<PaymentResponse> => {
    try {
      const response = await api.post<PaymentResponse>(`/payments/`, payment);
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to add payment to Purchase'));
    }
  },

  updatePayment: async (paymentId: number, paymentData: PaymentUpdate): Promise<PaymentResponse> => {
    try {
      const response = await api.patch<PaymentResponse>(`/payments/${paymentId}`, paymentData);
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to update payment'));
    }
  },

  deletePayment: async (paymentId: number): Promise<void> => {
    try {
      await api.delete(`/payments/${paymentId}`);
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to delete payment'));
    }
  },
};

// Helper function to handle backend returning decimal values as strings
const parseSalesOrderResponse = (so: any): SalesOrderResponse => {
  return {
    ...so,
    total_amount: so.total_amount != null ? parseFloat(so.total_amount) : 0,
    total_amount_paid: so.total_amount_paid != null ? parseFloat(so.total_amount_paid) : 0,
    items: (so.items || []).map((item: any) => ({
      ...item,
      price_per_unit: item.price_per_unit != null ? parseFloat(item.price_per_unit) : 0,
      subtotal: item.subtotal != null ? parseFloat(item.subtotal) : 0,
      line_total: item.line_total != null ? parseFloat(item.line_total) : 0,
    })),
    payments: (so.payments || []).map((payment: any) => ({
      ...payment,
      amount_paid: payment.amount_paid != null ? parseFloat(payment.amount_paid) : 0,
    })),
  } as SalesOrderResponse;
};

export const salesOrderApi = {
  getSalesOrderReceiptUploadUrl: async (soId: number, filename: string): Promise<{ upload_url: string, s3_path: string }> => {
    const response = await api.post(`/sales-orders/${soId}/receipt-upload-url`, { filename });
    return response.data;
  },
  getSalesPaymentReceiptUploadUrl: async (paymentId: number, filename: string): Promise<{ upload_url: string, s3_path: string }> => {
    const response = await api.post(`/sales-payments/${paymentId}/receipt-upload-url`, { filename });
    return response.data;
  },
  downloadSalesOrderReceipt: async (soId: number): Promise<void> => {
    try {
      const { data } = await api.get(`/sales-orders/${soId}/receipt-download-url`);
      if (data.download_url) {
        window.open(data.download_url, '_blank');
      } else {
        throw new Error('Download URL not found in response');
      }
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to download sales order receipt'));
    }
  },

  downloadSalesPaymentReceipt: async (paymentId: number): Promise<void> => {
    try {
      const { data } = await api.get(`/sales-payments/${paymentId}/receipt-download-url`);
      if (data.download_url) {
        window.open(data.download_url, '_blank');
      } else {
        throw new Error('Download URL not found in response');
      }
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to download sales payment receipt'));
    }
  },
  createSalesOrder: async (soData: SalesOrderCreate): Promise<SalesOrderResponse> => {
    try {
      const response = await api.post<SalesOrderResponse>("/sales-orders/", soData);
      return parseSalesOrderResponse(response.data);
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to create sales order'));
    }
  },

  getSalesOrders: async (
    skip: number = 0,
    limit: number = 100,
    customerId?: number,
    status?: SalesOrderStatus,
    startDate?: string, // YYYY-MM-DD
    endDate?: string,   // YYYY-MM-DD
  ): Promise<SalesOrderResponse[]> => {
    try {
      const params: { [key: string]: any } = { skip, limit };
      if (customerId) params.customer_id = customerId;
      if (status) params.status = status;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await api.get<SalesOrderResponse[]>(`/sales-orders/`, { params });
      return response.data.map(parseSalesOrderResponse);
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to fetch sales'));
    }
  },

  getSalesOrder: async (id: number): Promise<SalesOrderResponse> => {
    try {
      const response = await api.get<SalesOrderResponse>(`/sales-orders/${id}`);
      return parseSalesOrderResponse(response.data);
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to fetch sales order'));
    }
  },

  updateSalesOrder: async (id: number, soData: SalesOrderUpdate): Promise<SalesOrderResponse> => {
    try {
      const response = await api.patch<SalesOrderResponse>(`/sales-orders/${id}`, soData);
      return parseSalesOrderResponse(response.data);
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to update sales order'));
    }
  },

  deleteSalesOrder: async (id: number): Promise<void> => {
    try {
      await api.delete(`/sales-orders/${id}`);
    } catch (error) {
      const errorMessage = getApiErrorMessage(error, 'Failed to delete sales order');
      if (errorMessage.includes("can only be deleted if its status is DRAFT or CANCELLED")) {
          throw new Error("Cannot delete sales order: Only DRAFT or CANCELLED orders can be deleted.");
      }
      throw new Error(errorMessage);
    }
  },

  // Sales Order Items (nested endpoints)
  addSalesOrderItem: async (soId: number, itemData: SalesOrderItemCreate): Promise<SalesOrderItemResponse> => {
    try {
      const response = await api.post<SalesOrderItemResponse>(`/sales-orders/${soId}/items`, itemData);
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to add item to sales order'));
    }
  },

  updateSalesOrderItem: async (soId: number, itemId: number, itemData: SalesOrderItemUpdate): Promise<SalesOrderItemResponse> => {
    try {
      const response = await api.patch<SalesOrderItemResponse>(`/sales-orders/${soId}/items/${itemId}`, itemData);
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to update sales order item'));
    }
  },

  deleteSalesOrderItem: async (soId: number, itemId: number): Promise<void> => {
    try {
      await api.delete(`/sales-orders/${soId}/items/${itemId}`);
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to remove item from sales order'));
    }
  },

  addPaymentToSalesOrder: async (payment: SalesPaymentCreate): Promise<PaymentResponse> => {
    try {
      const response = await api.post<PaymentResponse>(`/sales-payments/`, payment);
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to add payment to Sales'));
    }
  },

  updateSalesPayment: async (paymentId: number, paymentData: PaymentUpdate): Promise<PaymentResponse> => {
    try {
      // Assuming sales payments are managed under a similar endpoint structure to purchase payments
      const response = await api.patch<PaymentResponse>(`/sales-payments/${paymentId}`, paymentData);
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to update sales payment'));
    }
  },

  deleteSalesPayment: async (paymentId: number): Promise<void> => {
    try {
      await api.delete(`/sales-payments/${paymentId}`);
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to delete sales payment'));
    }
  },
};

export const financialReportsApi = {
  getProfitAndLoss: async (startDate: string, endDate: string): Promise<ProfitAndLoss> => {
    try {
      const response = await api.get<ProfitAndLoss>('/financial-reports/profit-and-loss', {
        params: { start_date: startDate, end_date: endDate },
      });
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to fetch Profit and Loss report'));
    }
  },

  getBalanceSheet: async (asOfDate: string): Promise<BalanceSheet> => {
    try {
      const response = await api.get<BalanceSheet>('/financial-reports/balance-sheet', {
        params: { as_of_date: asOfDate },
      });
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to fetch Balance Sheet report'));
    }
  },
};

// NEW EXPORT
export const operationalExpenseApi = {
  createOperationalExpense: async (expenseData: Omit<OperationalExpense, 'id' | 'tenant_id'>): Promise<OperationalExpense> => {
    try {
      const response = await api.post<OperationalExpense>("/operational-expenses/", expenseData);
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to create operational expense'));
    }
  },

  getOperationalExpenses: async (startDate: string, endDate: string): Promise<OperationalExpense[]> => {
    try {
      const response = await api.get<OperationalExpense[]>("/operational-expenses/", {
        params: { start_date: startDate, end_date: endDate },
      });
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to fetch operational expenses'));
    }
  },

  getOperationalExpense: async (expense_id: number): Promise<OperationalExpense> => {
    try {
      const response = await api.get<OperationalExpense>(`/operational-expenses/${expense_id}`);
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to fetch operational expense'));
    }
  },

  updateOperationalExpense: async (expense_id: number, expenseData: Partial<Omit<OperationalExpense, 'id' | 'tenant_id'>>): Promise<OperationalExpense> => {
    try {
      const response = await api.put<OperationalExpense>(`/operational-expenses/${expense_id}`, expenseData);
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to update operational expense'));
    }
  },

  deleteOperationalExpense: async (expense_id: number): Promise<void> => {
    try {
      await api.delete(`/operational-expenses/${expense_id}`);
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to delete operational expense'));
    }
  },
};

export const ledgerApi = {
  getGeneralLedger: async (startDate: string, endDate: string): Promise<GeneralLedger> => {
    try {
      const response = await api.get<GeneralLedger>('/financial-reports/general-ledger', {
        params: { start_date: startDate, end_date: endDate },
      });
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to fetch General Ledger'));
    }
  },

  getPurchaseLedger: async (vendorId: number): Promise<PurchaseLedger> => {
    try {
      const response = await api.get<PurchaseLedger>(`/financial-reports/subsidiary-ledger/purchases/${vendorId}`);
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to fetch Purchase Ledger'));
    }
  },

  getSalesLedger: async (customerId: number): Promise<SalesLedger> => {
    try {
      const response = await api.get<SalesLedger>(`/financial-reports/subsidiary-ledger/sales/${customerId}`);
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to fetch Sales Ledger'));
    }
  },

  getInventoryLedger: async (itemId: number, startDate: string, endDate: string): Promise<InventoryLedger> => {
    try {
      const response = await api.get<InventoryLedger>(`/financial-reports/subsidiary-ledger/inventory/${itemId}`, {
        params: { start_date: startDate, end_date: endDate },
      });
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to fetch Inventory Ledger'));
    }
  },
};

export const shedApi = {
  createShed: async (shedData: Shed): Promise<ShedResponse> => {
    try {
      const response = await api.post<ShedResponse>('/sheds/', shedData);
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to create shed'));
    }
  },
  getSheds: async (skip: number = 0, limit: number = 100): Promise<ShedResponse[]> => {
    try {
      const response = await api.get<ShedResponse[]>(`/sheds/?skip=${skip}&limit=${limit}`);
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to fetch sheds'));
    }
  },
  getShed: async (id: number): Promise<ShedResponse> => {
    try {
      const response = await api.get<ShedResponse>(`/sheds/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to fetch shed'));
    }
  },
  updateShed: async (id: number, shedData: Shed): Promise<ShedResponse> => {
    try {
      const response = await api.patch<ShedResponse>(`/sheds/${id}`, shedData);
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to update shed'));
    }
  },
  deleteShed: async (id: number): Promise<string> => {
    try {
      const response = await api.delete<string>(`/sheds/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to delete shed'));
    }
  },
};

export default api;