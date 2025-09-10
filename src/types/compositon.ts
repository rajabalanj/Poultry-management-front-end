export interface InventoryItemInComposition {
  inventory_item_id: number;
  weight: number;
}

export interface CompositionResponse {
  id: number;
  name: string;
  inventory_items: InventoryItemInComposition[];
}