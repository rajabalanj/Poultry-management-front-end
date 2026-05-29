import React, { useEffect, useState } from 'react';
import { Card, Table, Spinner, Alert, Button, Modal, Form } from 'react-bootstrap';
import { subscriptionApi, tenantFeatureApi } from '../../services/api';
import { SubscriptionStatusResponse } from '../../types/subscription';
import { TenantFeatureResponse } from '../../types/tenantFeature';
import PageHeader from '../Layout/PageHeader';

const SubscriptionsList: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<SubscriptionStatusResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [currentTenantId, setCurrentTenantId] = useState<string>('');
  const [formData, setFormData] = useState({
    tenant_id: '',
    is_paid: false,
    payment_date: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Feature Restriction states
  const [features, setFeatures] = useState<TenantFeatureResponse[]>([]);
  const [featuresLoading, setFeaturesLoading] = useState<boolean>(true);
  const [showFeatureModal, setShowFeatureModal] = useState<boolean>(false);
  const [isEditingFeature, setIsEditingFeature] = useState<boolean>(false);
  const [currentFeatureId, setCurrentFeatureId] = useState<number | null>(null);
  const [featureFormData, setFeatureFormData] = useState({
    tenant_id: '',
    feature_name: 'BATCH_MANAGEMENT',
    is_restricted: true
  });

  const fetchSubscriptions = async () => {
    try {
      const data = await subscriptionApi.getSubscriptions(0, 100);
      setSubscriptions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const fetchFeatures = async () => {
    try {
      const data = await tenantFeatureApi.getTenantFeatures(0, 100);
      setFeatures(data);
    } catch (err) {
      console.error('Failed to fetch features:', err);
    } finally {
      setFeaturesLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
    fetchFeatures();
  }, []);

  const handleOpenCreate = () => {
    setIsEditing(false);
    setFormData({ tenant_id: '', is_paid: false, payment_date: new Date().toISOString().split('T')[0], notes: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (sub: SubscriptionStatusResponse) => {
    setIsEditing(true);
    setCurrentTenantId(sub.tenant_id);
    setFormData({
      tenant_id: sub.tenant_id,
      is_paid: sub.is_paid,
      payment_date: sub.payment_date,
      notes: sub.notes || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (isEditing) {
        await subscriptionApi.updateSubscription(currentTenantId, {
          is_paid: formData.is_paid,
          payment_date: formData.payment_date,
          notes: formData.notes
        });
      } else {
        await subscriptionApi.createSubscription({
          tenant_id: formData.tenant_id,
          is_paid: formData.is_paid,
          payment_date: formData.payment_date,
          notes: formData.notes
        });
      }
      setShowModal(false);
      fetchSubscriptions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save subscription');
    } finally {
      setSubmitting(false);
    }
  };

  // Feature actions
  const handleOpenCreateFeature = () => {
    setIsEditingFeature(false);
    setFeatureFormData({ tenant_id: '', feature_name: 'BATCH_MANAGEMENT', is_restricted: true });
    setShowFeatureModal(true);
  };

  const handleOpenEditFeature = (feat: TenantFeatureResponse) => {
    setIsEditingFeature(true);
    setCurrentFeatureId(feat.id);
    setFeatureFormData({
      tenant_id: feat.tenant_id,
      feature_name: feat.feature_name,
      is_restricted: feat.is_restricted
    });
    setShowFeatureModal(true);
  };

  const handleDeleteFeature = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this restriction?")) {
      try {
        await tenantFeatureApi.deleteTenantFeature(id);
        fetchFeatures();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete feature restriction');
      }
    }
  };

  const handleFeatureSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (isEditingFeature && currentFeatureId !== null) {
        await tenantFeatureApi.updateTenantFeature(currentFeatureId, {
          is_restricted: featureFormData.is_restricted
        });
      } else {
        await tenantFeatureApi.createTenantFeature({ ...featureFormData });
      }
      setShowFeatureModal(false);
      fetchFeatures();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save feature');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader 
        title="All Tenant Subscriptions" 
        buttonLabel="Add Subscription" 
        buttonVariant="primary" 
        onButtonClick={handleOpenCreate}
        buttonIcon='bi bi-plus-lg' 
      />
      
      <div className="container">
      {loading && <div className="text-center p-5"><Spinner animation="border" /></div>}
      {error && <Alert variant="danger">{error}</Alert>}
      
      {!loading && !error && (
        <Card className="shadow-sm mb-4">
          <Card.Header>
            <h5 className="mb-0">Subscriptions</h5>
          </Card.Header>
          <Card.Body className="p-0">
            <Table responsive striped hover className="mb-0">
              <thead className="bg-light">
                <tr>
                  <th>Tenant ID</th>
                  <th>Payment Status</th>
                  <th>Payment Date</th>
                  <th>Notes</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.length > 0 ? (
                  subscriptions.map((sub) => (
                    <tr key={sub.id}>
                      <td>{sub.tenant_id}</td>
                      <td>
                        <span className={`badge bg-${sub.is_paid ? 'success' : 'danger'}`}>
                          {sub.is_paid ? 'Paid' : 'Unpaid'}
                        </span>
                      </td>
                      <td>{sub.payment_date}</td>
                      <td>{sub.notes || 'N/A'}</td>
                      <td>{new Date(sub.created_at).toLocaleDateString()}</td>
                      <td>
                        <Button variant="outline-primary" size="sm" onClick={() => handleOpenEdit(sub)}>
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-4">No subscriptions found</td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      <div className="d-flex justify-content-between align-items-center mb-4 mt-5">
        <h4 className="mb-0">Tenant Features</h4>
        <Button variant="primary" onClick={handleOpenCreateFeature}>
          Add Feature Restriction
        </Button>
      </div>

      {featuresLoading ? <div className="text-center p-5"><Spinner animation="border" /></div> : (
        <Card className="shadow-sm mb-4">
          <Card.Header>
            <h5 className="mb-0">Feature Restrictions</h5>
          </Card.Header>
          <Card.Body className="p-0">
            <Table responsive striped hover className="mb-0">
              <thead className="bg-light">
                <tr>
                  <th>Tenant ID</th>
                  <th>Feature Name</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {features.length > 0 ? (
                  features.map((feat) => (
                    <tr key={feat.id}>
                      <td>{feat.tenant_id}</td>
                      <td>{feat.feature_name}</td>
                      <td>
                        <span className={`badge bg-${feat.is_restricted ? 'danger' : 'success'}`}>
                          {feat.is_restricted ? 'Restricted' : 'Allowed'}
                        </span>
                      </td>
                      <td>
                        <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleOpenEditFeature(feat)}>
                          Edit
                        </Button>
                        <Button variant="outline-danger" size="sm" onClick={() => handleDeleteFeature(feat.id)}>
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-4">No feature restrictions found</td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      {/* Subscription Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{isEditing ? 'Edit Subscription' : 'Create Subscription'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Tenant ID</Form.Label>
              <Form.Control
                type="text"
                required
                disabled={isEditing}
                value={formData.tenant_id}
                onChange={(e) => setFormData({ ...formData, tenant_id: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check
                type="switch"
                id="is_paid_switch"
                label="Is Paid?"
                checked={formData.is_paid}
                onChange={(e) => setFormData({ ...formData, is_paid: e.target.checked })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Payment Date</Form.Label>
              <Form.Control
                type="date"
                required
                value={formData.payment_date}
                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? <Spinner size="sm" animation="border" /> : 'Save'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Feature Restriction Modal */}
      <Modal show={showFeatureModal} onHide={() => setShowFeatureModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{isEditingFeature ? 'Edit Feature Restriction' : 'Create Feature Restriction'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleFeatureSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Tenant ID</Form.Label>
              <Form.Control
                type="text"
                required
                disabled={isEditingFeature}
                value={featureFormData.tenant_id}
                onChange={(e) => setFeatureFormData({ ...featureFormData, tenant_id: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Feature Name</Form.Label>
              <Form.Control
                type="text"
                required
                disabled={isEditingFeature}
                value={featureFormData.feature_name}
                onChange={(e) => setFeatureFormData({ ...featureFormData, feature_name: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check
                type="switch"
                id="is_restricted_switch"
                label="Is Restricted?"
                checked={featureFormData.is_restricted}
                onChange={(e) => setFeatureFormData({ ...featureFormData, is_restricted: e.target.checked })}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowFeatureModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? <Spinner size="sm" animation="border" /> : 'Save'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
      </div>
    </>
  );
};

export default SubscriptionsList;