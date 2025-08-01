export enum VendorStatus {
  ACTIVE = "Active",
  INACTIVE = "Inactive",
  ON_HOLD = "On Hold",
}

export interface VendorBase {
  name: string;
  contact_name: string;
  phone: string;
  address: string;
  email?: string; // Optional email, matches EmailStr in Pydantic
  status?: VendorStatus; // Optional, defaults to Active on backend
}

export interface VendorCreate extends VendorBase {}

export interface VendorUpdate {
  name?: string;
  contact_name?: string;
  phone?: string;
  address?: string;
  email?: string;
  status?: VendorStatus;
}

export interface VendorResponse extends VendorBase {
  id: number;
  created_at: string; // Assuming ISO format string from backend datetime
  updated_at?: string; // Assuming ISO format string from backend datetime
}