// src/Components/Reports/SalesReportsTable.tsx
import React from 'react';
import { SalesOrderResponse } from '../../types/SalesOrder';
import { BusinessPartner } from '../../types/BusinessPartner';
import { useNavigate } from 'react-router-dom';

interface SalesReportTableProps {
  salesOrders: SalesOrderResponse[];
  customers: BusinessPartner[];
  loading: boolean;
  error: string | null;
}

const SalesReportTable: React.FC<SalesReportTableProps> = ({ salesOrders, customers, loading, error }) => {
  const navigate = useNavigate();

  const handleViewDetails = (id: number) => {
    if (!id) {
      console.error("Sales Order ID is required");
      return;
    }
    navigate(`/sales-orders/${id}/details`);
  };

  if (loading) return <div className="text-center">Loading Sales Orders...</div>;
  if (error) return <div className="text-center text-danger">{error}</div>;
  if (salesOrders.length === 0) return <div className="text-center">No Sales Orders found</div>;

  return (
    <div className="table-responsive">
      <table className="table table-striped table-hover">
        <thead className="thead-dark">
          <tr>
            <th>SO Number</th>
            <th>Customer</th>
            <th>Order Date</th>
            <th>Total Amount</th>
            <th>Amount Paid</th>
            <th>Status</th>
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
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default SalesReportTable;
