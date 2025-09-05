export const cognitoConfig = {
  // Use the user-pool issuer for OIDC discovery (this provides the standard
  // .well-known/openid-configuration). If a hosted UI domain is available,
  // provide explicit metadata so the library uses the hosted UI oauth2
  // endpoints (including the logout endpoint) for signin/signout.
  authority: import.meta.env.VITE_COGNITO_AUTHORITY,
  client_id: import.meta.env.VITE_COGNITO_CLIENT_ID,
  redirect_uri: import.meta.env.VITE_COGNITO_REDIRECT_URI,
  post_logout_redirect_uri: import.meta.env.VITE_COGNITO_POST_LOGOUT_REDIRECT_URI,
  response_type: "code",
  scope: "openid email phone",
  automaticSilentRenew: false,
  loadUserInfo: true,
  // If a hosted UI domain is configured, override or provide the oauth2
  // endpoints so signoutRedirect can hit the hosted UI's logout endpoint
  // while discovery still comes from the user-pool issuer.
  ...(import.meta.env.VITE_COGNITO_DOMAIN ? {
    metadata: {
      issuer: import.meta.env.VITE_COGNITO_AUTHORITY,
      authorization_endpoint: `${import.meta.env.VITE_COGNITO_DOMAIN}/oauth2/authorize`,
      token_endpoint: `${import.meta.env.VITE_COGNITO_DOMAIN}/oauth2/token`,
      userinfo_endpoint: `${import.meta.env.VITE_COGNITO_DOMAIN}/oauth2/userInfo`,
      end_session_endpoint: `${import.meta.env.VITE_COGNITO_DOMAIN}/logout`,
    }
  } : {}),
};