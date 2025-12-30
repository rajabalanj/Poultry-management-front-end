// src/types/SalesOrderItem.ts
import { InventoryItemResponse } from './InventoryItem'; // Import InventoryItemResponse

export interface SalesOrderItemBase {
  inventory_item_id: number;
  quantity: number;
  price_per_unit: number;
  variant_id?: number | null;
  variant_name?: string;
}

export interface SalesOrderItemCreate extends SalesOrderItemBase {}

export interface SalesOrderItemUpdate {
  inventory_item_id?: number;
  quantity?: number;
  price_per_unit?: number;
  variant_id?: number | null;
  variant_name?: string;
}

export interface SalesOrderItemResponse extends SalesOrderItemBase {
  id: number;
  sales_order_id: number;
  line_total: number;
  // Optionally include the full item details if the backend relationship is loaded
  inventory_item?: InventoryItemResponse; // The nested inventory item object
}
