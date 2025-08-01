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
}

export interface InventoryItemCreate extends InventoryItemBase {}

// For partial updates, all fields are optional
export interface InventoryItemUpdate {
  name?: string;
  unit?: InventoryItemUnit;
  category?: InventoryItemCategory;
}

// Response from backend will include ID and timestamps
export interface InventoryItemResponse extends InventoryItemBase {
  id: number;
  created_at: string; // ISO format string
  updated_at?: string; // ISO format string, optional
}