import React from 'react';

interface KeyboardShortcutsIndicatorProps {
  hasPayment?: boolean;
}

const KeyboardShortcutsIndicator: React.FC<KeyboardShortcutsIndicatorProps> = ({ hasPayment = false }) => {
  return (
    <div className="text-muted small mt-2 mb-2 d-none d-md-flex align-items-center gap-3 flex-wrap justify-content-end">
      <span className="fw-semibold"><i className="bi bi-keyboard me-1"></i>Shortcuts:</span>
      <span><kbd>↑</kbd> <kbd>↓</kbd> Navigate</span>
      <span><kbd>Enter</kbd> Open</span>
      {hasPayment && <span><kbd>P</kbd> Payment</span>}
      <span><kbd>Esc</kbd> Close</span>
    </div>
  );
};

export default KeyboardShortcutsIndicator;