import React, { useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Loading from '../Common/Loading';

interface ProtectedRouteProps {
  children: React.ReactElement;
  roles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles }) => {
  const auth = useAuth();
  const { user } = auth;
  const loginAttempted = useRef(false);

  useEffect(() => {
    // Only attempt login after mount and when not authenticated
    if (!auth.isAuthenticated && !auth.isLoading && !loginAttempted.current) {
      loginAttempted.current = true;
      
      // Check if we just logged out
      const justLoggedOut = (() => {
        try {
          return sessionStorage.getItem('justLoggedOut') === '1';
        } catch (e) {
          return false;
        }
      })();

      if (justLoggedOut) {
        try { sessionStorage.removeItem('justLoggedOut'); } catch (e) {}
        return;
      }

      auth.login();
    }
  }, [auth.isAuthenticated, auth.isLoading]);

  if (auth.isLoading) {
    return <Loading message="Loading data..." />;
  }

  if (!auth.isAuthenticated) {
    return <Loading message="Redirecting to login..." />;
  }

  if (roles && roles.length > 0) {
    const groups = user?.profile?.['cognito:groups'];
    const userGroups: string[] = Array.isArray(groups) ? groups : [];
    const hasRole = roles.some(role => userGroups.includes(role));

    if (!hasRole) {
      return <div>Access Denied</div>;
    }
  }

  return children;
};

export default ProtectedRoute;