export enum PartnerStatus {
  ACTIVE = "Active",
  INACTIVE = "Inactive",
  ON_HOLD = "On Hold",
}

export interface BusinessPartnerBase {
  name: string;
  contact_name: string;
  phone: string;
  address: string;
  email?: string;
  status?: PartnerStatus;
  is_vendor?: boolean;
  is_customer?: boolean;
}

export interface BusinessPartnerCreate extends BusinessPartnerBase {}

export interface BusinessPartnerUpdate {
  name?: string;
  contact_name?: string;
  phone?: string;
  address?: string;
  email?: string;
  status?: PartnerStatus;
  is_vendor?: boolean;
  is_customer?: boolean;
}

export interface BusinessPartner extends BusinessPartnerBase {
  id: number;
  created_at: string;
  updated_at?: string;
}