
export interface FinancialSettings {
  default_cash_account_id: number;
  default_sales_account_id: number;
  default_inventory_account_id: number;
  default_cogs_account_id: number;
  default_operational_expense_account_id: number;
  default_accounts_payable_account_id: number;
  default_accounts_receivable_account_id: number;
  tenant_id: string;
}

export interface UpdateFinancialSettings {
  default_cash_account_id: number;
  default_sales_account_id: number;
  default_inventory_account_id: number;
  default_cogs_account_id: number;
  default_operational_expense_account_id: number;
  default_accounts_payable_account_id: number;
  default_accounts_receivable_account_id: number;
}
