// src/types/PurchaseOrderItem.ts
import { InventoryItemResponse } from './InventoryItem'; // Import InventoryItemResponse

export interface PurchaseOrderItemBase {
  inventory_item_id: number;
  quantity: number;
  price_per_unit: number;
}

export interface PurchaseOrderItemCreate extends PurchaseOrderItemBase {}

export interface PurchaseOrderItemUpdate {
  inventory_item_id?: number;
  quantity?: number;
  price_per_unit?: number;
}

export interface PurchaseOrderItemResponse extends PurchaseOrderItemBase {
  id: number;
  purchase_order_id: number;
  line_total: number;
  price_per_unit_str?: string;
  price_per_unit_words?: string;
  line_total_str?: string;
  line_total_words?: string;
  // Optionally include the full item details if the backend relationship is loaded
  inventory_item?: InventoryItemResponse; // The nested inventory item object
}
