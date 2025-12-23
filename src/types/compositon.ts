export interface InventoryItemInComposition {
  inventory_item_id: number;
  weight: number;
  wastage_percentage?: number;
}

export interface CompositionInventoryItem {
  inventory_item_id: number;
  weight: number;
  wastage_percentage: number;
  tenant_id: string;
  id: number;
  composition_id: number;
}

export interface CompositionResponse {
  id: number;
  name: string;
  tenant_id: string;
  inventory_items: CompositionInventoryItem[];
  created_by: string;
  updated_by: string;
}

export interface CompositionUsage {
  id: number;
  composition_id: number;
  times: number;
  used_at: string;
  batch_id?: number;
  composition_name?: string;
  items?: {
    inventory_item_id: number;
    inventory_item_name?: string;
    weight: number;
    unit?: string;
    wastage_percentage?: number;
  }[];
}

export interface PaginatedCompositionUsageHistoryResponse {
    data: CompositionUsage[];
    total: number;
}