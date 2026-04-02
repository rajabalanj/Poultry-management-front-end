import { useEffect, useCallback } from 'react';

export const useEscapeKey = (callback: () => void, isActive: boolean = true) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && isActive) {
      callback();
    }
  }, [callback, isActive]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
};
