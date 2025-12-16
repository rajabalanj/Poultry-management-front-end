// src/types/SalesOrder.ts
import { SalesOrderItemResponse, SalesOrderItemCreate } from './SalesOrderItem';
import { CustomerResponse } from './Customer';

export enum SalesOrderStatus {
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




export interface SalesOrderBase {
  customer_id: number;
  order_date: string; // ADD THIS FIELD - Date string (YYYY-MM-DD)
  notes?: string;
  bill_no?: string; // Optional bill number
}

export interface SalesOrderCreate extends SalesOrderBase {
  items: SalesOrderItemCreate[]; // Array of items to be created with the SO
}

export interface SalesOrderUpdate {
  customer_id?: number;

  order_date?: string; // Allow updating if needed, or make it not updateable depending on business logic

  notes?: string;
  status?: SalesOrderStatus;
  bill_no?: string; // Optional bill number
}

export interface SalesOrderResponse extends SalesOrderBase {
  id: number;
  so_number: string;
  status: SalesOrderStatus;
  total_amount: number; // Ensure this is 'number', not 'number | null' or 'any'
  total_amount_paid: number;   // Ensure this is 'number', not 'number | null' or 'any'
  payment_status: PaymentStatus;
  payment_receipt?: string; // File path
  created_at: string;
  updated_at?: string;
  customer?: CustomerResponse;
  items?: SalesOrderItemResponse[];
  payments?: PaymentResponse[];
}

export interface PaymentBase {
    id?: number;
    sales_order_id: number;
    amount_paid: number;
    payment_date: string; // YYYY-MM-DD
    payment_mode: string; // e.g., "Cash", "Bank Transfer", "Cheque"
    reference_number?: string; // e.g., cheque number, transaction ID
    notes?: string; // Additional notes for the payment
}

export interface PaymentCreate extends PaymentBase {} // Simple extension for creation

export interface PaymentUpdate {
    amount_paid?: number;
    payment_date?: string;
    payment_mode?: string;
    reference_number?: string;
    notes?: string;
}

export interface PaymentResponse extends PaymentBase {
    id: number;
    payment_receipt?: string; // File path
    created_at: string;
    updated_at?: string;
}
