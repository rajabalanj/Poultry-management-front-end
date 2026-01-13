export interface GeneralLedgerEntry {
    date: string;
    transaction_type: string;
    party: string;
    reference_document: string;
    transaction_id: number;
    reference_id: number;
    details: string;
    debit: number;
    credit: number;
    balance: number;
    debit_str?: string;
    debit_words?: string;
    credit_str?: string;
    credit_words?: string;
    balance_str?: string;
    balance_words?: string;
}

export interface GeneralLedger {
    title: string;
    opening_balance: number;
    entries: GeneralLedgerEntry[];
    closing_balance: number;
    opening_balance_str?: string;
    opening_balance_words?: string;
    closing_balance_str?: string;
    closing_balance_words?: string;
}

export interface PurchaseLedgerEntry {
    date: string;
    vendor_name: string;
    po_id: number;
    invoice_number: string;
    description?: string;
    amount: number;
    amount_paid: number;
    balance_amount: number;
    payment_status: string;
    amount_str?: string;
    amount_words?: string;
    amount_paid_str?: string;
    amount_paid_words?: string;
    balance_amount_str?: string;
    balance_amount_words?: string;
}

export interface PurchaseLedger {
    title: string;
    vendor_id: number;
    entries: PurchaseLedgerEntry[];
}

export interface SalesLedgerEntry {
    date: string;
    customer_name: string;
    so_id: number;
    invoice_number: string;
    description?: string;
    amount: number;
    amount_paid: number;
    balance_amount: number;
    payment_status: string;
    amount_str?: string;
    amount_words?: string;
    amount_paid_str?: string;
    amount_paid_words?: string;
    balance_amount_str?: string;
    balance_amount_words?: string;
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
    unit_cost_str?: string;
    unit_cost_words?: string;
    total_cost_str?: string;
    total_cost_words?: string;
}

export interface InventoryLedger {
    title: string;
    item_id: number;
    opening_quantity: number;
    entries: InventoryLedgerEntry[];
    closing_quantity_on_hand: number;
}
