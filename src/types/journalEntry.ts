export interface JournalEntryItem {
  id?: number;
  account_id: number;
  debit: number;
  credit: number;
  account_name?: string; // For display purposes
  account_code?: string; // For display purposes
}

export interface JournalEntryCreate {
  date: string;
  description: string;
  reference_document?: string;
  items: Array<Omit<JournalEntryItem, 'id' | 'account_name' | 'account_code'>>;
}

export interface JournalEntryResponse {
  id: number;
  date: string;
  description: string;
  reference_document: string | null;
  tenant_id: string;
  items: JournalEntryItem[];
}