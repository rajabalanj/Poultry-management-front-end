import { useEffect, useRef, useCallback } from 'react';
import { isInputFocused } from '../utils/isInputFocused';

interface UseTableKeyboardNavigationOptions {
  rowCount: number;
  containerRef: React.RefObject<HTMLElement | null>;
  onRowSelect: (index: number) => void;
  onRowEnter: (index: number) => void;
  onRowAction?: (index: number, key: string) => void;
  enabled?: boolean;
  actionKeys?: string[];
}

export const useTableKeyboardNavigation = ({
  rowCount,
  containerRef,
  onRowSelect,
  onRowEnter,
  onRowAction,
  enabled = true,
  actionKeys = [],
}: UseTableKeyboardNavigationOptions) => {
  const selectedIndexRef = useRef<number>(-1);
  const handlersRef = useRef({ onRowSelect, onRowEnter, onRowAction, rowCount, actionKeys });

  // Keep handlers up to date without re-binding the event listener
  useEffect(() => {
    handlersRef.current = { onRowSelect, onRowEnter, onRowAction, rowCount, actionKeys };
  }, [onRowSelect, onRowEnter, onRowAction, rowCount, actionKeys]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle arrow keys and Enter when not in an input field
      const target = event.target as HTMLElement;
      if (isInputFocused(target)) return;

      const { onRowSelect: select, onRowEnter: enter, onRowAction: action, rowCount: count, actionKeys: keys } = handlersRef.current;

      const navigationKeys = ['ArrowUp', 'ArrowDown', 'Enter', ...keys];

      const scrollToRow = (index: number) => {
        const element = containerRef.current;
        if (!element) return;
        const row = element.querySelector(`[data-row-index="${index}"]`);
        if (row) {
          row.scrollIntoView({ block: 'nearest' });
        }
      };

      if (count > 0 && navigationKeys.includes(event.key)) {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          selectedIndexRef.current = Math.min(selectedIndexRef.current + 1, count - 1);
          if (selectedIndexRef.current >= 0) {
            select(selectedIndexRef.current);
            scrollToRow(selectedIndexRef.current);
          }
        } else if (event.key === 'ArrowUp') {
          event.preventDefault();
          selectedIndexRef.current = selectedIndexRef.current === -1 ? 0 : Math.max(selectedIndexRef.current - 1, 0);
          if (selectedIndexRef.current >= 0) {
            select(selectedIndexRef.current);
            scrollToRow(selectedIndexRef.current);
          }
        } else if (event.key === 'Enter' && selectedIndexRef.current >= 0) {
          event.preventDefault();
          enter(selectedIndexRef.current);
        } else if (keys.includes(event.key) && selectedIndexRef.current >= 0) {
          event.preventDefault();
          action?.(selectedIndexRef.current, event.key);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, containerRef]);

  const setSelectedIndex = useCallback((index: number) => {
    selectedIndexRef.current = index;
  }, []);

  const resetSelection = useCallback(() => {
    selectedIndexRef.current = -1;
  }, []);

  return { resetSelection, setSelectedIndex };
};
