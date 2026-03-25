// src/components/SalesOrder/SalesOrderTable.tsx
import React, { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SalesOrderResponse } from "../../types/SalesOrder";
import { SalesOrderItemResponse } from "../../types/SalesOrderItem";
import { BusinessPartner } from "../../types/BusinessPartner";
import SalesOrderCard from "../SalesOrder/SalesOrderCard";
import { Button, Pagination } from 'react-bootstrap';
import { toast } from 'react-toastify';
import ItemsModal from '../Common/ItemsModal';
import { inventoryItemApi, salesOrderApi } from "../../services/api";
import { InventoryItemResponse } from "../../types/InventoryItem";

interface SalesOrderTableProps {
  salesOrders: SalesOrderResponse[];
  loading: boolean;
  error: string | null;
  onDelete?: (id: number) => void;
  customers: BusinessPartner[];
  onAddPayment?: (id: number) => void;
  filters?: Record<string, any>;
  pagination?: {
    currentPage: number;
    totalPages: number;
    setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  };
}

const SalesOrderTable: React.FC<SalesOrderTableProps> = ({ salesOrders, loading, error, onDelete, customers, onAddPayment, pagination, filters = {} }) => {
  const navigate = useNavigate();
  const tableRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

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
      const blob = await salesOrderApi.exportDetailedReport(filters, 'pdf');
      const file = new File([blob], `sales-report.pdf`, { type: 'application/pdf' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ title: 'Sales Report', text: 'Detailed Sales Report', files: [file] });
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
      const blob = await salesOrderApi.exportDetailedReport(filters, 'excel');
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = 'sales_report.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);
      toast.success('Sales report exported successfully!');
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
    // The salesOrders prop is already filtered and paginated by the parent component.
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

  return (
    <>
      <div className="mb-3 d-flex justify-content-end gap-2">
        <Button variant="success" onClick={handleExport} disabled={isExporting || salesOrders.length === 0}>
          {isExporting ? 'Exporting...' : 'Export to Excel'}
        </Button>
        <Button variant="secondary" onClick={handleShareAsImage} disabled={isSharing}>
          {isSharing ? 'Generating...' : 'Share as PDF'}
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
                    <td>{so.total_amount_str}</td>
                    <td>{so.total_amount_paid_str}</td>
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
        <Pagination className="justify-content-center mt-3">
            {renderPaginationItems()}
        </Pagination>
      )}
      <ItemsModal
        show={showItemsModal}
        onHide={() => setShowItemsModal(false)}
        items={selectedItems}
        title={`Items for SO: ${selectedSOId}`}
        getItemName={getItemName}
      />
    </>
  );
};

export default SalesOrderTable;