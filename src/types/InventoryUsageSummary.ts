export interface InventoryUsageBreakdown {
  inventory_item_id: number;
  name?: string;
  amount: number;
  unit: string;
}

export interface InventoryUsageSummary {
  total_used: number;
  breakdown: InventoryUsageBreakdown[];
}