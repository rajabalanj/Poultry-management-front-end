import React from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../Layout/PageHeader';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <>
      <PageHeader title="Dashboard" />
      <div className="container mt-4">
        <div className="row">
          <div className="col-md-4 mb-3">
            <button className="btn btn-primary w-100 p-3" onClick={() => navigate('/production')}>
              <i className="bi bi-house-door-fill me-2"></i>
              Production
            </button>
          </div>
          <div className="col-md-4 mb-3">
            <button className="btn btn-success w-100 p-3" onClick={() => navigate('/purchase-orders/create')}>
              <i className="bi bi-cart-plus-fill me-2"></i>
              Purchase
            </button>
          </div>
          <div className="col-md-4 mb-3">
            <button className="btn btn-info w-100 p-3" onClick={() => navigate('/sales-orders/create')}>
              <i className="bi bi-graph-up-arrow me-2"></i>
              Sales
            </button>
          </div>
          <div className="col-md-4 mb-3">
            <button className="btn btn-warning w-100 p-3" onClick={() => navigate('/purchase-orders')}>
              <i className="bi bi-wallet-fill me-2"></i>
              Payment
            </button>
          </div>
          <div className="col-md-4 mb-3">
            <button className="btn btn-secondary w-100 p-3" onClick={() => navigate('/sales-orders')}>
              <i className="bi bi-cash-stack me-2"></i>
              Amount Received
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;