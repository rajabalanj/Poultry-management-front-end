import React from 'react';
import { useAuth } from '../../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactElement;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const auth = useAuth();

  if (auth.isLoading) {
    return <div>Loading...</div>;
  }

  if (!auth.isAuthenticated) {
    // If we just logged out, skip auto-login to allow post-logout redirect to settle.
    const justLoggedOut = (() => {
      try {
        return sessionStorage.getItem('justLoggedOut') === '1';
      } catch (e) {
        return false;
      }
    })();

    if (justLoggedOut) {
      try { sessionStorage.removeItem('justLoggedOut'); } catch (e) {}
      return <div>You have signed out.</div>;
    }

    auth.login();
    return <div>Redirecting to login...</div>;
  }

  return children;
};

export default ProtectedRoute;