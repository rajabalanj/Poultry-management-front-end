// src/components/PurchaseOrder/PurchaseOrderTable.tsx
import React, { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PurchaseOrderResponse } from "../../types/PurchaseOrder";
import { PurchaseOrderItemResponse } from "../../types/PurchaseOrderItem";
import { BusinessPartner } from "../../types/BusinessPartner";
import PurchaseOrderCard from "./PurchaseOrderCard";
import { Button, Pagination} from 'react-bootstrap';
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
  focusedRowIndex?: number;
  setFocusedRowIndex?: (index: number) => void;
  setSelectedIndex?: (index: number) => void;
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

  const renderPaginationItems = () => {
    if (!pagination) return null;
    const { currentPage, totalPages, setCurrentPage } = pagination;
    const items = [];

    items.push(
      <Pagination.Prev
        key="prev"
        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
        disabled={currentPage === 1}
      />
    );

    if (totalPages <= 7) {
      for (let number = 1; number <= totalPages; number++) {
        items.push(
          <Pagination.Item key={number} active={number === currentPage} onClick={() => setCurrentPage(number)}>
            {number}
          </Pagination.Item>
        );
      }
    } else {
      items.push(
        <Pagination.Item key={1} active={1 === currentPage} onClick={() => setCurrentPage(1)}>
          1
        </Pagination.Item>
      );

      if (currentPage > 4) items.push(<Pagination.Ellipsis key="start-ellipsis" disabled />);

      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 4) {
        endPage = 5;
        startPage = 2;
      } else if (currentPage >= totalPages - 3) {
        startPage = totalPages - 4;
        endPage = totalPages - 1;
      }

      for (let number = startPage; number <= endPage; number++) {
        items.push(
          <Pagination.Item key={number} active={number === currentPage} onClick={() => setCurrentPage(number)}>
            {number}
          </Pagination.Item>
        );
      }

      if (currentPage < totalPages - 3) items.push(<Pagination.Ellipsis key="end-ellipsis" disabled />);

      items.push(
        <Pagination.Item key={totalPages} active={totalPages === currentPage} onClick={() => setCurrentPage(totalPages)}>
          {totalPages}
        </Pagination.Item>
      );
    }

    items.push(
      <Pagination.Next
        key="next"
        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
        disabled={currentPage === totalPages}
      />
    );

    return items;
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
    // The purchaseOrders prop is already filtered and paginated by the parent component.
    return purchaseOrders.map((Purchase) => (
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
  }, [purchaseOrders, vendors, handleViewDetails, handleEdit, onDelete, onAddPayment, handleViewItems]);

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
        <Pagination className="justify-content-center mt-3">
            {renderPaginationItems()}
        </Pagination>
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