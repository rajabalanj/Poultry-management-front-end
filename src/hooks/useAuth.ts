import { useAuth as useOidcAuth } from 'react-oidc-context';
import { useEffect, useState } from 'react';
import { setAccessToken, setTenantId } from '../services/api';

export const useAuth = () => {
  const auth = useOidcAuth();
  const [isAuthReady, setIsAuthReady] = useState(false);
  
  useEffect(() => {
    if (auth.user) {
      const organizationId = auth.user.profile['custom:organization'] as string | undefined;
      setTenantId(organizationId || null);
      setAccessToken(auth.user.access_token);
      setIsAuthReady(true);
    } else if (!auth.isLoading) {
      // If there's no user and auth is not loading, it's ready
      console.log("Auth: No user found and not loading.");
      setTenantId(null);
      setAccessToken(null);
      setIsAuthReady(true);
    }
  }, [auth.user, auth.isLoading]);

  useEffect(() => {
    const handleTokenExpired = () => {
      auth.signinSilent().catch(() => auth.signinRedirect());
    };
    
    window.addEventListener('auth:token-expired', handleTokenExpired);
    return () => window.removeEventListener('auth:token-expired', handleTokenExpired);
  }, [auth]);
  
  return {
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading || !isAuthReady, // Combine isLoading with isAuthReady
    user: auth.user,
    isAuthReady, // Expose the ready state
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
