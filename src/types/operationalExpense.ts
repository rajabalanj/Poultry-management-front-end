
export interface OperationalExpense {
  id: number;
  date: string;
  expense_type: string;
  amount: number;
  tenant_id: number;
  amount_str?: string;
  amount_words?: string;
}
