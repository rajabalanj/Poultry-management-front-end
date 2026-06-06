import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface UsePageShortcutsOptions {
  onSearchFocus?: () => void;
  createNewPath?: string;
  onExport?: () => void;
  onShare?: () => void;
  onDownloadBill?: () => void;
}

export const usePageShortcuts = ({
  onSearchFocus,
  createNewPath,
  onExport,
  onShare,
  onDownloadBill
}: UsePageShortcutsOptions) => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isInputFocused = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable;

      // "/" to focus search/filter (only if not already typing in an input)
      if (event.key === '/' && !isInputFocused) {
        event.preventDefault();
        if (onSearchFocus) onSearchFocus();
        return;
      }

      // Modifier shortcuts (Alt + Key) for page actions
      if (event.altKey) {
        const key = event.key.toLowerCase();
        if (key === 'n' && createNewPath) { event.preventDefault(); navigate(createNewPath); }
        if (key === 'e' && onExport) { event.preventDefault(); onExport(); }
        if (key === 's' && onShare) { event.preventDefault(); onShare(); }
        if (key === 'b' && onDownloadBill) { event.preventDefault(); onDownloadBill(); }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSearchFocus, createNewPath, onExport, onShare, onDownloadBill, navigate]);
};