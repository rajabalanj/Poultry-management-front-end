
import React, { useState, useEffect } from 'react';
import "bootstrap-icons/font/bootstrap-icons.css";
import {
  Table,
  Button,
  Card,
  Badge,
  Modal,
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { ChartOfAccountsResponse } from '../../types/chartOfAccounts';
import { chartOfAccountsApi } from '../../services/api';
import { toast } from 'react-toastify';
import PageHeader from "../Layout/PageHeader";

const ChartOfAccountsList: React.FC = () => {
  const [accounts, setAccounts] = useState<ChartOfAccountsResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        setLoading(true);
        const data = await chartOfAccountsApi.getChartOfAccounts();
        setAccounts(data);
      } catch (err) {
        setError('Failed to fetch chart of accounts');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, []);

  const handleEdit = (id: number) => {
    navigate(`/chart-of-accounts/edit/${id}`);
  };

  const handleView = (id: number) => {
    navigate(`/chart-of-accounts/view/${id}`);
  };

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<number | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);

  const handleDelete = (id: number) => {
    setAccountToDelete(id);
    setDeleteErrorMessage(null);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (accountToDelete !== null) {
      try {
        await chartOfAccountsApi.deleteChartOfAccount(accountToDelete);
        setAccounts((prevAccounts) => prevAccounts.filter((account) => account.id !== accountToDelete));
        toast.success("Chart of Account deleted successfully!");
        setAccountToDelete(null);
        setShowDeleteModal(false);
      } catch (error: any) {
        const message = error?.message || 'Failed to delete chart of account';
        setDeleteErrorMessage(message);
        toast.error(message);
      }
    }
  };

  const cancelDelete = () => {
    setAccountToDelete(null);
    setShowDeleteModal(false);
    setDeleteErrorMessage(null);
  };

  if (loading) {
    return <div className="text-center mt-4">Loading chart of accounts...</div>;
  }

  if (error) {
    return <div className="text-center text-danger mt-4">{error}</div>;
  }

  return (
    <>
      <PageHeader
        title="Chart of Accounts"
        buttonVariant="primary"
        buttonLabel="Add New Account"
        buttonLink="/chart-of-accounts/new"
        buttonIcon="bi-plus-lg"
      />
      <div className="container mt-4">
        {accounts.length === 0 ? (
          <div className="text-center mt-4">No chart of accounts found</div>
        ) : (
          <Card>
            <Card.Body>
              <Table responsive>
                <thead>
                  <tr>
                    <th>Account Code</th>
                    <th>Account Name</th>
                    <th>Account Type</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((account) => (
                    <tr key={account.id}>
                      <td>{account.account_code}</td>
                      <td>{account.account_name}</td>
                      <td>{account.account_type}</td>
                      <td>{account.description}</td>
                      <td>
                        <Badge bg={account.is_active ? 'success' : 'secondary'}>
                          {account.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td>
                        <div className="btn-group" role="group">
                          <Button
                            variant="outline-info"
                            size="sm"
                            onClick={() => handleView(account.id)}
                            className="me-1"
                          >
                            <i className="bi bi-eye"></i>
                          </Button>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleEdit(account.id)}
                            className="me-1"
                          >
                            <i className="bi bi-pencil"></i>
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDelete(account.id)}
                          >
                            <i className="bi bi-trash"></i>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        )}

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

export default ChartOfAccountsList;
