import React from 'react';
import { useAuth } from '../../hooks/useAuth';

const Callback: React.FC = () => {
  const auth = useAuth();

  React.useEffect(() => {
    if (!auth.isLoading && auth.isAuthenticated) {
      // Once authenticated, navigate to the app root
      window.location.href = '/';
    }
  }, [auth.isLoading, auth.isAuthenticated]);

  return <div>Processing login...</div>;
};

export default Callback;