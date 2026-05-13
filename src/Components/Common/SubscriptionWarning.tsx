import React from 'react';
import { useSubscription } from '../context/SubscriptionContext';

const SubscriptionWarning: React.FC = () => {
  const { isSubscriptionPaid } = useSubscription();

  // If loading or paid, don't show the warning
  if (isSubscriptionPaid !== false) return null;

  return (
    <div className="alert alert-warning mb-4 d-flex align-items-center shadow-sm">
      <i className="bi bi-exclamation-triangle-fill me-3 text-warning" style={{ fontSize: "1.5rem" }}></i>
      <div>
        <strong>Subscription Inactive:</strong> Your organization's subscription is currently inactive. You can still view, share, and export data, but adding, modifying, or saving records is disabled until the subscription is renewed.
      </div>
    </div>
  );
};

export default SubscriptionWarning;
