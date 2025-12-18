// src/Components/Reports/PurchaseReportTable.tsx
import React, { useState } from 'react';
import { PurchaseOrderResponse } from '../../types/PurchaseOrder';
import { PurchaseOrderItemResponse } from '../../types/PurchaseOrderItem';
import { BusinessPartner } from '../../types/BusinessPartner';
import { useNavigate } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { purchaseOrderApi } from '../../services/api';

interface PurchaseReportTableProps {
  purchaseOrders: PurchaseOrderResponse[];
  vendors: BusinessPartner[];
  loading: boolean;
  error: string | null;
  filters?: Record<string, any>;
  pagination?: {
    currentPage: number;
    totalPages: number;
    setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  };
}

const PurchaseReportTable: React.FC<PurchaseReportTableProps> = ({ purchaseOrders, vendors, loading, error, pagination, filters = {} }) => {
  const navigate = useNavigate();
  const [isSharing, setIsSharing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [expandedRows, setExpandedRows] = useState<number[]>([]);

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
            {purchaseOrders.map((po) => {
              const vendorName = vendors.find(v => v.id === po.vendor_id)?.name || 'N/A';
              const isExpanded = expandedRows.includes(po.id);
              return (
                <React.Fragment key={po.id}>
                  <tr onClick={() => handleViewDetails(po.id)} style={{ cursor: 'pointer' }}>
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
                    <td>{po.total_amount.toFixed(2)}</td>
                    <td>{po.total_amount_paid.toFixed(2)}</td>
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
                              {Array.isArray(po.items) && po.items.length > 0 ? po.items.map((it: PurchaseOrderItemResponse) => (
                                <tr key={it.id}>
                                  <td>{it.inventory_item?.name || 'Unknown Item'}</td>
                                  <td>{it.quantity}</td>
                                  <td>{it.price_per_unit?.toFixed ? it.price_per_unit.toFixed(2) : Number(it.price_per_unit).toFixed(2)}</td>
                                  <td>{it.line_total?.toFixed ? it.line_total.toFixed(2) : Number(it.line_total || (it.quantity * it.price_per_unit)).toFixed(2)}</td>
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

export default PurchaseReportTable;
