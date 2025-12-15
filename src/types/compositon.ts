export interface InventoryItemInComposition {
  inventory_item_id: number;
  weight: number;
}

export interface CompositionResponse {
  id: number;
  name: string;
  inventory_items: InventoryItemInComposition[];
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
  }[];
}

export interface PaginatedCompositionUsageHistoryResponse {
    data: CompositionUsage[];
    total: number;
}