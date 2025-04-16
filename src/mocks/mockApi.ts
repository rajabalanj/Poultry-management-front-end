import { Batch, ApiResponse } from '../services/api';
import { mockBatches } from './batchData';

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockApi = {
  getBatches: async (): Promise<ApiResponse<Batch[]>> => {
    await delay(500); // Simulate network delay
    return {
      data: mockBatches,
      status: 200,
      message: 'Batches fetched successfully'
    };
  },

  getBatch: async (id: string): Promise<ApiResponse<Batch>> => {
    await delay(500); // Simulate network delay
    const batch = mockBatches.find(b => b.id === id);
    
    if (!batch) {
      throw new Error('Batch not found');
    }

    return {
      data: batch,
      status: 200,
      message: 'Batch fetched successfully'
    };
  },

  createBatch: async (batchData: Omit<Batch, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Batch>> => {
    await delay(500); // Simulate network delay
    const newBatch: Batch = {
      ...batchData,
      id: String(mockBatches.length + 1),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    mockBatches.push(newBatch);

    return {
      data: newBatch,
      status: 201,
      message: 'Batch created successfully'
    };
  },

  updateBatch: async (id: string, batchData: Partial<Batch>): Promise<ApiResponse<Batch>> => {
    await delay(500); // Simulate network delay
    const index = mockBatches.findIndex(b => b.id === id);
    
    if (index === -1) {
      throw new Error('Batch not found');
    }

    const updatedBatch = {
      ...mockBatches[index],
      ...batchData,
      updatedAt: new Date().toISOString()
    };

    mockBatches[index] = updatedBatch;

    return {
      data: updatedBatch,
      status: 200,
      message: 'Batch updated successfully'
    };
  },

  deleteBatch: async (id: string): Promise<ApiResponse<void>> => {
    await delay(500); // Simulate network delay
    const index = mockBatches.findIndex(b => b.id === id);
    
    if (index === -1) {
      throw new Error('Batch not found');
    }

    mockBatches.splice(index, 1);

    return {
      data: undefined,
      status: 200,
      message: 'Batch deleted successfully'
    };
  }
}; 