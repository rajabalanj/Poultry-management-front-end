
export interface GeneralLedgerEntry {
    date: string;
    description: string;
    journal_ref_id?: string;
    debit: number;
    credit: number;
    balance: number;
}

export interface GeneralLedger {
    title: string;
    opening_balance: number;
    entries: GeneralLedgerEntry[];
    closing_balance: number;
}

export interface PurchaseLedgerEntry {
    date: string;
    vendor_name: string;
    invoice_number: string;
    description?: string;
    amount: number;
    amount_paid: number;
    balance_amount: number;
    payment_status: string;
}

export interface PurchaseLedger {
    title: string;
    vendor_id: number;
    entries: PurchaseLedgerEntry[];
}

export interface SalesLedgerEntry {
    date: string;
    customer_name: string;
    invoice_number: string;
    description?: string;
    amount: number;
    amount_paid: number;
    balance_amount: number;
    payment_status: string;
}

export interface SalesLedger {
    title: string;
    customer_id: number;
    entries: SalesLedgerEntry[];
}

export interface InventoryLedgerEntry {
    date: string;
    reference: string;
    quantity_received?: number;
    unit_cost?: number;
    total_cost?: number;
    quantity_sold?: number;
    quantity_on_hand: number;
}

export interface InventoryLedger {
    title: string;
    item_id: number;
    opening_quantity: number;
    entries: InventoryLedgerEntry[];
    closing_quantity_on_hand: number;
}
