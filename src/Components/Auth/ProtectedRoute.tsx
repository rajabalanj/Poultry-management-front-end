import React from 'react';
import { useAuth } from '../../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactElement;
  roles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles }) => {
  const auth = useAuth();
  const { user } = auth;

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

  if (roles && roles.length > 0) {
    const groups = user?.profile?.['cognito:groups'];
    const userGroups: string[] = Array.isArray(groups) ? groups : [];
    const hasRole = roles.some(role => userGroups.includes(role));

    if (!hasRole) {
      return <div>Access Denied</div>; // Or redirect to an unauthorized page
    }
  }

  return children;
};

export default ProtectedRoute;