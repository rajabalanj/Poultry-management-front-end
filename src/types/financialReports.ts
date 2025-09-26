 // src/types/financialReports.ts
 
 export interface CurrentAssets {
   cash: number;
   accounts_receivable: number;
   inventory: number;
 }
 
 export interface Assets {
   current_assets: CurrentAssets;
 }
 
 export interface CurrentLiabilities {
   accounts_payable: number;
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
 }
 
 export interface BalanceSheet {
   as_of_date: string;
   assets: Assets;
   liabilities: Liabilities;
   equity: number;
 }