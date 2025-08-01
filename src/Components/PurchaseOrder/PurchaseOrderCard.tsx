// src/components/PurchaseOrder/PurchaseOrderCard.tsx
import React from "react";
import { PurchaseOrderResponse, PurchaseOrderStatus, PaymentStatus } from "../../types/PurchaseOrder";
import { VendorResponse } from "../../types/Vendor"; // Import VendorResponse
import { format } from 'date-fns';

interface PurchaseOrderCardProps {
  po: PurchaseOrderResponse;
  vendors: VendorResponse[]; // Add vendors prop
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

const getStatusBadgeClass = (status: PurchaseOrderStatus | PaymentStatus) => {
  switch (status) {
    case PurchaseOrderStatus.DRAFT:
    case PaymentStatus.NOT_PAID:
      return "bg-secondary";
    case PurchaseOrderStatus.APPROVED:
      return "bg-info";
    case PurchaseOrderStatus.PARTIALLY_RECEIVED:
    case PaymentStatus.PARTIALLY_PAID:
      return "bg-warning";
    case PurchaseOrderStatus.RECEIVED:
    case PaymentStatus.FULLY_PAID:
      return "bg-success";
    case PurchaseOrderStatus.CANCELLED:
      return "bg-danger";
    default:
      return "bg-light text-dark";
  }
};

const PurchaseOrderCard: React.FC<PurchaseOrderCardProps> = React.memo(
  ({ po, vendors, onView, onEdit, onDelete }) => {
    const formattedExpectedDeliveryDate = po.expected_delivery_date
      ? format(new Date(po.expected_delivery_date), 'MMM dd, yyyy')
      : 'N/A';

    // Map vendor_id to vendor name
    const vendorName = vendors.find(v => v.id === po.vendor_id)?.name || 'N/A';

    return (
      <div className="card mb-2 mt-2 border shadow-sm">
        <div className="card-body p-2">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h6 className="mb-1">PO Number: {po.po_number}</h6>
              <div className="text-sm">
                <p className="mb-0">Vendor: {vendorName}</p> {/* Use vendorName */}
                <p className="mb-0">Total Amount: Rs. {(po.total_amount || 0).toFixed(2)}</p>
                <p className="mb-0">Amount Paid: Rs. {(po.amount_paid || 0).toFixed(2)}</p>
                <p className="mb-0">Status: <span className={`badge ${getStatusBadgeClass(po.status)}`}>{po.status}</span></p>
                <p className="mb-0">Payment Status: <span className={`badge ${getStatusBadgeClass(po.payment_status)}`}>{po.payment_status}</span></p>
                <p className="mb-0">Expected Delivery: {formattedExpectedDeliveryDate}</p>
              </div>
            </div>
            <div className="d-flex flex-column flex-md-row gap-2">
              <button
                className="btn btn-info btn-sm d-flex align-items-center justify-content-center"
                onClick={() => onView(po.id)}
                title="View Details"
                aria-label={`View Details for PO ${po.po_number}`}
              >
                <i className="bi bi-eye me-1"></i>
                <span className="text-sm">Details</span>
              </button>
              <button
                className="btn btn-success btn-sm d-flex align-items-center justify-content-center"
                onClick={() => onEdit(po.id)}
                title="Edit PO"
                aria-label={`Edit PO ${po.po_number}`}
              >
                <i className="bi bi-pencil-square me-1"></i>
                <span className="text-sm">Edit</span>
              </button>
              <button
                className="btn btn-danger btn-sm d-flex align-items-center justify-content-center"
                onClick={() => onDelete(po.id)}
                title="Delete PO"
                aria-label={`Delete PO ${po.po_number}`}
              >
                <i className="bi bi-trash me-1"></i>
                <span className="text-sm">Delete</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default PurchaseOrderCard;