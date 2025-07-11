export interface MedicineAudit {
  timestamp: string;
  change_amount: number;
  old_weight: number;
  new_weight: number;
  changed_by: string;
  note: string;
}