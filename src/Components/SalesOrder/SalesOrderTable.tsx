// src/components/SalesOrder/SalesOrderTable.tsx
import React, { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SalesOrderResponse } from "../../types/SalesOrder";
import { SalesOrderItemResponse } from "../../types/SalesOrderItem";
import { BusinessPartner } from "../../types/BusinessPartner";
import SalesOrderCard from "../SalesOrder/SalesOrderCard";
import { toPng } from 'html-to-image';
import { Button } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { exportTableToExcel } from '../../utility/export-utils';
import ItemsModal from '../Common/ItemsModal';
import { inventoryItemApi } from "../../services/api";
import { InventoryItemResponse } from "../../types/InventoryItem";

interface SalesOrderTableProps {
  salesOrders: SalesOrderResponse[];
  loading: boolean;
  error: string | null;
  onDelete?: (id: number) => void;
  customers: BusinessPartner[];
  onAddPayment?: (id: number) => void;
  pagination?: {
    currentPage: number;
    totalPages: number;
    setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  };
}

const SalesOrderTable: React.FC<SalesOrderTableProps> = ({ salesOrders, loading, error, onDelete, customers, onAddPayment, pagination }) => {
  const navigate = useNavigate();
  const tableRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);

  const [showItemsModal, setShowItemsModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState<SalesOrderItemResponse[]>([]);
  const [selectedSOId, setSelectedSOId] = useState<string | null>(null);
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

  const handleViewItems = useCallback((items: SalesOrderItemResponse[], so_number: string) => {
    setSelectedItems(items);
    setSelectedSOId(so_number);
    setShowItemsModal(true);
  }, []);


  const handleShareAsImage = async () => {
    if (!tableRef.current) {
      toast.error("Table element not found.");
      return;
    }

    if (!navigator.share) {
      toast.error("Web Share API is not supported in your browser.");
      return;
    }

    const tableNode = tableRef.current;
    setIsSharing(true);

    const originalTableStyle = {
      width: tableNode.style.width,
      minWidth: tableNode.style.minWidth,
      whiteSpace: tableNode.style.whiteSpace,
    };

    try {
      tableNode.style.width = 'auto';
      tableNode.style.minWidth = '1200px'; 
      tableNode.style.whiteSpace = 'nowrap';

      const dataUrl = await toPng(tableNode, {
        backgroundColor: '#ffffff',
      });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `sales-report.png`, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Sales Report',
          text: `Sales Report`,
          files: [file],
        });
        toast.success("Report shared successfully!");
      } else {
        toast.error("Sharing files is not supported on this device.");
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Sharing failed', error);
        toast.error(`Failed to share report: ${error.message}`);
      }
    } finally {
      tableNode.style.width = originalTableStyle.width;
      tableNode.style.minWidth = originalTableStyle.minWidth;
      tableNode.style.whiteSpace = originalTableStyle.whiteSpace;
      setIsSharing(false);
    }
  };


  const handleViewDetails = useCallback(
    (id: number) => {
      if (!id) {
        console.error("Sales Order ID is required");
        return;
      }
      navigate(`/sales-orders/${id}/details`);
    },
    [navigate]
  );

  const handleEdit = useCallback(
    (id: number) => {
      if (!id) {
        console.error("Sales Order ID is required");
        return;
      }
      navigate(`/sales-orders/${id}/edit`);
    },
    [navigate]
  );

  const soCards = useMemo(() => {
    return salesOrders.map((so) => (
      <SalesOrderCard
        key={so.id}
        so={so}
        customers={customers}
        onView={handleViewDetails}
        onEdit={handleEdit}
        onDelete={onDelete}
        onAddPayment={onAddPayment}
        onViewItems={handleViewItems}
      />
    ));
  }, [salesOrders, customers, handleViewDetails, handleEdit, onDelete, onAddPayment, handleViewItems]);

  if (loading) return <div className="text-center">Loading sales...</div>;
  if (error) return <div className="text-center text-danger">{error}</div>;
  if (salesOrders.length === 0) return <div className="text-center">No sales found</div>;

  const handleExport = () => {
    exportTableToExcel('sales-order-table', 'sales_orders', 'Sales Orders');
  };

  return (
    <>
      <div className="mb-3 d-flex justify-content-end gap-2">
        <Button variant="success" onClick={handleExport} disabled={salesOrders.length === 0}>
          Export to Excel
        </Button>
        <Button variant="secondary" onClick={handleShareAsImage} disabled={isSharing}>
          {isSharing ? 'Generating...' : 'Share as Image'}
        </Button>
      </div>
      <div className="px-2">{soCards}</div>
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <div className="table-responsive" ref={tableRef}>
          <table className="table table-striped table-hover" id="sales-order-table">
            <thead className="thead-dark">
              <tr>
                <th>SO Number</th>
                <th>Customer</th>
                <th>Order Date</th>
                <th>Total Amount</th>
                <th>Amount Paid</th>
                <th>Status</th>
                <th>Items</th>
              </tr>
            </thead>
            <tbody>
              {salesOrders.map((so) => {
                const customerName = customers.find(c => c.id === so.customer_id)?.name || 'N/A';
                return (
                  <tr key={so.id}>
                    <td>{so.so_number}</td>
                    <td>{customerName}</td>
                    <td>{new Date(so.order_date).toLocaleDateString()}</td>
                    <td>{so.total_amount.toFixed(2)}</td>
                    <td>{so.total_amount_paid.toFixed(2)}</td>
                    <td><span className={`badge ${
                  so.status === 'Draft' ? 'bg-warning' :
                  so.status === 'Approved' ? 'bg-primary' :
                  so.status === 'Partially Paid' ? 'bg-info' :
                  so.status === 'Paid' ? 'bg-success' :
                  so.status === 'Cancelled' ? 'bg-danger' :
                  'bg-secondary'
                }`}>{so.status}</span></td>
                <td>
                    {so.items?.map(item => getItemName(item.inventory_item_id)).join(', ') || 'N/A'}
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
        title={`Items for SO: ${selectedSOId}`}
      />
    </>
  );
};

export default SalesOrderTable;