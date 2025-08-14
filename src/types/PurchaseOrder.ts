// src/types/PurchaseOrder.ts
import { PurchaseOrderItemResponse, PurchaseOrderItemCreate } from './PurchaseOrderItem';
import { VendorResponse } from './Vendor';

export enum PurchaseOrderStatus {
  DRAFT = "Draft",
  APPROVED = "Approved",
  PARTIALLY_PAID = "Partially Paid",
  PAID = "Paid",
  CANCELLED = "Cancelled",
}

export enum PaymentStatus {
    NOT_PAID = "Not Paid",
    PARTIALLY_PAID = "Partially Paid",
    FULLY_PAID = "Fully Paid",
}

export interface PaymentResponse {
    id: number;
    purchase_order_id: number;
    amount_paid: number;
    payment_date: string; // ISO string
    payment_mode: string; // e.g., "Cash", "Bank Transfer"
    reference_number?: string;
    created_at: string;
    updated_at?: string;
}


export interface PurchaseOrderBase {
  vendor_id: number;
  
  order_date: string; // ADD THIS FIELD - Date string (YYYY-MM-DD)
  
  notes?: string;
}

export interface PurchaseOrderCreate extends PurchaseOrderBase {
  items: PurchaseOrderItemCreate[]; // Array of items to be created with the PO
}

export interface PurchaseOrderUpdate {
  vendor_id?: number;
  
  order_date?: string; // Allow updating if needed, or make it not updateable depending on business logic
  
  notes?: string;
  status?: PurchaseOrderStatus;
}

export interface PurchaseOrderResponse extends PurchaseOrderBase {
  id: number;
  status: PurchaseOrderStatus;
  total_amount: number; // Ensure this is 'number', not 'number | null' or 'any'
  total_amount_paid: number;   // Ensure this is 'number', not 'number | null' or 'any'
  payment_status: PaymentStatus;
  created_at: string;
  updated_at?: string;
  vendor?: VendorResponse;
  items?: PurchaseOrderItemResponse[];
  payments?: PaymentResponse[];
}

export interface PaymentBase {
    purchase_order_id: number;
    amount_paid: number;
    payment_date: string; // YYYY-MM-DD
    payment_mode: string; // e.g., "Cash", "Bank Transfer", "Cheque"
    reference_number?: string; // e.g., cheque number, transaction ID
    notes?: string; // Additional notes for the payment
}

export interface PaymentCreate extends PaymentBase {} // Simple extension for creation

export interface PaymentUpdate {
    total_amount_paid?: number;
    payment_date?: string;
    payment_mode?: string;
    reference_number?: string;
    notes?: string;
}

export interface PaymentResponse extends PaymentBase {
    id: number;
    created_at: string;
    updated_at?: string;
}