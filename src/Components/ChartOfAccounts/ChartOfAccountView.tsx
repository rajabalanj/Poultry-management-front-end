
import React, { useState, useEffect } from 'react';
import "bootstrap-icons/font/bootstrap-icons.css";
import {
  Card,
  Alert,
  Spinner,
  Badge,
  Button,
  Row,
  Col,
  Modal,
} from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { ChartOfAccountsResponse } from '../../types/chartOfAccounts';
import { chartOfAccountsApi } from '../../services/api';
import { toast } from 'react-toastify';
import PageHeader from "../Layout/PageHeader";

const ChartOfAccountView: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [account, setAccount] = useState<ChartOfAccountsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAccount = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const accountData = await chartOfAccountsApi.getChartOfAccount(Number(id));
        setAccount(accountData);
      } catch (err) {
        setError('Failed to fetch account details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAccount();
  }, [id]);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);

  const confirmDelete = async () => {
    try {
      await chartOfAccountsApi.deleteChartOfAccount(Number(id));
      toast.success("Chart of Account deleted successfully!");
      navigate('/chart-of-accounts');
    } catch (error: any) {
      const message = error?.message || 'Failed to delete chart of account';
      setDeleteErrorMessage(message);
      toast.error(message);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteErrorMessage(null);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <Spinner animation="border" role="status" />
      </div>
    );
  }

  if (error || !account) {
    return (
      <>
        <PageHeader
          title="Chart of Account Details"
          buttonVariant="secondary"
          buttonLabel="Back to List"
          buttonLink="/chart-of-accounts"
          buttonIcon="bi-arrow-left"
        />
        <div className="container mt-4">
          <Alert variant="danger">{error || 'Account not found'}</Alert>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Chart of Account Details"
        buttonVariant="secondary"
        buttonLabel="Back to List"
        buttonLink="/chart-of-accounts"
        buttonIcon="bi-arrow-left"
      />
      <div className="container mt-4">
        <Card>
          <Card.Body>
              <Row>
                <Col sm={6}>
                  <h6 className="text-muted">
                    Account Code
                  </h6>
                  <p className="fw-medium">
                    {account.account_code}
                  </p>
                </Col>

                <Col sm={6}>
                  <h6 className="text-muted">
                    Account Name
                  </h6>
                  <p className="fw-medium">
                    {account.account_name}
                  </p>
                </Col>

                <Col sm={6}>
                  <h6 className="text-muted">
                    Account Type
                  </h6>
                  <p className="fw-medium">
                    {account.account_type}
                  </p>
                </Col>

                <Col sm={6}>
                  <h6 className="text-muted">
                    Status
                  </h6>
                  <Badge bg={account.is_active ? 'success' : 'secondary'}>
                    {account.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </Col>

                <Col xs={12}>
                  <h6 className="text-muted">
                    Description
                  </h6>
                  <p>
                    {account.description || 'No description provided'}
                  </p>
                </Col>

                <Col sm={6}>
                  <h6 className="text-muted">
                    Created At
                  </h6>
                  <p>
                    {new Date(account.created_at).toLocaleString()}
                  </p>
                </Col>

                <Col sm={6}>
                  <h6 className="text-muted">
                    Last Updated
                  </h6>
                  <p>
                    {new Date(account.updated_at).toLocaleString()}
                  </p>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Modal show={showDeleteModal} onHide={cancelDelete}>
            <Modal.Header closeButton>
              <Modal.Title>Confirm Delete</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {deleteErrorMessage ? (
                <div className="text-danger mb-3">{deleteErrorMessage}</div>
              ) : (
                "Are you sure you want to delete this chart of account?"
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={cancelDelete}>
                Cancel
              </Button>
              <Button variant="danger" onClick={confirmDelete} disabled={!!deleteErrorMessage}>
                Delete
              </Button>
            </Modal.Footer>
          </Modal>
        </div>
      </>
  );
};

export default ChartOfAccountView;
