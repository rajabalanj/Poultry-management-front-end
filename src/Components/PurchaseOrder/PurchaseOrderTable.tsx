// src/components/PurchaseOrder/PurchaseOrderTable.tsx
import React, { useCallback, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PurchaseOrderResponse } from "../../types/PurchaseOrder";
import { BusinessPartner } from "../../types/BusinessPartner";
import PurchaseOrderCard from "./PurchaseOrderCard";
import { toPng } from 'html-to-image';
import { Button } from 'react-bootstrap';
import { toast } from 'react-toastify';

interface PurchaseOrderTableProps {
  purchaseOrders: PurchaseOrderResponse[];
  loading: boolean;
  error: string | null;
  onDelete?: (id: number) => void;
  vendors: BusinessPartner[];
  onAddPayment?: (id: number) => void;
}

const PurchaseOrderTable: React.FC<PurchaseOrderTableProps> = ({ purchaseOrders, loading, error, onDelete, vendors, onAddPayment }) => {
  const navigate = useNavigate();
  const tableRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);

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
    return purchaseOrders.map((Purchase) => (
      <PurchaseOrderCard
        key={Purchase.id}
        Purchase={Purchase}
        vendors={vendors}
        onView={handleViewDetails}
        onEdit={handleEdit}
        onDelete={onDelete}
        onAddPayment={onAddPayment}
      />
    ));
  }, [purchaseOrders, vendors, handleViewDetails, handleEdit, onDelete, onAddPayment]); // Add vendors to dependencies

  if (loading) return <div className="text-center">Loading Purchase...</div>;
  if (error) return <div className="text-center text-danger">{error}</div>;
  if (purchaseOrders.length === 0) return <div className="text-center">No Purchase found</div>;

  return (
    <>
      <div className="mb-3 d-flex justify-content-end">
        <Button variant="secondary" onClick={handleShareAsImage} disabled={isSharing}>
          {isSharing ? 'Generating...' : 'Share as Image'}
        </Button>
      </div>
      <div className="px-2">{poCards}</div>
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
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
                    <td>{po.total_amount.toFixed(2)}</td>
                    <td>{po.total_amount_paid.toFixed(2)}</td>
                    <td><span className={`badge ${
                  po.status === 'Draft' ? 'bg-warning' :
                  po.status === 'Partially Paid' ? 'bg-info' :
                  po.status === 'Paid' ? 'bg-success' :
                  'bg-secondary'
                }`}>{po.status}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default PurchaseOrderTable;