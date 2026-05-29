import React, { useEffect, useState } from 'react';
import { Card, Spinner, Alert, Row, Col } from 'react-bootstrap';
import { subscriptionApi } from '../../services/api.ts'; // Adjust the import path as needed
import { SubscriptionStatusResponse } from '../../types/subscription.ts';
import PageHeader from '../Layout/PageHeader.tsx'; // Adjust the import path as needed

const AdminDashboard: React.FC = () => {
  const [status, setStatus] = useState<SubscriptionStatusResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await subscriptionApi.getStatus();
        setStatus(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, []);

  return (
    <>
      <PageHeader title="Admin Dashboard" />
      
      <div className="container">
      {loading && <div className="text-center p-5"><Spinner animation="border" /></div>}
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      {status && (
        <Row>
          <Col md={6}>
            <Card className="mb-4 shadow-sm">
              <Card.Header>
                <h5 className="mb-0">Subscription Status</h5>
              </Card.Header>
              <Card.Body>
                <dl className="row mb-0">
                  <dt className="col-sm-4">Tenant ID</dt>
                  <dd className="col-sm-8">{status.tenant_id}</dd>
                  
                  <dt className="col-sm-4">Payment Status</dt>
                  <dd className="col-sm-8">
                    <span className={`badge bg-${status.is_paid ? 'success' : 'danger'}`}>
                      {status.is_paid ? 'Paid' : 'Unpaid'}
                    </span>
                  </dd>
                  
                  <dt className="col-sm-4">Payment Date</dt>
                  <dd className="col-sm-8">{status.payment_date}</dd>
                  
                  <dt className="col-sm-4">Notes</dt>
                  <dd className="col-sm-8">{status.notes || 'N/A'}</dd>

                  <dt className="col-sm-4">Created At</dt>
                  <dd className="col-sm-8">{new Date(status.created_at).toLocaleString()}</dd>

                  <dt className="col-sm-4">Updated At</dt>
                  <dd className="col-sm-8">{new Date(status.updated_at).toLocaleString()}</dd>
                </dl>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
      </div>
    </>
  );
};

export default AdminDashboard;