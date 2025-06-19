import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ConfigContextType {
  lowKgThreshold: number;
  setLowKgThreshold: (value: number) => void;
  lowTonThreshold: number;
  setLowTonThreshold: (value: number) => void;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [lowKgThreshold, setLowKgThreshold] = useState(3000);
  const [lowTonThreshold, setLowTonThreshold] = useState(3);

  return (
    <ConfigContext.Provider value={{ lowKgThreshold, setLowKgThreshold, lowTonThreshold, setLowTonThreshold }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) throw new Error('useConfig must be used within a ConfigProvider');
  return context;
};
