import { useCallback, useEffect, useState } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import PageHeader from "../Layout/PageHeader";
import { Modal, Button } from "react-bootstrap";
import { businessPartnerApi } from "../../services/api";
import { BusinessPartner } from "../../types/BusinessPartner";
import { toast } from 'react-toastify';
import BusinessPartnerTable from "./BusinessPartnerTable";

const BusinessPartnerIndexPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [partners, setPartners] = useState<BusinessPartner[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [partnerToDelete, setPartnerToDelete] = useState<number | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'vendors' | 'customers'>('all');

  useEffect(() => {
    const fetchPartners = async () => {
      setLoading(true);
      setError(null);
      try {
        let isVendor: boolean | undefined;
        let isCustomer: boolean | undefined;
        
        if (filterType === 'vendors') {
          isVendor = true;
        } else if (filterType === 'customers') {
          isCustomer = true;
        }
        
        const response = await businessPartnerApi.getBusinessPartners(0, 100, undefined, isVendor, isCustomer);
        setPartners(response);
      } catch (error: any) {
        setError(error?.message || 'Failed to fetch peoples');
        toast.error(error?.message || 'Failed to fetch peoples');
      } finally {
        setLoading(false);
      }
    };
    fetchPartners();
  }, [filterType]);

  const handleDelete = useCallback((id: number) => {
    setPartnerToDelete(id);
    setDeleteErrorMessage(null);
    setShowDeleteModal(true);
  }, []);

  const confirmDelete = async () => {
    if (partnerToDelete !== null) {
      try {
        await businessPartnerApi.deleteBusinessPartner(partnerToDelete);
        setPartners((prev) => prev.filter((partner) => partner.id !== partnerToDelete));
        toast.success("People deleted successfully!");
        setPartnerToDelete(null);
        setShowDeleteModal(false);
      } catch (error: any) {
        const message = error?.message || 'Failed to delete people';
        setDeleteErrorMessage(message);
        toast.error(message);
      }
    }
  };

  const cancelDelete = () => {
    setPartnerToDelete(null);
    setShowDeleteModal(false);
    setDeleteErrorMessage(null);
  };

  return (
    <>
      <div className="container">
      <PageHeader title="People" buttonVariant="primary" buttonLabel="Add People" buttonLink="/business-partners/create" />
      
      <div className="mb-3">
        <div className="card shadow-sm">
          <div className="card-header d-md-none p-3">
            <select className="form-select" value={filterType} onChange={(e) => setFilterType(e.target.value as 'all' | 'vendors' | 'customers')}>
              <option value="all">All Partners</option>
              <option value="vendors">Vendors Only</option>
              <option value="customers">Customers Only</option>
            </select>
          </div>
          <div className="card-header d-none d-md-block p-0">
            <div className="btn-group w-100" role="group">
          <button 
            className={`btn ${filterType === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setFilterType('all')}
          >
            All Partners
          </button>
          <button 
            className={`btn ${filterType === 'vendors' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setFilterType('vendors')}
          >
            Vendors Only
          </button>
          <button 
            className={`btn ${filterType === 'customers' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setFilterType('customers')}
          >
            Customers Only
          </button>
            </div>
          </div>
        </div>
      </div>

      <BusinessPartnerTable
        partners={partners}
        loading={loading}
        error={error}
        onDelete={handleDelete}
      />

      <Modal show={showDeleteModal} onHide={cancelDelete}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {deleteErrorMessage ? (
            <div className="text-danger mb-3">{deleteErrorMessage}</div>
          ) : (
            "Are you sure you want to delete this people?"
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

export default BusinessPartnerIndexPage;