import React, { createContext, useContext, useState, useEffect } from 'react';
import { subscriptionApi, setSubscriptionPaid } from '../../services/api';

interface SubscriptionContextType {
  isSubscriptionPaid: boolean | null;
  loading: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  isSubscriptionPaid: null,
  loading: true,
});

export const useSubscription = () => useContext(SubscriptionContext);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSubscriptionPaid, setIsSubscriptionPaid] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const status = await subscriptionApi.getStatus();
        setSubscriptionPaid(status.is_paid);
        setIsSubscriptionPaid(status.is_paid);
      } catch (err) {
        console.error('Failed to fetch subscription status:', err);
      } finally {
        setLoading(false);
      }
    };
    checkSubscription();
  }, []);

  return (
    <SubscriptionContext.Provider value={{ isSubscriptionPaid, loading }}>
      {children}
    </SubscriptionContext.Provider>
  );
};
