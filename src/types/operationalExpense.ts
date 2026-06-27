
export interface OperationalExpense {
  id: number;
  expense_date: string;
  account_id: number;
  amount: number;
  tenant_id: number;
  amount_str?: string;
  amount_words?: string;
}
