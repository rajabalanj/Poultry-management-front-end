// src/Components/Sales/SalesResponsive.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { useMediaQuery } from 'react-responsive';
import { useLocation } from 'react-router-dom';
import PageHeader from '../Layout/PageHeader';
import { Modal, Button } from 'react-bootstrap';
import { SalesOrderStatus } from '../../types/SalesOrder';
import { useSalesOrders } from '../../hooks/useSalesOrders';
import { salesOrderApi } from '../../services/api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import SalesOrderTable from '../SalesOrder/SalesOrderTable';
import SalesReportTable from '../Reports/SalesReportsTable';
import SalesFilter from './SalesFilter'; // New filter component
import AddSalesPaymentForm from '../SalesOrder/AddSalesPaymentForm';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { useTableKeyboardNavigation } from '../../hooks/useTableKeyboardNavigation';

const SalesResponsive: React.FC = () => {
  const {
    loading,
    error,
    salesOrders,
    customers,
    filters,
    setFilters: originalSetFilters,
    deleteModal,
  } = useSalesOrders();

  const isMobile = useMediaQuery({ maxWidth: 768 });
  const location = useLocation();
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const rowsPerPage = 10;

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedSoId, setSelectedSoId] = useState<number | null>(null);
  const [downloadingBill, setDownloadingBill] = useState(false);

  // Keyboard navigation state
  const [focusedRowIndex, setFocusedRowIndex] = useState<number>(-1);

  const setFilters = useMemo(() => ({
    setCustomerId: (value: string) => {
      originalSetFilters.setCustomerId(value);
      setCurrentPage(1);
    },
    setStatus: (value: SalesOrderStatus | '') => {
      originalSetFilters.setStatus(value);
      setCurrentPage(1);
    },
    setStartDate: (value: Date | null) => {
      originalSetFilters.setStartDate(value);
      setCurrentPage(1);
    },
    setEndDate: (value: Date | null) => {
      originalSetFilters.setEndDate(value);
      setCurrentPage(1);
    },
  }), [originalSetFilters]);
  
  // Calculate pagination
  const totalPages = salesOrders.length > 0 ? Math.ceil(salesOrders.length / rowsPerPage) : 0;
  const validSalesOrders = salesOrders.filter(order => order && Object.keys(order).length > 0);
  const paginatedSalesOrders = validSalesOrders.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  // Determine title based on the route
  const isReportView = location.pathname.includes('/reports/sales');
  const title = isReportView ? "Sales Reports" : "Sales";

  const handleDownloadBill = async (status: 'paid' | 'unpaid') => {
    if (!filters.customerId) {
      toast.error("Please select a customer first.");
      return;
    }
    setDownloadingBill(true);
    try {
      const startDateStr = filters.startDate ? format(filters.startDate, 'yyyy-MM-dd') : undefined;
      const endDateStr = filters.endDate ? format(filters.endDate, 'yyyy-MM-dd') : undefined;
      const blob = await salesOrderApi.getCustomerBill(parseInt(filters.customerId), startDateStr, endDateStr, status);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Bill_${filters.customerId}_${status}_${format(new Date(), 'yyyyMMdd')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error: any) {
      toast.error(error.message || "Failed to download bill");
    } finally {
      setDownloadingBill(false);
    }
  };

  const handleOpenPayment = (soId: number) => {
    setSelectedSoId(soId);
    setShowPaymentModal(true);
  };

  // Handle Escape key for delete modal
  useEscapeKey(deleteModal.cancelDelete, deleteModal.show);

  // Handle Escape key for payment modal
  useEscapeKey(() => setShowPaymentModal(false), showPaymentModal);

  // Keyboard navigation for table rows
  const { resetSelection, setSelectedIndex } = useTableKeyboardNavigation({
    rowCount: paginatedSalesOrders.length,
    onRowSelect: (index) => {
      setFocusedRowIndex(index);
      const row = document.querySelector(`tr[data-row-index="${index}"]`);
      row?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    },
    onRowEnter: (index) => {
      const order = paginatedSalesOrders[index];
      if (order) {
        window.location.href = `/sales-orders/${order.id}/details`;
      }
    },
    onRowAction: (index, key) => {
      if (key === 'p' && paginatedSalesOrders[index]) {
        setSelectedSoId(paginatedSalesOrders[index].id);
        setShowPaymentModal(true);
      }
    },
    enabled: !showPaymentModal && !loading && paginatedSalesOrders.length > 0,
  });

  // Reset keyboard navigation when page changes
  useEffect(() => {
    resetSelection();
    setFocusedRowIndex(-1);
  }, [currentPage, resetSelection]);

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

            {filters.customerId && (
              <div className="d-flex justify-content-end gap-2 mb-3">
                <Button 
                  variant="outline-danger" 
                  onClick={() => handleDownloadBill('unpaid')}
                  disabled={downloadingBill}
                >
                  <i className="bi bi-file-earmark-pdf me-2"></i>{downloadingBill ? '...' : 'Download Unpaid Bill'}
                </Button>
                <Button
                  variant="outline-success"
                  onClick={() => handleDownloadBill('paid')}
                  disabled={downloadingBill}
                >
                  <i className="bi bi-file-earmark-pdf me-2"></i>{downloadingBill ? '...' : 'Download Paid Bill'}
                </Button>
              </div>
            )}

            <SalesOrderTable
              salesOrders={paginatedSalesOrders}
              loading={loading}
              error={error}
              onDelete={deleteModal.handleDelete}
              customers={customers}
              onAddPayment={handleOpenPayment}
              focusedRowIndex={focusedRowIndex}
              setFocusedRowIndex={setFocusedRowIndex}
              setSelectedIndex={setSelectedIndex}
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

            <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)} size="lg" centered>
              <Modal.Header closeButton>
                <Modal.Title>Add Payment</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                {selectedSoId && (
                  <AddSalesPaymentForm
                    soId={selectedSoId}
                    onSuccess={() => {
                      setShowPaymentModal(false);
                      // Refresh the sales orders list
                    }}
                    onCancel={() => setShowPaymentModal(false)}
                  />
                )}
              </Modal.Body>
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

          {filters.customerId && (
            <div className="d-flex justify-content-end gap-2 mb-3">
              <Button
                variant="outline-danger"
                onClick={() => handleDownloadBill('unpaid')}
                disabled={downloadingBill}
              >
                <i className="bi bi-file-earmark-pdf me-2"></i>{downloadingBill ? '...' : 'Download Unpaid Bill'}
              </Button>
              <Button
                variant="outline-success"
                onClick={() => handleDownloadBill('paid')}
                disabled={downloadingBill}
              >
                <i className="bi bi-file-earmark-pdf me-2"></i>{downloadingBill ? '...' : 'Download Paid Bill'}
              </Button>
            </div>
          )}

          <SalesReportTable
            salesOrders={paginatedSalesOrders}
            loading={loading}
            error={error}
            customers={customers}
            filters={filters}
            onAddPayment={handleOpenPayment}
            focusedRowIndex={focusedRowIndex}
            setFocusedRowIndex={setFocusedRowIndex}
            setSelectedIndex={setSelectedIndex}
            pagination={{
              currentPage,
              totalPages,
              setCurrentPage
            }}
          />
        </div>

        <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title>Add Payment</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedSoId && (
              <AddSalesPaymentForm
                soId={selectedSoId}
                onSuccess={() => {
                  setShowPaymentModal(false);
                  // Refresh the sales orders list
                }}
                onCancel={() => setShowPaymentModal(false)}
              />
            )}
          </Modal.Body>
        </Modal>
      </>
    );
  };

  return <>{renderContent()}</>;
};

export default SalesResponsive;