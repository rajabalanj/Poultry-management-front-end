import React, { useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';

const LogoutPage: React.FC = () => {
  const auth = useAuth();

  useEffect(() => {
    // Redirect to login after logout
    auth.login();
  }, [auth]);

  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <div>Redirecting to login...</div>
    </div>
  );
};

export default LogoutPage;