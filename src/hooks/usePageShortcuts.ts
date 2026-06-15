import { useEffect, useLayoutEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShortcuts } from '../Components/context/KeyboardShortcutContext';
import { Shortcut } from '../types/shortcuts';

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
  const { registerShortcuts } = useShortcuts();

  // Use a mutable ref to always hold the latest callbacks without re-binding the listener
  const callbacksRef = useRef({
    onSearchFocus,
    createNewPath,
    onExport,
    onShare,
    onDownloadBill,
    navigate
  });

  // Update the ref in a layout effect so it's always current before events fire
  useLayoutEffect(() => {
    callbacksRef.current = {
      onSearchFocus,
      createNewPath,
      onExport,
      onShare,
      onDownloadBill,
      navigate
    };
  });

  useEffect(() => {
    const shortcuts: Shortcut[] = [];

    if (onSearchFocus) {
      shortcuts.push({
        key: '/',
        description: 'Focus Search/Filter',
        category: 'Page Actions',
        action: () => callbacksRef.current.onSearchFocus?.()
      });
    }

    if (createNewPath) {
      shortcuts.push({
        key: 'Alt+n',
        description: 'Create New',
        category: 'Page Actions',
        action: () => {
          if (callbacksRef.current.createNewPath) {
            callbacksRef.current.navigate(callbacksRef.current.createNewPath);
          }
        }
      });
    }

    if (onExport) {
      shortcuts.push({
        key: 'Alt+e',
        description: 'Export',
        category: 'Page Actions',
        action: () => callbacksRef.current.onExport?.()
      });
    }

    if (onShare) {
      shortcuts.push({
        key: 'Alt+s',
        description: 'Share',
        category: 'Page Actions',
        action: () => callbacksRef.current.onShare?.()
      });
    }

    if (onDownloadBill) {
      shortcuts.push({
        key: 'Alt+b',
        description: 'Download Bill',
        category: 'Page Actions',
        action: () => callbacksRef.current.onDownloadBill?.()
      });
    }

    const unregister = registerShortcuts(shortcuts);

    return () => {
      unregister();
    };
  }, [
    !!onSearchFocus,
    !!createNewPath,
    !!onExport,
    !!onShare,
    !!onDownloadBill,
    registerShortcuts
  ]);
};