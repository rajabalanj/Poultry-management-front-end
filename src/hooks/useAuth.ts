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
  
  return {
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    user: auth.user,
    login: () => auth.signinRedirect(),
                logout: () => {
      const domain = import.meta.env.VITE_COGNITO_DOMAIN;
      const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID;
      const logoutUri = import.meta.env.VITE_COGNITO_POST_LOGOUT_REDIRECT_URI;
      const authority = import.meta.env.VITE_COGNITO_AUTHORITY;

      // Manually clear storage for oidc-client-ts
      if (authority && clientId) {
        const userKey = `oidc.user:${authority}:${clientId}`;
        sessionStorage.removeItem(userKey);
      }

      // Redirect to Cognito logout
      if (domain && clientId && logoutUri) {
        const logoutUrl = `${domain}/logout?client_id=${clientId}&logout_uri=${logoutUri}`;
        window.location.href = logoutUrl;
      } else {
        // As a fallback, try to clear user and redirect, though it might fail.
        auth.removeUser();
        auth.signoutRedirect();
      }
    },
    getAccessToken: () => auth.user?.access_token,
  };
};
