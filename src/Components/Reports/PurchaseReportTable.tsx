// src/Components/Reports/PurchaseReportTable.tsx
import React, { useState, useEffect } from 'react';
import { PurchaseOrderResponse } from '../../types/PurchaseOrder';
import { PurchaseOrderItemResponse } from '../../types/PurchaseOrderItem';
import { BusinessPartner } from '../../types/BusinessPartner';
import { useNavigate } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { purchaseOrderApi, inventoryItemApi } from '../../services/api';
import { InventoryItemResponse } from '../../types/InventoryItem';
import { useSubscription } from '../context/SubscriptionContext';
import CustomPagination from '../Common/CustomPagination';
import { usePageShortcuts } from '../../hooks/usePageShortcuts';

interface PurchaseReportTableProps {
  purchaseOrders: PurchaseOrderResponse[];
  vendors: BusinessPartner[];
  loading: boolean;
  error: string | null;
  filters?: Record<string, any>;
  onAddPayment?: (poId: number) => void;
  onDelete?: (id: number) => void;
  pagination?: {
    currentPage: number;
    totalPages: number;
    setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  };
  focusedRowIndex?: number;
  setFocusedRowIndex?: (index: number) => void;
  setSelectedIndex?: (index: number) => void;
}

const PurchaseReportTable: React.FC<PurchaseReportTableProps> = ({ purchaseOrders, vendors, loading, error, pagination, filters = {}, onAddPayment, onDelete, focusedRowIndex, setFocusedRowIndex, setSelectedIndex }) => {
  const navigate = useNavigate();
  const [isSharing, setIsSharing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [expandedRows, setExpandedRows] = useState<number[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItemResponse[]>([]);
  const { isSubscriptionPaid } = useSubscription();

  useEffect(() => {
    const fetchInventoryItems = async () => {
      try {
        const response = await inventoryItemApi.getInventoryItems();
        setInventoryItems(response);
      } catch (error) {
        console.error('Failed to fetch inventory items', error);
        toast.error('Failed to fetch inventory items');
      }
    };
    fetchInventoryItems();
  }, []);

  const getItemName = (itemId: number) => {
    const item = inventoryItems.find(i => i.id === itemId);
    return item?.name || 'N/A';
  };

  const handleViewDetails = (id: number) => {
    if (!id) {
      console.error("Purchase Order ID is required");
      return;
    }
    navigate(`/purchase-orders/${id}/details`);
  };

  const handleShareAsImage = async () => {
    if (!navigator.share) {
      toast.error("Web Share API is not supported in your browser.");
      return;
    }
    setIsSharing(true);
    try {
      const blob = await purchaseOrderApi.exportDetailedReport(filters, 'pdf');
      const file = new File([blob], `purchase-report.pdf`, { type: 'application/pdf' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        // Ensure share is called directly from user gesture
        try {
          await navigator.share({ title: 'Purchase Report', text: 'Detailed Purchase Report', files: [file] });
          toast.success('Report shared successfully!');
        } catch (shareError: any) {
          if (shareError.name !== 'AbortError') {
            throw shareError;
          }
        }
      } else {
        toast.error('Sharing files is not supported on this device.');
      }
    } catch (error: any) {
      console.error('Sharing failed', error);
      toast.error(`Failed to share report: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSharing(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await purchaseOrderApi.exportDetailedReport(filters, 'excel');
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = 'purchase_report.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);
      toast.success('Purchase report exported successfully!');
    } catch (error: any) {
      console.error('Export failed', error);
      toast.error(`Failed to export report: ${error.message || 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  };

  usePageShortcuts({
    onExport: (!isExporting && purchaseOrders.length > 0) ? handleExport : undefined,
    onShare: (!isSharing && purchaseOrders.length > 0) ? handleShareAsImage : undefined
  });

  if (loading) return <div className="text-center">Loading Purchase Orders...</div>;
  if (error) return <div className="text-center text-danger">{error}</div>;
  if (purchaseOrders.length === 0) return <div className="text-center">No Purchase Orders found</div>;

  return (
    <>
      <div className="mb-3 d-flex justify-content-end gap-2">
        <Button variant="success" onClick={handleExport} disabled={isExporting || purchaseOrders.length === 0}>
          {isExporting ? 'Exporting...' : 'Export to Excel'}
        </Button>
        <Button variant="secondary" onClick={handleShareAsImage} disabled={isSharing}>
          {isSharing ? 'Generating...' : 'Share as PDF'}
        </Button>
      </div>
      <div className="table-responsive">
        <table className="table table-striped table-hover">
          <thead className="thead-dark" id="purchase-report-table">
            <tr>
              <th style={{ width: 48 }}></th>
              <th>PO Number</th>
              <th>Vendor</th>
              <th>Order Date</th>
              <th>Total Amount</th>
              <th>Amount Paid</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {purchaseOrders.map((po, index) => {
              const vendorName = vendors.find(v => v.id === po.vendor_id)?.name || 'N/A';
              const isExpanded = expandedRows.includes(po.id);
              const isFocused = focusedRowIndex === index;
              return (
                <React.Fragment key={po.id}>
                  <tr
                    onClick={() => {
                      handleViewDetails(po.id);
                      if (setFocusedRowIndex) setFocusedRowIndex(index);
                      if (setSelectedIndex) setSelectedIndex(index);
                    }}
                    data-row-index={index}
                    className={isFocused ? 'table-primary' : ''}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedRows(prev => prev.includes(po.id) ? prev.filter(id => id !== po.id) : [...prev, po.id]);
                        }}
                      >
                        {isExpanded ? '▾' : '▸'}
                      </Button>
                    </td>
                    <td>{po.po_number}</td>
                    <td>{vendorName}</td>
                    <td>{new Date(po.order_date).toLocaleDateString()}</td>
                    <td>{po.total_amount_str}</td>
                    <td>{po.total_amount_paid_str}</td>
                    <td><span className={`badge ${
                  po.status === 'Draft' ? 'bg-warning' :
                  po.status === 'Partially Paid' ? 'bg-info' :
                  po.status === 'Paid' ? 'bg-success' :
                  'bg-secondary'
                }`}>{po.status}</span></td>
                    <td>
                      <Button 
                        variant="outline-info" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedRows(prev => prev.includes(po.id) ? prev.filter(id => id !== po.id) : [...prev, po.id]);
                        }}
                      >
                        View Items
                      </Button>
                      {onAddPayment && (
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="ms-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddPayment(po.id);
                          }}
                        >
                          Add Payment
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          variant="outline-danger"
                          size="sm"
                          className="ms-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(po.id);
                          }}
                          disabled={isSubscriptionPaid === false}
                        >
                          Delete
                        </Button>
                      )}
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={8}>
                        <div className="p-2">
                          <div className="table-responsive">
                          <table className="table mb-0">
                            <thead>
                              <tr>
                                <th>Item Name</th>
                                <th>Qty</th>
                                <th>Unit Price</th>
                                <th>Line Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Array.isArray(po.items) && po.items.length > 0 ? po.items.map((it: PurchaseOrderItemResponse) => (
                                <tr key={it.id}>
                                  <td>{getItemName(it.inventory_item_id)}</td>
                                  <td>{it.quantity}</td>
                                  <td>{it.price_per_unit_str}</td>
                                  <td>{it.line_total_str}</td>
                                </tr>
                              )) : (
                                <tr>
                                  <td colSpan={4} className="text-center">No items</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      {pagination && (
        <CustomPagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={pagination.setCurrentPage}
        />
      )}
    </>
  );
};

export default PurchaseReportTable;
