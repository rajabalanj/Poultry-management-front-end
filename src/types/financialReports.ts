 // src/types/financialReports.ts

export interface CurrentAssets {
  cash: number;
  accounts_receivable: number;
  inventory: number;
  cash_str?: string;
  cash_words?: string;
  accounts_receivable_str?: string;
  accounts_receivable_words?: string;
  inventory_str?: string;
  inventory_words?: string;
}

export interface Assets {
  current_assets: CurrentAssets;
}

export interface CurrentLiabilities {
  accounts_payable: number;
  accounts_payable_str?: string;
  accounts_payable_words?: string;
}

export interface Liabilities {
  current_liabilities: CurrentLiabilities;
}

export interface ProfitAndLoss {
  revenue: number;
  cogs: number;
  gross_profit: number;
  operating_expenses: number;
  net_income: number;
  revenue_str?: string;
  revenue_words?: string;
  cogs_str?: string;
  cogs_words?: string;
  gross_profit_str?: string;
  gross_profit_words?: string;
  operating_expenses_str?: string;
  operating_expenses_words?: string;
  net_income_str?: string;
  net_income_words?: string;
}

export interface BalanceSheet {
  as_of_date: string;
  assets: Assets;
  liabilities: Liabilities;
  equity: number;
  equity_str?: string;
  equity_words?: string;
}