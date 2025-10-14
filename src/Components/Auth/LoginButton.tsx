import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import Loading from '../Common/Loading';

const LoginButton: React.FC = () => {
  const auth = useAuth();

  if (auth.isLoading) return <Loading message="Loading data..." />;

  if (auth.isAuthenticated) {
    return (
      <div>
        <span>Welcome, {auth.user?.profile?.name || auth.user?.profile?.email}</span>
        <button className="btn btn-link p-0 ms-2" onClick={() => auth.logout()}>Logout</button>
      </div>
    );
  }

  return (
    <button className="btn btn-primary" onClick={() => auth.login()}>
      Login
    </button>
  );
};

export default LoginButton;