
import React, { useState, useEffect } from 'react';
import "bootstrap-icons/font/bootstrap-icons.css";
import {
  Alert,
  Spinner,
} from 'react-bootstrap';
import { Save } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChartOfAccountsRequest } from '../../types/chartOfAccounts';
import { chartOfAccountsApi } from '../../services/api';
import PageHeader from "../Layout/PageHeader";

const ChartOfAccountsForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState<ChartOfAccountsRequest>({
    account_code: '',
    account_name: '',
    account_type: '',
    description: '',
    is_active: true,
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  // Account type options
  const accountTypes = [
    'Asset',
    'Liability',
    'Equity',
    'Revenue',
    'Expense',
  ];

  useEffect(() => {
    if (isEdit && id) {
      const fetchAccount = async () => {
        try {
          setLoading(true);
          const account = await chartOfAccountsApi.getChartOfAccount(Number(id));
          setFormData({
            account_code: account.account_code,
            account_name: account.account_name,
            account_type: account.account_type,
            description: account.description,
            is_active: account.is_active,
          });
        } catch (err) {
          setError('Failed to fetch account details');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };

      fetchAccount();
    }
  }, [isEdit, id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  // No longer needed as we handle all changes in handleChange

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      if (isEdit && id) {
        await chartOfAccountsApi.updateChartOfAccount(Number(id), formData);
      } else {
        await chartOfAccountsApi.createChartOfAccount(formData);
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/chart-of-accounts');
      }, 1500);
    } catch (err) {
      setError('Failed to save account');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/chart-of-accounts');
  };

  return (
    <>
      <PageHeader
        title={isEdit ? 'Edit Chart of Account' : 'Add New Chart of Account'}
        buttonVariant="secondary"
        buttonLabel="Back to List"
        buttonLink="/chart-of-accounts"
        buttonIcon="bi-arrow-left"
      />

      {error && (
        <Alert variant="danger" className="mt-3 mx-4">
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" className="mt-3 mx-4">
          Account saved successfully! Redirecting...
        </Alert>
      )}

      <div className="container mt-4">
        <div className="card shadow-sm">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label htmlFor="account_code" className="form-label">Account Code <span className="form-field-required">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    id="account_code"
                    name="account_code"
                    value={formData.account_code}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label htmlFor="account_name" className="form-label">Account Name <span className="form-field-required">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    id="account_name"
                    name="account_name"
                    value={formData.account_name}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label htmlFor="account_type" className="form-label">Account Type <span className="form-field-required">*</span></label>
                  <select
                    className="form-select"
                    id="account_type"
                    name="account_type"
                    value={formData.account_type}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  >
                    <option value="">Select Account Type</option>
                    {accountTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-6">
                  <div className="form-check form-switch mt-4 pt-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="is_active"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleChange}
                      disabled={loading}
                    />
                    <label className="form-check-label" htmlFor="is_active">
                      Active
                    </label>
                  </div>
                </div>

                <div className="col-12">
                  <label htmlFor="description" className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    disabled={loading}
                    rows={3}
                  />
                </div>

                <div className="col-12 mt-4">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={16} className="me-2" />
                        Save
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary ms-2"
                    onClick={handleBack}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChartOfAccountsForm;
