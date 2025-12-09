// src/Components/Reports/SalesReportsTable.tsx
import React, { useRef, useState, useCallback } from 'react';
import { SalesOrderResponse } from '../../types/SalesOrder';
import { SalesOrderItemResponse } from '../../types/SalesOrderItem';
import { BusinessPartner } from '../../types/BusinessPartner';
import { useNavigate } from 'react-router-dom';
import { toPng } from 'html-to-image';
import { Button } from 'react-bootstrap';
import { toast } from 'react-toastify';
import ItemsModal from '../Common/ItemsModal';

interface SalesReportTableProps {
  salesOrders: SalesOrderResponse[];
  customers: BusinessPartner[];
  loading: boolean;
  error: string | null;
}

const SalesReportTable: React.FC<SalesReportTableProps> = ({ salesOrders, customers, loading, error }) => {
  const navigate = useNavigate();
  const tableRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [showItemsModal, setShowItemsModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState<SalesOrderItemResponse[]>([]);
  const [selectedSOId, setSelectedSOId] = useState<string | null>(null);

  const handleViewDetails = (id: number) => {
    if (!id) {
      console.error("Sales Order ID is required");
      return;
    }
    navigate(`/sales-orders/${id}/details`);
  };

  const handleViewItems = useCallback((items: SalesOrderItemResponse[] | undefined, so_number: string) => {
    setSelectedItems(items || []);
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

  if (loading) return <div className="text-center">Loading Sales Orders...</div>;
  if (error) return <div className="text-center text-danger">{error}</div>;
  if (salesOrders.length === 0) return <div className="text-center">No Sales Orders found</div>;

  return (
    <>
      <div className="mb-3 d-flex justify-content-end">
        <Button variant="secondary" onClick={handleShareAsImage} disabled={isSharing}>
          {isSharing ? 'Generating...' : 'Share as Image'}
        </Button>
      </div>
      <div className="table-responsive" ref={tableRef}>
        <table className="table table-striped table-hover">
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
                <tr key={so.id} onClick={() => handleViewDetails(so.id)} style={{ cursor: 'pointer' }}>
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
                <Button 
                  variant="outline-info" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewItems(so.items, so.so_number);
                  }}
                >
                  View Items
                </Button>
              </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <ItemsModal
        show={showItemsModal}
        onHide={() => setShowItemsModal(false)}
        items={selectedItems}
        title={`Items for SO: ${selectedSOId}`}
      />
    </>
  );
};

export default SalesReportTable;
