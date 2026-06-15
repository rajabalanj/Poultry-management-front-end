// src/Components/Sales/SalesResponsive.tsx
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useMediaQuery } from 'react-responsive';
import { useLocation } from 'react-router-dom';
import PageHeader from '../Layout/PageHeader';
import { Modal, Button, Form } from 'react-bootstrap';
import { SalesOrderStatus } from '../../types/SalesOrder';
import { useSalesOrders } from '../../hooks/useSalesOrders';
import { salesOrderApi } from '../../services/api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import SalesOrderTable from '../SalesOrder/SalesOrderTable';
import { useSubscription } from '../context/SubscriptionContext';
import SalesReportTable from '../Reports/SalesReportsTable';
import SalesFilter from './SalesFilter'; // New filter component
import AddSalesPaymentForm from '../SalesOrder/AddSalesPaymentForm';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { useTableKeyboardNavigation } from '../../hooks/useTableKeyboardNavigation';
import SubscriptionWarning from '../Common/SubscriptionWarning'; // adjust path as needed
import KeyboardShortcutsIndicator from '../Common/KeyboardShortcutsIndicator';
import { usePageShortcuts } from '../../hooks/usePageShortcuts';
import { useModalScope } from '../../hooks/useModalScope';

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
  const [billType, setBillType] = useState<'paid' | 'unpaid' | 'none'>('unpaid');

  // Keyboard navigation state
  const [focusedRowIndex, setFocusedRowIndex] = useState<number>(-1);
  const tableContainerRef = useRef<HTMLDivElement>(null);

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
  const { isSubscriptionPaid } = useSubscription();

  const handleDownloadBill = async (status: 'paid' | 'unpaid' | 'none') => {
    if (!filters.customerId) {
      toast.error("Please select a customer first.");
      return;
    }
    if (!filters.startDate || !filters.endDate) {
      toast.error("Please select both start and end dates.");
      return;
    }
    setDownloadingBill(true);
    try {
      const apiStatus = status === 'none' ? undefined : status;
      const startDateStr = format(filters.startDate, 'yyyy-MM-dd');
      const endDateStr = format(filters.endDate, 'yyyy-MM-dd');
      const blob = await salesOrderApi.getCustomerBill(parseInt(filters.customerId), startDateStr, endDateStr, apiStatus as any);
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

  // Push 'modal' scope to temporarily disable page/table shortcuts while modals are open
  useModalScope(showPaymentModal || deleteModal.show, 'modal');

  // Keyboard navigation for table rows
  const { resetSelection, setSelectedIndex } = useTableKeyboardNavigation({
    rowCount: paginatedSalesOrders.length,
    containerRef: tableContainerRef,
    onRowSelect: (index) => {
      setFocusedRowIndex(index);
    },
    onRowEnter: (index) => {
      const order = paginatedSalesOrders[index];
      if (order) {
        window.location.href = `/sales-orders/${order.id}/details`;
      }
    },
    onRowAction: (index, key) => {
      const order = paginatedSalesOrders[index];
      if (!order) return;
      const k = key.toLowerCase();
      if (k === 'p') {
        setSelectedSoId(order.id);
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
    enabled: !showPaymentModal && !loading && paginatedSalesOrders.length > 0,
    actionKeys: ['p', 'P', 'd', 'D', 'v', 'V'],
  });

  // Reset keyboard navigation when page changes
  useEffect(() => {
    resetSelection();
    setFocusedRowIndex(-1);
  }, [currentPage, resetSelection]);

  // Page level shortcuts
  usePageShortcuts({
    createNewPath: isSubscriptionPaid !== false ? '/sales-orders/create' : undefined,
    onSearchFocus: () => {
      const filterInput = document.querySelector('.filter-section input') as HTMLElement;
      if (filterInput) filterInput.focus();
    },
    onDownloadBill: (filters.customerId && !downloadingBill) ? () => handleDownloadBill(billType) : undefined
  });

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
            buttonDisabled={isSubscriptionPaid === false}
          />
          <div className="container">
            <SubscriptionWarning />

            <div className="filter-section">
              <SalesFilter customers={customers} filters={filters} setFilters={setFilters} />
            </div>

            {filters.customerId && (
              <div className="d-flex justify-content-end align-items-center gap-2 mb-3">
                <Form.Select
                  size="sm"
                  className="w-auto"
                  value={billType}
                  onChange={(e) => setBillType(e.target.value as any)}
                >
                  <option value="unpaid">Unpaid Bills</option>
                  <option value="paid">Paid Bills</option>
                  <option value="none">All</option>
                </Form.Select>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => handleDownloadBill(billType)}
                  disabled={downloadingBill}
                >
                  <i className="bi bi-file-earmark-pdf me-2"></i>{downloadingBill ? '...' : 'Download Bill'}
                </Button>
              </div>
            )}

            <KeyboardShortcutsIndicator hasPayment hasDelete hasViewItems hasSearch hasNew hasBill={!!filters.customerId} />

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
                  "Are you sure you want to delete this sales order? This action cannot be undone."
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
          buttonDisabled={isSubscriptionPaid === false}
        />
        <div className="container">
          <SubscriptionWarning />
          <div className="filter-section">
            <SalesFilter customers={customers} filters={filters} setFilters={setFilters} />
          </div>

          {filters.customerId && (
            <div className="d-flex justify-content-end align-items-center gap-2 mb-3">
              <Form.Select
                size="sm"
                className="w-auto"
                value={billType}
                onChange={(e) => setBillType(e.target.value as any)}
              >
                <option value="unpaid">Unpaid Bills</option>
                <option value="paid">Paid Bills</option>
                <option value="none">All</option>
              </Form.Select>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => handleDownloadBill(billType)}
                disabled={downloadingBill}
              >
                <i className="bi bi-file-earmark-pdf me-2"></i>{downloadingBill ? '...' : 'Download Bill'}
              </Button>
            </div>
          )}

          <KeyboardShortcutsIndicator hasPayment hasDelete hasViewItems hasSearch hasNew hasBill={!!filters.customerId} hasExport hasShare />

          <SalesReportTable
            salesOrders={paginatedSalesOrders}
            loading={loading}
            error={error}
            customers={customers}
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
              "Are you sure you want to delete this sales order? This action cannot be undone."
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