// src/Components/Sales/SalesResponsive.tsx
import React, { useState } from 'react';
import { useMediaQuery } from 'react-responsive';
import { useLocation } from 'react-router-dom';
import PageHeader from '../Layout/PageHeader';
import { Modal, Button } from 'react-bootstrap';
import { useSalesOrders } from '../../hooks/useSalesOrders'; // New hook
import SalesOrderTable from '../SalesOrder/SalesOrderTable';
import SalesReportTable from '../Reports/SalesReportsTable';
import SalesFilter from './SalesFilter'; // New filter component

const SalesResponsive: React.FC = () => {
  const {
    loading,
    error,
    salesOrders,
    customers,
    filters,
    setFilters,
    deleteModal,
    handleAddPayment,
  } = useSalesOrders();

  const isMobile = useMediaQuery({ maxWidth: 768 });
  const location = useLocation();
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const rowsPerPage = 10;
  
  // Calculate pagination
  const totalPages = salesOrders.length > 0 ? Math.ceil(salesOrders.length / rowsPerPage) : 0;
  const validSalesOrders = salesOrders.filter(order => order && Object.keys(order).length > 0);
  const paginatedSalesOrders = validSalesOrders.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  // Determine title based on the route
  const isReportView = location.pathname.includes('/reports/sales');
  const title = isReportView ? "Sales Reports" : "Sales";

  const renderContent = () => {
    // On desktop, always show the report view.
    // On mobile, show the management view.
    // The component is used for both /sales-orders and /reports/sales.
    // The `isReportView` or a different mechanism could be used to switch
    // but the original logic was based on screen size, so we'll stick to that.
    
    if (isMobile) {
      // Mobile view - Management view with SalesOrderTable
      return (
        <>
          <PageHeader
            title={title}
            buttonVariant="primary"
            buttonLabel="Create New"
            buttonLink="/sales-orders/create"
            buttonIcon="bi-plus-lg"
          />
          <div className="container mt-4">
            <SalesFilter customers={customers} filters={filters} setFilters={setFilters} />

            <SalesOrderTable
              salesOrders={paginatedSalesOrders}
              loading={loading}
              error={error}
              onDelete={deleteModal.handleDelete}
              customers={customers}
              onAddPayment={handleAddPayment}
              pagination={{
                currentPage,
                totalPages,
                setCurrentPage
              }}
            />
            
            <Modal show={deleteModal.show} onHide={deleteModal.cancelDelete}>
              <Modal.Header closeButton>
                <Modal.Title>Confirm Delete</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                {deleteModal.errorMessage ? (
                  <div className="text-danger mb-3">{deleteModal.errorMessage}</div>
                ) : (
                  "Are you sure you want to delete this sales order? This action cannot be undone."
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
    
    // Desktop view - Report view with SalesReportTable
    return (
      <>
        <PageHeader
          title={title}
          buttonVariant="primary"
          buttonLabel="Create New"
          buttonLink="/sales-orders/create"
          buttonIcon="bi-plus-lg"
        />
        <div className="container mt-4">
          <SalesFilter customers={customers} filters={filters} setFilters={setFilters} />

          <SalesReportTable
            salesOrders={paginatedSalesOrders}
            loading={loading}
            error={error}
            customers={customers}
            pagination={{
              currentPage,
              totalPages,
              setCurrentPage
            }}
          />
        </div>
      </>
    );
  };

  return <>{renderContent()}</>;
};

export default SalesResponsive;