
export interface ChartOfAccountsRequest {
  account_code: string;
  account_name: string;
  account_type: string;
  description: string;
  is_active: boolean;
}

export interface ChartOfAccountsResponse extends ChartOfAccountsRequest {
  id: number;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}
