import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { configApi } from '../services/api';
import { getTenantId } from '../services/api';

const TenantConfig: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [checkLoading, setCheckLoading] = useState(true);

  const groups = (user?.profile && (user.profile['cognito:groups'] as unknown)) as string[] | undefined;
  const isAdmin = groups?.includes('admin');

  useEffect(() => {
    const checkInitialization = async () => {
      try {
        const tenantId = getTenantId();
        if (tenantId && isAdmin) {
          const initialized = await configApi.areTenantConfigsInitialized(tenantId);
          setIsInitialized(initialized);
        }
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'An unknown error occurred.');
      } finally {
        setCheckLoading(false);
      }
    };

    checkInitialization();
  }, [isAdmin]);

  const handleInitialize = async () => {
    if (!isAdmin) {
      setMessage('You are not authorized to perform this action.');
      return;
    }

    if (!window.confirm('Are you sure you want to initialize tenant configurations? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const tenantId = getTenantId();
      if (!tenantId) {
        throw new Error('Tenant ID not found.');
      }
      await configApi.initializeTenantConfigs(tenantId);
      setIsInitialized(true);
      setMessage('Tenant configurations initialized successfully.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAdmin) {
    return null; // Do not render anything if the user is not an admin
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Tenant Configuration</h3>
      </div>
      <div className="card-body">
        {checkLoading ? (
          <p>Checking configuration status...</p>
        ) : isInitialized ? (
          <p>Tenant configurations are already initialized.</p>
        ) : (
          <div>
            <p>Initialize tenant-specific configurations. This should only be done once per tenant.</p>
            <button
              className="btn btn-primary"
              onClick={handleInitialize}
              disabled={isLoading}
            >
              {isLoading ? 'Initializing...' : 'Initialize Tenant Configurations'}
            </button>
          </div>
        )}
        {message && <p className="mt-3">{message}</p>}
      </div>
    </div>
  );
};

export default TenantConfig;