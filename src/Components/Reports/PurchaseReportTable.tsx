// src/Components/Reports/PurchaseReportTable.tsx
import React, { useRef, useState, useCallback } from 'react';
import { PurchaseOrderResponse } from '../../types/PurchaseOrder';
import { PurchaseOrderItemResponse } from '../../types/PurchaseOrderItem';
import { BusinessPartner } from '../../types/BusinessPartner';
import { useNavigate } from 'react-router-dom';
import { toPng } from 'html-to-image';
import { Button } from 'react-bootstrap';
import { toast } from 'react-toastify';
import ItemsModal from '../Common/ItemsModal';

interface PurchaseReportTableProps {
  purchaseOrders: PurchaseOrderResponse[];
  vendors: BusinessPartner[];
  loading: boolean;
  error: string | null;
}

const PurchaseReportTable: React.FC<PurchaseReportTableProps> = ({ purchaseOrders, vendors, loading, error }) => {
  const navigate = useNavigate();
  const tableRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [showItemsModal, setShowItemsModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState<PurchaseOrderItemResponse[]>([]);
  const [selectedPOId, setSelectedPOId] = useState<string | null>(null);

  const handleViewDetails = (id: number) => {
    if (!id) {
      console.error("Purchase ID is required");
      return;
    }
    navigate(`/purchase-orders/${id}/details`);
  };

  const handleViewItems = useCallback((items: PurchaseOrderItemResponse[] | undefined, po_number: string) => {
    setSelectedItems(items || []);
    setSelectedPOId(po_number);
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
      const file = new File([blob], `purchase-report.png`, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Purchase Report',
          text: `Purchase Report`,
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

  if (loading) return <div className="text-center">Loading Purchase Orders...</div>;
  if (error) return <div className="text-center text-danger">{error}</div>;
  if (purchaseOrders.length === 0) return <div className="text-center">No Purchase Orders found</div>;

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
                <tr key={po.id} onClick={() => handleViewDetails(po.id)} style={{ cursor: 'pointer' }}>
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
                    handleViewItems(po.items, po.po_number);
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
        title={`Items for PO: ${selectedPOId}`}
      />
    </>
  );
};

export default PurchaseReportTable;
