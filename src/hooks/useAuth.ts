import { useAuth as useOidcAuth } from 'react-oidc-context';
import { useEffect } from 'react';
import { setAccessToken } from '../services/api';

export const useAuth = () => {
  const auth = useOidcAuth();
  
  useEffect(() => {
    if (auth.user?.access_token) {
      setAccessToken(auth.user.access_token);
    } else {
      setAccessToken(null);
    }
  }, [auth.user?.access_token]);

  useEffect(() => {
    const handleTokenExpired = () => {
      auth.signinSilent().catch(() => auth.signinRedirect());
    };
    
    window.addEventListener('auth:token-expired', handleTokenExpired);
    return () => window.removeEventListener('auth:token-expired', handleTokenExpired);
  }, [auth]);

  const logout = () => {
    auth.signoutRedirect();
  };
  
  return {
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    user: auth.user,
    login: () => auth.signinRedirect(),
    logout,
    getAccessToken: () => auth.user?.access_token,
  };
};
