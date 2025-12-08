// src/Components/Purchase/PurchaseResponsive.tsx
import React from 'react';
import { useMediaQuery } from 'react-responsive';
import { useLocation } from 'react-router-dom';
import PageHeader from '../Layout/PageHeader';
import { Modal, Button } from 'react-bootstrap';
import { usePurchaseOrders } from '../../hooks/usePurchaseOrders'; // New hook
import PurchaseOrderTable from '../PurchaseOrder/PurchaseOrderTable';
import PurchaseReportTable from '../Reports/PurchaseReportTable';
import PurchaseFilter from './PurchaseFilter'; // New filter component

const PurchaseResponsive: React.FC = () => {
  const {
    loading,
    error,
    purchaseOrders,
    vendors,
    filters,
    setFilters,
    deleteModal,
    handleAddPayment,
  } = usePurchaseOrders();

  const isMobile = useMediaQuery({ maxWidth: 768 });
  const location = useLocation();

  // Determine title based on the route
  const isReportView = location.pathname.includes('/reports/purchases');
  const title = isReportView ? "Purchase Reports" : "Purchases";

  const renderContent = () => {
    if (isMobile) {
      // Mobile view - Management view with PurchaseOrderTable
      return (
        <>
          <PageHeader
            title={title}
            buttonVariant="primary"
            buttonLabel="Create New"
            buttonLink="/purchase-orders/create"
          />
          <div className="container mt-4">
            <PurchaseFilter vendors={vendors} filters={filters} setFilters={setFilters} />

            <PurchaseOrderTable
              purchaseOrders={purchaseOrders}
              loading={loading}
              error={error}
              onDelete={deleteModal.handleDelete}
              vendors={vendors}
              onAddPayment={handleAddPayment}
            />
            
            <Modal show={deleteModal.show} onHide={deleteModal.cancelDelete}>
              <Modal.Header closeButton>
                <Modal.Title>Confirm Delete</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                {deleteModal.errorMessage ? (
                  <div className="text-danger mb-3">{deleteModal.errorMessage}</div>
                ) : (
                  "Are you sure you want to delete this purchase order? This action cannot be undone."
                )}
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={deleteModal.cancelDelete}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={deleteModal.confirmDelete} disabled={!!deleteModal.errorMessage}>
                  Delete
                </Button>
              </Modal.Footer>
            </Modal>
          </div>
        </>
      );
    } 
    
    // Desktop view - Report view with PurchaseReportTable
    return (
      <>
        <PageHeader
          title={title}
          buttonVariant="primary"
          buttonLabel="Create New"
          buttonLink="/purchase-orders/create"
          buttonIcon="bi-plus-lg"
        />
        <div className="container mt-4">
          <PurchaseFilter vendors={vendors} filters={filters} setFilters={setFilters} />

          <PurchaseReportTable
            purchaseOrders={purchaseOrders}
            loading={loading}
            error={error}
            vendors={vendors}
          />
        </div>
      </>
    );
  };

  return <>{renderContent()}</>;
};

export default PurchaseResponsive;