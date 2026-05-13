export interface SubscriptionStatusResponse {
  is_paid: boolean;
  payment_date: string;
  notes: string;
  id: number;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionCreate {
  is_paid: boolean;
  payment_date: string;
  notes?: string;
  tenant_id: string;
}

export interface SubscriptionUpdate {
  is_paid?: boolean;
  payment_date?: string;
  notes?: string;
}