// src/Components/Purchase/PurchaseResponsive.tsx
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useMediaQuery } from 'react-responsive';
import { useLocation } from 'react-router-dom';
import PageHeader from '../Layout/PageHeader';
import { Modal, Button } from 'react-bootstrap';
import { PurchaseOrderStatus } from '../../types/PurchaseOrder';
import { usePurchaseOrders } from '../../hooks/usePurchaseOrders'; // New hook
import PurchaseOrderTable from '../PurchaseOrder/PurchaseOrderTable';
import PurchaseReportTable from '../Reports/PurchaseReportTable';
import PurchaseFilter from './PurchaseFilter'; // New filter component
import AddPaymentForm from '../PurchaseOrder/AddPaymentForm';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { useSubscription } from '../context/SubscriptionContext';
import SubscriptionWarning from '../Common/SubscriptionWarning';
import { useTableKeyboardNavigation } from '../../hooks/useTableKeyboardNavigation';
import KeyboardShortcutsIndicator from '../Common/KeyboardShortcutsIndicator';
import { usePageShortcuts } from '../../hooks/usePageShortcuts';
import { useModalScope } from '../../hooks/useModalScope';

const PurchaseResponsive: React.FC = () => {
  const {
    loading,
    error,
    purchaseOrders,
    vendors,
    filters,
    setFilters: originalSetFilters,
    deleteModal
  } = usePurchaseOrders();

  const isMobile = useMediaQuery({ maxWidth: 768 });
  const location = useLocation();

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const rowsPerPage = 10;

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPoId, setSelectedPoId] = useState<number | null>(null);

  // Keyboard navigation state
  const [focusedRowIndex, setFocusedRowIndex] = useState<number>(-1);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const setFilters = useMemo(() => ({
    setVendorId: (value: string) => {
      originalSetFilters.setVendorId(value);
      setCurrentPage(1);
    },
    setStatus: (value: PurchaseOrderStatus | '') => {
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
  const totalPages = purchaseOrders.length > 0 ? Math.ceil(purchaseOrders.length / rowsPerPage) : 0;
  const validPurchaseOrders = purchaseOrders.filter(order => order && Object.keys(order).length > 0);
  const paginatedPurchaseOrders = validPurchaseOrders.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  // Determine title based on the route
  const isReportView = location.pathname.includes('/reports/purchases');
  const title = isReportView ? "Purchase Reports" : "Purchases";
  const { isSubscriptionPaid } = useSubscription();

  const handleOpenPayment = (poId: number) => {
    setSelectedPoId(poId);
    setShowPaymentModal(true);
  };

  // Handle Escape key for delete modal
  useEscapeKey(deleteModal.cancelDelete, deleteModal.show);

  // Handle Escape key for payment modal
  useEscapeKey(() => setShowPaymentModal(false), showPaymentModal);

  // Push 'modal' scope to temporarily disable page/table shortcuts while modals are open
  useModalScope(showPaymentModal || deleteModal.show, 'modal');

  // Keyboard navigation for table rows
  const { resetSelection, setSelectedIndex } = useTableKeyboardNavigation({
    rowCount: paginatedPurchaseOrders.length,
    containerRef: tableContainerRef,
    onRowSelect: (index) => {
      setFocusedRowIndex(index);
    },
    onRowEnter: (index) => {
      const order = paginatedPurchaseOrders[index];
      if (order) {
        window.location.href = `/purchase-orders/${order.id}/details`;
      }
    },
    onRowAction: (index, key) => {
      const order = paginatedPurchaseOrders[index];
      if (!order) return;
      const k = key.toLowerCase();
      if (k === 'p') {
        setSelectedPoId(order.id);
        setShowPaymentModal(true);
      } else if (k === 'd') {
        if (isSubscriptionPaid !== false) {
          deleteModal.handleDelete(order.id);
        }
      } else if (k === 'v') {
        const row = document.querySelector(`tr[data-row-index="${index}"]`);
        const viewBtn = row?.querySelector('.btn-outline-info') as HTMLElement;
        viewBtn?.click();
      }
    },
    enabled: !showPaymentModal && !loading && paginatedPurchaseOrders.length > 0,
    actionKeys: ['p', 'P', 'd', 'D', 'v', 'V'],
  });

  // Reset keyboard navigation when page changes
  useEffect(() => {
    resetSelection();
    setFocusedRowIndex(-1);
  }, [currentPage, resetSelection]);

  // Page level shortcuts
  usePageShortcuts({
    createNewPath: isSubscriptionPaid !== false ? '/purchase-orders/create' : undefined,
    onSearchFocus: () => {
      const filterInput = document.querySelector('.filter-section input') as HTMLElement;
      if (filterInput) filterInput.focus();
    }
  });

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
            buttonIcon="bi-plus-lg"
            buttonDisabled={isSubscriptionPaid === false}
          />
          <div className="container">
            <SubscriptionWarning />
            <div className="filter-section">
              <PurchaseFilter vendors={vendors} filters={filters} setFilters={setFilters} />
            </div>

            <KeyboardShortcutsIndicator />

            <PurchaseOrderTable
              purchaseOrders={paginatedPurchaseOrders}
              loading={loading}
              error={error}
              onDelete={deleteModal.handleDelete}
              vendors={vendors}
              onAddPayment={handleOpenPayment}
              focusedRowIndex={focusedRowIndex}
              setFocusedRowIndex={setFocusedRowIndex}
              setSelectedIndex={setSelectedIndex}
              containerRef={tableContainerRef}
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
                  "Are you sure you want to delete this purchase order? This action cannot be undone."
                )}
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={deleteModal.cancelDelete}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={deleteModal.confirmDelete} disabled={!!deleteModal.errorMessage || isSubscriptionPaid === false}>
                  Delete
                </Button>
              </Modal.Footer>
            </Modal>

            <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)} size="lg" centered>
              <Modal.Header closeButton>
                <Modal.Title>Add Payment</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                {selectedPoId && (
                  <AddPaymentForm
                    poId={selectedPoId}
                    onSuccess={() => {
                      setShowPaymentModal(false);
                      // Refresh the purchase orders list
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

    // Desktop view - Report view with PurchaseReportTable
    return (
      <>
        <PageHeader
          title={title}
          buttonVariant="primary"
          buttonLabel="Create New"
          buttonLink="/purchase-orders/create"
          buttonIcon="bi-plus-lg"
          buttonDisabled={isSubscriptionPaid === false}
        />
        <div className="container">
          <SubscriptionWarning />
          <div className="filter-section">
            <PurchaseFilter vendors={vendors} filters={filters} setFilters={setFilters} />
          </div>

          <KeyboardShortcutsIndicator />

          <PurchaseReportTable
            purchaseOrders={paginatedPurchaseOrders}
            loading={loading}
            error={error}
            vendors={vendors}
            filters={filters}
            onAddPayment={handleOpenPayment}
            onDelete={deleteModal.handleDelete}
            focusedRowIndex={focusedRowIndex}
            setFocusedRowIndex={setFocusedRowIndex}
            setSelectedIndex={setSelectedIndex}
            containerRef={tableContainerRef}
            pagination={{
              currentPage,
              totalPages,
              setCurrentPage
            }}
          />
        </div>

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
            <Button variant="danger" onClick={deleteModal.confirmDelete} disabled={!!deleteModal.errorMessage || isSubscriptionPaid === false}>
              Delete
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title>Add Payment</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedPoId && (
              <AddPaymentForm
                poId={selectedPoId}
                onSuccess={() => {
                  setShowPaymentModal(false);
                  // Refresh the purchase orders list
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

export default PurchaseResponsive;