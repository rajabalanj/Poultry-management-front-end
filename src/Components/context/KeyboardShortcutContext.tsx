import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from 'react';
import { Shortcut } from '../../types/shortcuts';
import { isInputFocused } from '../../utils/isInputFocused';

interface ShortcutContextType {
    registerShortcuts: (shortcuts: Shortcut[], scope?: string) => () => void;
    activeShortcuts: Shortcut[];
    pushScope: (scope: string) => void;
    popScope: () => void;
}

const KeyboardShortcutContext = createContext<ShortcutContextType | undefined>(undefined);

export const KeyboardShortcutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
    const [scopeStack, setScopeStack] = useState<string[]>(['global']);
    const activeScope = scopeStack[scopeStack.length - 1];

    // Use refs to always have the latest shortcuts without re-binding the event listener
    const shortcutsRef = useRef(shortcuts);
    useLayoutEffect(() => {
        shortcutsRef.current = shortcuts;
    }, [shortcuts]);

    const activeScopeRef = useRef(activeScope);
    useLayoutEffect(() => {
        activeScopeRef.current = activeScope;
    }, [activeScope]);

    const registerShortcuts = useCallback((newShortcuts: Shortcut[], scope = 'global') => {
        setShortcuts(prev => {
            // Filter out existing shortcuts with the same keys in the same scope to prevent duplicates
            const filtered = prev.filter(p => !newShortcuts.some(n => n.key === p.key && p.scope === scope));
            return [...filtered, ...newShortcuts.map(s => ({ ...s, scope }))];
        });

        return () => {
            setShortcuts(prev => prev.filter(s => !newShortcuts.some(n => n.key === s.key && s.scope === scope)));
        };
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            const isInput = isInputFocused(target);

            for (const shortcut of shortcutsRef.current) {
                if (shortcut.scope !== 'global' && shortcut.scope !== activeScopeRef.current) continue;

                const parts = shortcut.key.toLowerCase().split('+');
                const wantsAlt = parts.includes('alt');
                const wantsCtrl = parts.includes('ctrl') || parts.includes('cmd') || parts.includes('meta');
                const wantKey = parts[parts.length - 1];

                // Allow matching physical keys for MacOS Option combinations (e.g. Option+M = µ)
                const isKeyMatch = e.key.toLowerCase() === wantKey ||
                    (wantKey.length === 1 && e.code.toLowerCase() === `key${wantKey}`);

                if (
                    isKeyMatch &&
                    e.altKey === wantsAlt &&
                    (e.ctrlKey || e.metaKey) === wantsCtrl
                ) {
                    // If typing in an input field, skip single-key shortcuts (e.g., '/', 'd', 'p')
                    if (isInput && parts.length === 1) continue;

                    e.preventDefault();
                    shortcut.action(e);
                    break; // Stop after first match
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []); // Empty dependency array ensures listener is never detached

    const pushScope = useCallback((scope: string) => setScopeStack(prev => [...prev, scope]), []);
    const popScope = useCallback(() => setScopeStack(prev => prev.length > 1 ? prev.slice(0, -1) : prev), []);

    const activeShortcuts = useMemo(() => shortcuts.filter(s => s.scope === 'global' || s.scope === activeScope), [shortcuts, activeScope]);

    const contextValue = useMemo(() => ({
        registerShortcuts,
        activeShortcuts,
        pushScope,
        popScope
    }), [registerShortcuts, activeShortcuts, pushScope, popScope]);

    return (
        <KeyboardShortcutContext.Provider value={contextValue}>
            {children}
        </KeyboardShortcutContext.Provider>
    );
};

export const useShortcuts = () => {
    const context = useContext(KeyboardShortcutContext);
    if (!context) throw new Error('useShortcuts must be used within KeyboardShortcutProvider');
    return context;
};