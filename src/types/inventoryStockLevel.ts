
export interface InventoryStockLevel {
  name: string;
  unit: string;
  category: string;
  reorder_level: string;
  description: string;
  id: number;
  tenant_id: string;
  current_stock: string;
  average_cost: string;
  created_at: string;
  updated_at: string;
  average_cost_str?: string;
  average_cost_words?: string;
}
