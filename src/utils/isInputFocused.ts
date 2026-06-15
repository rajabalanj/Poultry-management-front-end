import { useEffect, useState } from 'react';

/**
 * Enhanced utility to check if the user is currently typing in an input field.
 * This handles both standard HTML elements and common third-party UI components.
 */
export const isInputFocused = (target: HTMLElement | null): boolean => {
  if (!target) return false;

  const tagName = target.tagName.toUpperCase();

  // 1. Standard HTML inputs that accept typing
  if (tagName === 'TEXTAREA') return true;
  if (tagName === 'INPUT') {
    const type = (target as HTMLInputElement).type.toLowerCase();
    // Non-text inputs (checkbox, radio, color, submit, etc.) do not block keyboard shortcuts
    const textInputTypes = [
      'text', 'password', 'email', 'number', 'search', 'tel', 'url', 'date',
      'datetime-local', 'month', 'time', 'week'
    ];
    return textInputTypes.includes(type) || !type;
  }

  // 2. Select elements
  if (tagName === 'SELECT') return true;

  // 3. Rich-text editors and contenteditable areas
  if (target.isContentEditable || !!target.closest('[contenteditable="true"]')) return true;

  // 4. Custom select widgets (like react-select inputs)
  if (target.closest('.react-select-container') && (tagName === 'INPUT' || target.getAttribute('role') === 'combobox')) {
    return true;
  }

  // 5. Datepicker text inputs
  if (target.closest('.react-datepicker-wrapper') && tagName === 'INPUT') {
    return true;
  }

  return false;
};

/**
 * Hook to track if any input-like element is currently focused
 */
export const useIsInputFocused = (): boolean => {
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const handleFocus = (e: FocusEvent) => {
      setIsFocused(isInputFocused(e.target as HTMLElement));
    };

    const handleBlur = () => {
      // Small delay to allow focus to transfer between elements
      setTimeout(() => {
        setIsFocused(isInputFocused(document.activeElement as HTMLElement || null));
      }, 0);
    };

    // Set initial state
    setIsFocused(isInputFocused(document.activeElement as HTMLElement || null));

    // Listen for focus changes
    document.addEventListener('focus', handleFocus, true);
    document.addEventListener('blur', handleBlur, true);

    return () => {
      document.removeEventListener('focus', handleFocus, true);
      document.removeEventListener('blur', handleBlur, true);
    };
  }, []);

  return isFocused;
};
