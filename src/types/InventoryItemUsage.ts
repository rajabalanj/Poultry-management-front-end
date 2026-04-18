export interface InventoryItemUsageCreate {
  inventory_item_id: number;
  batch_no: string;
  used_quantity: number;
  usedAt: string;
  unit: string;
}

export interface InventoryItemUsageResponse {
  id: number;
  inventory_item_id: number;
  inventory_item_name?: string;
  used_quantity: string;
  unit: string;
  used_at: string;
  batch_id: number;
  changed_by: string;
  tenant_id: string;
}

export interface PaginatedInventoryItemUsageResponse {
  data: InventoryItemUsageResponse[];
  total: number;
}
