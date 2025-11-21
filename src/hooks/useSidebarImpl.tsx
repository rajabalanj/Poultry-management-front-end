import React, { useState, useEffect, createContext, useContext } from 'react';
import { useMediaQuery } from 'react-responsive';

type SidebarContextType = {
  isOpen: boolean;
  toggle: () => void;
  isDesktop: boolean;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const SidebarProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const isDesktop = useMediaQuery({ minWidth: 992 });
  const [isOpen, setIsOpen] = useState(isDesktop);

  useEffect(() => {
    setIsOpen(isDesktop);
  }, [isDesktop]);

  const toggle = () => setIsOpen((v) => !v);

  return (
    <SidebarContext.Provider value={{ isOpen, toggle, isDesktop }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = (): SidebarContextType => {
  const ctx = useContext(SidebarContext);
  
  // Fallback to local state if provider is not present
  const isDesktop = useMediaQuery({ minWidth: 992 });
  const [isOpen, setIsOpen] = useState(isDesktop);

  useEffect(() => {
    setIsOpen(isDesktop);
  }, [isDesktop]);

  const toggle = () => setIsOpen((v) => !v);
  
  if (ctx) return ctx;
  return { isOpen, toggle, isDesktop };
};
