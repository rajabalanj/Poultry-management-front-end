// src/components/PurchaseOrder/PurchaseOrderCard.tsx
import React from "react";
import { PurchaseOrderResponse, PurchaseOrderStatus, PaymentStatus } from "../../types/PurchaseOrder";
import { BusinessPartner } from "../../types/BusinessPartner";

interface PurchaseOrderCardProps {
  Purchase: PurchaseOrderResponse;
  vendors: BusinessPartner[];
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onAddPayment: (id: number) => void;
}

const getStatusBadgeClass = (status: PurchaseOrderStatus | PaymentStatus) => {
  switch (status) {
    case PurchaseOrderStatus.DRAFT:
    case PaymentStatus.NOT_PAID:
      return "bg-secondary";
    case PurchaseOrderStatus.PARTIALLY_PAID:
    case PaymentStatus.PARTIALLY_PAID:
      return "bg-warning";
    case PurchaseOrderStatus.PAID:
    case PaymentStatus.FULLY_PAID:
      return "bg-success";
    default:
      return "bg-light text-dark";
  }
};

const PurchaseOrderCard: React.FC<PurchaseOrderCardProps> = React.memo(
  ({ Purchase, vendors, onView, onEdit, onDelete, onAddPayment }) => {
    

  // Map vendor_id to business partner name
  const vendorName = vendors.find(v => v.id === Purchase.vendor_id)?.name || 'N/A';

    return (
      <div className="card mb-2 mt-2 border shadow-sm">
        <div className="card-body p-2">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h6 className="mb-1">Purchase ID: {Purchase.id}</h6>
              <div className="text-sm">
                <p className="mb-0">Vendor: {vendorName}</p> {/* Use vendorName */}
                <p className="mb-0">Total Amount: Rs. {(Purchase.total_amount || 0).toFixed(2)}</p>
                <p className="mb-0">Amount Paid: Rs. {(Purchase.total_amount_paid || 0).toFixed(2)}</p>
                <p className="mb-0">Status: <span className={`badge ${getStatusBadgeClass(Purchase.status)}`}>{Purchase.status}</span></p>
                
              </div>
            </div>
            <div className="d-flex flex-column flex-md-row gap-2">
              <button
                className="btn btn-primary btn-sm d-flex align-items-center justify-content-center"
                onClick={() => onView(Purchase.id)}
                title="View Details"
                aria-label={`View Details for Purchase ${Purchase.id}`}
              >
                <i className="bi bi-eye me-1"></i>
                <span className="text-sm">Details</span>
              </button>
              <button
                className="btn btn-success btn-sm d-flex align-items-center justify-content-center"
                onClick={() => onEdit(Purchase.id)}
                title="Edit Purchase"
                aria-label={`Edit Purchase ${Purchase.id}`}
              >
                <i className="bi bi-pencil-square me-1"></i>
                <span className="text-sm">Edit</span>
              </button>
              <button
                className="btn btn-danger btn-sm d-flex align-items-center justify-content-center"
                onClick={() => onDelete(Purchase.id)}
                title="Delete Purchase"
                aria-label={`Delete Purchase ${Purchase.id}`}
              >
                <i className="bi bi-trash me-1"></i>
                <span className="text-sm">Delete</span>
              </button>
              <button
                className="btn btn-primary btn-sm d-flex align-items-center justify-content-center"
                onClick={() => onAddPayment(Purchase.id)}
                title="Add Payment"
                aria-label={`Add Payment for Purchase ${Purchase.id}`}
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

export default PurchaseOrderCard;