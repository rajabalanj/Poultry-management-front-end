// src/types/InventoryItem.ts

export enum InventoryItemUnit {
  KG = "kg",
  LITER = "liter",
  UNIT = "unit", // For countable items
  BAG = "bag",
  // Add other units as needed
}

export enum InventoryItemCategory {
  FEED = "Feed",
  MEDICINE = "Medicine",
  VACCINE = "Vaccine",
  SUPPLIES = "Supplies",
  EQUIPMENT = "Equipment",
  // Add other categories as needed
}

export interface InventoryItemBase {
  name: string;
  unit: InventoryItemUnit;
  category: InventoryItemCategory;
  reorder_level?: number;
  default_wastage_percentage?: number;
}

export interface InventoryItemCreate extends InventoryItemBase {}

// For partial updates, all fields are optional
export interface InventoryItemUpdate {
  name?: string;
  unit?: InventoryItemUnit;
  category?: InventoryItemCategory;
  reorder_level?: number;
  default_wastage_percentage?: number;
}

// Response from backend will include ID and timestamps
export interface InventoryItemResponse extends InventoryItemBase {
  id: number;
  current_stock: number;
  average_cost: number;
  average_cost_str?: string;
  average_cost_words?: string;
  created_at: string; // ISO format string
  updated_at?: string; // ISO format string, optional
}