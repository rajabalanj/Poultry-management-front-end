// src/Components/Reports/PurchaseReportTable.tsx
import React from 'react';
import { PurchaseOrderResponse } from '../../types/PurchaseOrder';
import { BusinessPartner } from '../../types/BusinessPartner';
import { useNavigate } from 'react-router-dom';

interface PurchaseReportTableProps {
  purchaseOrders: PurchaseOrderResponse[];
  vendors: BusinessPartner[];
  loading: boolean;
  error: string | null;
}

const PurchaseReportTable: React.FC<PurchaseReportTableProps> = ({ purchaseOrders, vendors, loading, error }) => {
  const navigate = useNavigate();

  const handleViewDetails = (id: number) => {
    if (!id) {
      console.error("Purchase ID is required");
      return;
    }
    navigate(`/purchase-orders/${id}/details`);
  };

  if (loading) return <div className="text-center">Loading Purchase Orders...</div>;
  if (error) return <div className="text-center text-danger">{error}</div>;
  if (purchaseOrders.length === 0) return <div className="text-center">No Purchase Orders found</div>;

  return (
    <div className="table-responsive">
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
              <tr key={po.id} onClick={() => handleViewDetails(po.id)} style={{ cursor: 'pointer' }}>
                <td>{po.po_number}</td>
                <td>{vendorName}</td>
                <td>{new Date(po.order_date).toLocaleDateString()}</td>
                <td>{po.total_amount.toFixed(2)}</td>
                <td>{po.total_amount_paid.toFixed(2)}</td>
                <td><span className={`badge bg-secondary`}>{po.status}</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default PurchaseReportTable;
