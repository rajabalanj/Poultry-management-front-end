import { useEffect } from 'react';
import { useShortcuts } from '../Components/context/KeyboardShortcutContext';

export const useModalScope = (isOpen: boolean, scopeName: string = 'modal') => {
    const { pushScope, popScope } = useShortcuts();

    useEffect(() => {
        if (isOpen) {
            pushScope(scopeName);
            return () => {
                popScope();
            };
        }
    }, [isOpen, pushScope, popScope, scopeName]);
};