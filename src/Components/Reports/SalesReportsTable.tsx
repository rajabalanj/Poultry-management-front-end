// src/Components/Reports/SalesReportsTable.tsx
import React, { useState, useEffect } from 'react';
import { SalesOrderResponse } from '../../types/SalesOrder';
import { SalesOrderItemResponse } from '../../types/SalesOrderItem';
import { BusinessPartner } from '../../types/BusinessPartner';
import { useNavigate } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { salesOrderApi, inventoryItemApi } from '../../services/api';
import { InventoryItemResponse } from '../../types/InventoryItem';

interface SalesReportTableProps {
  salesOrders: SalesOrderResponse[];
  customers: BusinessPartner[];
  loading: boolean;
  error: string | null;
  filters?: Record<string, any>;
  pagination?: {
    currentPage: number;
    totalPages: number;
    setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  };
}

const SalesReportTable: React.FC<SalesReportTableProps> = ({ salesOrders, customers, loading, error, pagination, filters = {} }) => {
  const navigate = useNavigate();
  const [isSharing, setIsSharing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [expandedRows, setExpandedRows] = useState<number[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItemResponse[]>([]);

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
      console.error("Sales Order ID is required");
      return;
    }
    navigate(`/sales-orders/${id}/details`);
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

  if (loading) return <div className="text-center">Loading Sales Orders...</div>;
  if (error) return <div className="text-center text-danger">{error}</div>;
  if (salesOrders.length === 0) return <div className="text-center">No Sales Orders found</div>;

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
      <div className="table-responsive">
        <table className="table table-striped table-hover">
          <thead className="thead-dark" id="sales-report-table">
            <tr>
              <th style={{ width: 48 }}></th>
              <th>SO Number</th>
              <th>Customer</th>
              <th>Order Date</th>
              <th>Total Amount</th>
              <th>Amount Paid</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {salesOrders.map((so) => {
              const customerName = customers.find(c => c.id === so.customer_id)?.name || 'N/A';
              const isExpanded = expandedRows.includes(so.id);
              return (
                <React.Fragment key={so.id}>
                  <tr onClick={() => handleViewDetails(so.id)} style={{ cursor: 'pointer' }}>
                    <td>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedRows(prev => prev.includes(so.id) ? prev.filter(id => id !== so.id) : [...prev, so.id]);
                        }}
                      >
                        {isExpanded ? '▾' : '▸'}
                      </Button>
                    </td>
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
                      <Button 
                        variant="outline-info" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Open the expanded items row for this order
                          setExpandedRows(prev => prev.includes(so.id) ? prev.filter(id => id !== so.id) : [...prev, so.id]);
                        }}
                      >
                        View Items
                      </Button>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={8}>
                        <div className="p-2">
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
                              {Array.isArray(so.items) && so.items.length > 0 ? so.items.map((it: SalesOrderItemResponse) => (
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
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
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
      
    </>
  );
};

export default SalesReportTable;
