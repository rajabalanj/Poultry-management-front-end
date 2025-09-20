// src/components/SalesOrder/SalesOrderCard.tsx
import React from "react";
import { SalesOrderResponse, SalesOrderStatus, PaymentStatus } from "../../types/SalesOrder";
import { BusinessPartner } from "../../types/BusinessPartner";

interface SalesOrderCardProps {
  so: SalesOrderResponse;
  customers: BusinessPartner[];
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onAddPayment: (id: number) => void;
}

const getStatusBadgeClass = (status: SalesOrderStatus | PaymentStatus) => {
  switch (status) {
    case SalesOrderStatus.DRAFT:
    case PaymentStatus.NOT_PAID:
      return "bg-secondary";
    case SalesOrderStatus.PARTIALLY_PAID:
    case PaymentStatus.PARTIALLY_PAID:
      return "bg-warning";
    case SalesOrderStatus.PAID:
    case PaymentStatus.FULLY_PAID:
      return "bg-success";
    default:
      return "bg-light text-dark";
  }
};

const SalesOrderCard: React.FC<SalesOrderCardProps> = React.memo(
  ({ so, customers, onView, onEdit, onDelete, onAddPayment }) => {
    

  // Map customer_id to business partner name
  const customerName = customers.find(c => c.id === so.customer_id)?.name || 'N/A';

    return (
      <div className="card mb-2 mt-2 border shadow-sm">
        <div className="card-body p-2">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h6 className="mb-1">Sales ID: {so.id}</h6>
              <div className="text-sm">
                <p className="mb-0">Customer: {customerName}</p> {/* Use customerName */}
                <p className="mb-0">Total Amount: Rs. {(so.total_amount || 0).toFixed(2)}</p>
                <p className="mb-0">Amount Received: Rs. {(so.total_amount_paid || 0).toFixed(2)}</p>
                <p className="mb-0">Status: <span className={`badge ${getStatusBadgeClass(so.status)}`}>{so.status}</span></p>
                
              </div>
            </div>
            <div className="d-flex flex-column flex-md-row gap-2">
              <button
                className="btn btn-primary btn-sm d-flex align-items-center justify-content-center"
                onClick={() => onView(so.id)}
                title="View Details"
                aria-label={`View Details for Sales ${so.id}`}
              >
                <i className="bi bi-eye me-1"></i>
                <span className="text-sm">Details</span>
              </button>
              <button
                className="btn btn-success btn-sm d-flex align-items-center justify-content-center"
                onClick={() => onEdit(so.id)}
                title="Edit Sales"
                aria-label={`Edit Sales ${so.id}`}
              >
                <i className="bi bi-pencil-square me-1"></i>
                <span className="text-sm">Edit</span>
              </button>
              <button
                className="btn btn-danger btn-sm d-flex align-items-center justify-content-center"
                onClick={() => onDelete(so.id)}
                title="Delete Sales"
                aria-label={`Delete Sales ${so.id}`}
              >
                <i className="bi bi-trash me-1"></i>
                <span className="text-sm">Delete</span>
              </button>
              <button
                className="btn btn-primary btn-sm d-flex align-items-center justify-content-center"
                onClick={() => onAddPayment(so.id)}
                title="Add Payment"
                aria-label={`Add Payment for Sales ${so.id}`}
              >
                <i className="bi bi-wallet-fill me-1"></i>
                <span className="text-sm">Add Payment</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default SalesOrderCard;