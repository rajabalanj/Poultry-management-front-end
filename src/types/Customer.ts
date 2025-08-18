export enum CustomerStatus {
  ACTIVE = "Active",
  INACTIVE = "Inactive",
  ON_HOLD = "On Hold",
}

export interface CustomerBase {
  name: string;
  contact_name: string;
  phone: string;
  address: string;
  email?: string; 
  status?: CustomerStatus;
}

export interface CustomerCreate extends CustomerBase {}

export interface CustomerUpdate {
  name?: string;
  contact_name?: string;
  phone?: string;
  address?: string;
  email?: string;
  status?: CustomerStatus;
}

export interface CustomerResponse extends CustomerBase {
  id: number;
  created_at: string; 
  updated_at?: string;
}