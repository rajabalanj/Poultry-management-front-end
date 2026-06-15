import React, { useState, useEffect } from 'react';
import { useShortcuts } from '../context/KeyboardShortcutContext';

interface KeyboardShortcutsIndicatorProps {
  hasPayment?: boolean;
  hasDelete?: boolean;
  hasViewItems?: boolean;
  hasSearch?: boolean;
  hasNew?: boolean;
  hasExport?: boolean;
  hasBill?: boolean;
  hasShare?: boolean;
}

const KeyboardShortcutsIndicator: React.FC<KeyboardShortcutsIndicatorProps> = ({
  hasPayment = false,
  hasDelete = false,
  hasViewItems = false,
  hasSearch = false,
  hasNew = false,
  hasExport = false,
  hasBill = false,
  hasShare = false
}) => {
  const [isMinimized, setIsMinimized] = useState(true);
  const { activeShortcuts } = useShortcuts();
  const isMac = typeof window !== 'undefined' ? navigator.platform.toUpperCase().indexOf('MAC') >= 0 : false;

  const formatKey = (keyCombo: string) => {
    return keyCombo.split('+').map((part, index) => {
      let label = part.charAt(0).toUpperCase() + part.slice(1);
      if (isMac && part.toLowerCase() === 'alt') label = '⌥ Option';
      else if (part.toLowerCase() === 'arrowup') label = '↑';
      else if (part.toLowerCase() === 'arrowdown') label = '↓';

      return (
        <React.Fragment key={index}>
          {index > 0 && '+'}
          <kbd>{label}</kbd>
        </React.Fragment>
      );
    });
  };

  // Allow users to press "?" to quickly toggle the shortcuts guide
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputFocused = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable;

      if (!isInputFocused && e.key === '?') {
        setIsMinimized(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (isMinimized) {
    return (
      <button
        className="btn btn-light border shadow d-none d-md-flex align-items-center justify-content-center"
        style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          zIndex: 1040,
          width: '50px',
          height: '50px',
          borderRadius: '50%'
        }}
        onClick={() => setIsMinimized(false)}
        title="Keyboard Shortcuts (Press ? to toggle)"
      >
        <i className="bi bi-keyboard fs-4 text-secondary"></i>
      </button>
    );
  }

  return (
    <div
      className="d-none d-md-flex flex-column p-3 rounded shadow bg-white border border-secondary-subtle"
      style={{
        position: 'fixed',
        right: '30px',
        bottom: '30px',
        zIndex: 1040,
        fontSize: '0.85rem',
        minWidth: '200px'
      }}
    >
      <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-2">
        <div className="fw-bold text-uppercase text-muted" style={{ fontSize: '0.75rem' }}>
          <i className="bi bi-keyboard me-1"></i>Shortcuts
        </div>
        <button type="button" className="btn-close" style={{ fontSize: '0.5rem' }} onClick={() => setIsMinimized(true)} title="Close"></button>
      </div>
      <div className="d-flex flex-column gap-2">
        {activeShortcuts.map((shortcut, idx) => (
          <div key={idx} className="d-flex justify-content-between gap-3">
            <span>{shortcut.description}</span>
            <span>{formatKey(shortcut.key)}</span>
          </div>
        ))}
        {hasSearch && !activeShortcuts.some(s => s.key === '/') && <div className="d-flex justify-content-between gap-3"><span>Filter</span> <kbd>/</kbd></div>}
        {hasNew && !activeShortcuts.some(s => s.key.toLowerCase() === 'alt+n') && <div className="d-flex justify-content-between gap-3"><span>New</span> <span>{formatKey('Alt+n')}</span></div>}
        {hasExport && !activeShortcuts.some(s => s.key.toLowerCase() === 'alt+e') && <div className="d-flex justify-content-between gap-3"><span>Export</span> <span>{formatKey('Alt+e')}</span></div>}
        {hasShare && !activeShortcuts.some(s => s.key.toLowerCase() === 'alt+s') && <div className="d-flex justify-content-between gap-3"><span>Share</span> <span>{formatKey('Alt+s')}</span></div>}
        {hasBill && !activeShortcuts.some(s => s.key.toLowerCase() === 'alt+b') && <div className="d-flex justify-content-between gap-3"><span>Bill</span> <span>{formatKey('Alt+b')}</span></div>}
        <div className="d-flex justify-content-between gap-3"><span>Navigate</span> <span><kbd>↑</kbd> <kbd>↓</kbd></span></div>
        <div className="d-flex justify-content-between gap-3"><span>Page</span> <span><kbd>←</kbd> <kbd>→</kbd></span></div>
        <div className="d-flex justify-content-between gap-3"><span>Open</span> <kbd>Enter</kbd></div>
        {hasViewItems && <div className="d-flex justify-content-between gap-3"><span>View Items</span> <kbd>V</kbd></div>}
        {hasPayment && <div className="d-flex justify-content-between gap-3"><span>Payment</span> <kbd>P</kbd></div>}
        {hasDelete && <div className="d-flex justify-content-between gap-3"><span>Delete</span> <kbd>D</kbd></div>}
        <div className="d-flex justify-content-between gap-3"><span>Close</span> <kbd>Esc</kbd></div>
      </div>
      <div className="text-center text-muted mt-2 border-top pt-2" style={{ fontSize: '0.7rem' }}>
        Press <kbd>?</kbd> to toggle
      </div>
    </div>
  );
};

export default KeyboardShortcutsIndicator;