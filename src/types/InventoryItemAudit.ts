export interface InventoryItemAudit {
    id: number;
    inventory_item_id: number;
    change_type: string;
    change_amount: number;
    old_quantity: number;
    new_quantity: number;
    changed_by?: string;
    note?: string;
    timestamp: string;
  }
  