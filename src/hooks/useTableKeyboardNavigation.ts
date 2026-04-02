import { useEffect, useRef, useCallback } from 'react';

interface UseTableKeyboardNavigationOptions {
  rowCount: number;
  onRowSelect: (index: number) => void;
  onRowEnter: (index: number) => void;
  onRowAction?: (index: number, key: string) => void;
  enabled?: boolean;
}

export const useTableKeyboardNavigation = ({
  rowCount,
  onRowSelect,
  onRowEnter,
  onRowAction,
  enabled = true,
}: UseTableKeyboardNavigationOptions) => {
  const selectedIndexRef = useRef<number>(-1);
  const handlersRef = useRef({ onRowSelect, onRowEnter, onRowAction, rowCount });

  // Keep handlers up to date without re-binding the event listener
  useEffect(() => {
    handlersRef.current = { onRowSelect, onRowEnter, onRowAction, rowCount };
  }, [onRowSelect, onRowEnter, onRowAction, rowCount]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle arrow keys and Enter when not in an input field
      const target = event.target as HTMLElement;
      const isInputFocused = target.tagName === 'INPUT' || 
                             target.tagName === 'TEXTAREA' || 
                             target.tagName === 'SELECT' ||
                             target.isContentEditable;

      if (isInputFocused) return;

      const { onRowSelect: select, onRowEnter: enter, onRowAction: action, rowCount: count } = handlersRef.current;

      const navigationKeys = ['ArrowUp', 'ArrowDown', 'Enter', 'p', 'P'];

      if (count > 0 && navigationKeys.includes(event.key)) {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          selectedIndexRef.current = Math.min(selectedIndexRef.current + 1, count - 1);
          if (selectedIndexRef.current >= 0) {
            select(selectedIndexRef.current);
          }
        } else if (event.key === 'ArrowUp') {
          event.preventDefault();
          selectedIndexRef.current = selectedIndexRef.current === -1 ? 0 : Math.max(selectedIndexRef.current - 1, 0);
          if (selectedIndexRef.current >= 0) {
            select(selectedIndexRef.current);
          }
        } else if (event.key === 'Enter' && selectedIndexRef.current >= 0) {
          event.preventDefault();
          enter(selectedIndexRef.current);
        } else if (['p', 'P'].includes(event.key) && selectedIndexRef.current >= 0) {
          event.preventDefault();
          action?.(selectedIndexRef.current, event.key.toLowerCase());
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled]);

  const setSelectedIndex = useCallback((index: number) => {
    selectedIndexRef.current = index;
  }, []);

  const resetSelection = useCallback(() => {
    selectedIndexRef.current = -1;
  }, []);

  return { resetSelection, setSelectedIndex };
};
