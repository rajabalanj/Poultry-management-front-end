export interface Shortcut {
    key: string;            // e.g., 'Alt+n', '/', 'Escape'
    description: string;    // e.g., 'Create New Order'
    category: string;       // e.g., 'Page Actions', 'Table Navigation'
    action: (event: KeyboardEvent) => void;
    scope?: string;         // e.g., 'global', 'table', 'payment-modal'
}