// src/components/PurchaseOrder/PurchaseOrderTable.tsx
import React, { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PurchaseOrderResponse } from "../../types/PurchaseOrder";
import { PurchaseOrderItemResponse } from "../../types/PurchaseOrderItem";
import { BusinessPartner } from "../../types/BusinessPartner";
import PurchaseOrderCard from "./PurchaseOrderCard";
import { Button } from 'react-bootstrap';
import { toast } from 'react-toastify';
import ItemsModal from '../Common/ItemsModal';
import { inventoryItemApi, purchaseOrderApi } from "../../services/api";
import { InventoryItemResponse } from "../../types/InventoryItem";

interface PurchaseOrderTableProps {
  purchaseOrders: PurchaseOrderResponse[];
  loading: boolean;
  error: string | null;
  onDelete?: (id: number) => void;
  vendors: BusinessPartner[];
  onAddPayment?: (id: number) => void;
  filters?: Record<string, any>;
  pagination?: {
    currentPage: number;
    totalPages: number;
    setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  };
}

const PurchaseOrderTable: React.FC<PurchaseOrderTableProps> = ({ purchaseOrders, loading, error, onDelete, vendors, onAddPayment, pagination, filters = {} }) => {
  const navigate = useNavigate();
  const tableRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [showItemsModal, setShowItemsModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState<PurchaseOrderItemResponse[]>([]);
  const [selectedPOId, setSelectedPOId] = useState<string | null>(null);
  const [inventoryItems, setInventoryItems] = useState<InventoryItemResponse[]>([]);

  useEffect(() => {
    // Pre-fetch inventory items to make modal loading faster
    const fetchInventoryItems = async () => {
      try {
        const items = await inventoryItemApi.getInventoryItems();
        setInventoryItems(items);
      } catch (error) {
        console.error("Failed to pre-fetch inventory items:", error);
      }
    };
    fetchInventoryItems();
  }, []);

  const getItemName = (itemId: number) => {
    const item = inventoryItems.find(i => i.id === itemId);
    return item?.name || 'N/A';
  };

  const handleViewItems = useCallback((items: PurchaseOrderItemResponse[], po_number: string) => {
    setSelectedItems(items);
    setSelectedPOId(po_number);
    setShowItemsModal(true);
  }, []);

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
        await navigator.share({ title: 'Purchase Report', text: 'Detailed Purchase Report', files: [file] });
        toast.success('Report shared successfully!');
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

  const handleViewDetails = useCallback(
    (id: number) => {
      if (!id) {
        console.error("Purchase ID is required");
        return;
      }
      navigate(`/purchase-orders/${id}/details`);
    },
    [navigate]
  );

  const handleEdit = useCallback(
    (id: number) => {
      if (!id) {
        console.error("Purchase ID is required");
        return;
      }
      navigate(`/purchase-orders/${id}/edit`);
    },
    [navigate]
  );

  const poCards = useMemo(() => {
    // Apply filters to purchase orders
    let filteredOrders = [...purchaseOrders];

    if (filters) {
      // Filter by vendor
      if (filters.vendor_id) {
        filteredOrders = filteredOrders.filter(po => po.vendor_id === filters.vendor_id);
      }

      // Filter by status
      if (filters.status) {
        filteredOrders = filteredOrders.filter(po => po.status === filters.status);
      }

      // Filter by date range
      if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        filteredOrders = filteredOrders.filter(po => new Date(po.order_date) >= startDate);
      }

      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        filteredOrders = filteredOrders.filter(po => new Date(po.order_date) <= endDate);
      }

      // Filter by amount range
      if (filters.minAmount) {
        filteredOrders = filteredOrders.filter(po => po.total_amount >= parseFloat(filters.minAmount));
      }

      if (filters.maxAmount) {
        filteredOrders = filteredOrders.filter(po => po.total_amount <= parseFloat(filters.maxAmount));
      }
    }

    return filteredOrders.map((Purchase) => (
      <PurchaseOrderCard
        key={Purchase.id}
        Purchase={Purchase}
        vendors={vendors}
        onView={handleViewDetails}
        onEdit={handleEdit}
        onDelete={onDelete}
        onAddPayment={onAddPayment}
        onViewItems={handleViewItems}
      />
    ));
  }, [purchaseOrders, vendors, handleViewDetails, handleEdit, onDelete, onAddPayment, handleViewItems, filters]);

  if (loading) return <div className="text-center">Loading Purchase...</div>;
  if (error) return <div className="text-center text-danger">{error}</div>;
  if (purchaseOrders.length === 0) return <div className="text-center">No Purchase found</div>;

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
      <div className="px-2">{poCards}</div>
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <div className="table-responsive" ref={tableRef}>
          <table className="table table-striped table-hover" id="purchase-order-table">
            <thead className="thead-dark">
              <tr>
                <th>PO Number</th>
                <th>Vendor</th>
                <th>Order Date</th>
                <th>Total Amount</th>
                <th>Amount Paid</th>
                <th>Status</th>
                <th>Items</th>
              </tr>
            </thead>
            <tbody>
              {purchaseOrders.map((po) => {
                const vendorName = vendors.find(v => v.id === po.vendor_id)?.name || 'N/A';
                return (
                  <tr key={po.id}>
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
                  {po.items?.map(item => getItemName(item.inventory_item_id)).join(', ') || 'N/A'}
                </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {pagination && pagination.totalPages > 1 && (
        <div className="d-flex justify-content-between align-items-center mt-3">
          <button
            className="btn btn-secondary"
            onClick={() => pagination.setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={pagination.currentPage === 1}
          >
            Previous
          </button>
          <span>
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <button
            className="btn btn-secondary"
            onClick={() => pagination.setCurrentPage((prev) => Math.min(prev + 1, pagination.totalPages))}
            disabled={pagination.currentPage === pagination.totalPages}
          >
            Next
          </button>
        </div>
      )}
      <ItemsModal
        show={showItemsModal}
        onHide={() => setShowItemsModal(false)}
        items={selectedItems}
        title={`Items for PO: ${selectedPOId}`}
        getItemName={getItemName}
      />
    </>
  );
};

export default PurchaseOrderTable;