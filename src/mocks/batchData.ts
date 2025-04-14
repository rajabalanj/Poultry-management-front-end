import { Batch } from '../services/api';

export const mockBatches: Batch[] = [
  {
    id: "1",
    batchNo: "B-0001",
    shedNo: 1,
    age: "Week 1, Day 1",
    openingCount: 18652,
    mortality: 2,
    culls: 3,
    closingCount: 18647,
    table: 500,
    jumbo: 1,
    cr: 30,
    totalEggs: 531,
    date: "2024-03-17",
    createdAt: "2024-03-17T10:00:00Z",
    updatedAt: "2024-03-17T10:00:00Z"
  },
  {
    id: "2",
    batchNo: "B-0002",
    shedNo: 2,
    age: "Week 50, Day 6",
    openingCount: 22356,
    mortality: 0,
    culls: 0,
    closingCount: 22356,
    table: 0,
    jumbo: 0,
    cr: 0,
    totalEggs: 0,
    date: "2024-03-17",
    createdAt: "2024-03-17T11:00:00Z",
    updatedAt: "2024-03-17T11:00:00Z"
  }
]; 