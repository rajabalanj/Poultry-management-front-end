import { Batch } from '../services/api';

export const mockBatches: Batch[] = [
  {
    id: "1",
    batchNo: "B-0001",
    shedNo: 1,
    age: "Week 1, Day 1",
    openingCount: 26125,
    mortality: 2,
    culls: 1,
    closingCount: 26122,
    table: 0,
    jumbo: 13,
    cr: 0,
    totalEggs: 13,
    date: "2024-04-19"
  },
  {
    id: "2",
    batchNo: "B-0002",
    shedNo: 2,
    age: "Week 50, Day 6",
    openingCount: 26125,
    mortality: 6,
    culls: 0,
    closingCount: 26122,
    table: 0,
    jumbo: 13,
    cr: 0,
    totalEggs: 13,
    date: "2024-04-19"
  }
]; 