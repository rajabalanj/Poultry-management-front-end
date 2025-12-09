// src/components/PurchaseOrder/PurchaseOrderCard.tsx
import React from "react";
import { PurchaseOrderResponse, PurchaseOrderStatus, PaymentStatus } from "../../types/PurchaseOrder";
import { PurchaseOrderItemResponse } from "../../types/PurchaseOrderItem";
import { BusinessPartner } from "../../types/BusinessPartner";

interface PurchaseOrderCardProps {
  Purchase: PurchaseOrderResponse;
  vendors: BusinessPartner[];
  onView: (id: number) => void;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  onAddPayment?: (id: number) => void;
  onViewItems: (items: PurchaseOrderItemResponse[], po_number: string) => void;
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
  ({ Purchase, vendors, onView, onEdit, onDelete, onAddPayment, onViewItems }) => {
    
    const vendorName = vendors.find(v => v.id === Purchase.vendor_id)?.name || 'N/A';

    // Stop event propagation for buttons
    const handleActionClick = (e: React.MouseEvent, action: ((...args: any[]) => void) | undefined, ...args: any[]) => {
      e.stopPropagation();
      if (action) {
        action(...args);
      }
    };

    const showActions = onEdit || onDelete || onAddPayment;

    return (
      <div 
        className="card mb-2 mt-2 border-top-0 border-end-0 border-start-0 border-bottom"
        style={{ cursor: 'pointer', borderRadius: 0 }}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        onClick={() => onView(Purchase.id)}
      >
        <div className="card-body p-2">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h6 className="mb-1">Purchase: {Purchase.po_number}</h6>
              <div className="text-sm">
                <p className="mb-0">Vendor: {vendorName}</p>
                <p className="mb-0">Total Amount: Rs. {(Purchase.total_amount || 0).toFixed(2)}</p>
                <p className="mb-0">Amount Paid: Rs. {(Purchase.total_amount_paid || 0).toFixed(2)}</p>
                <p className="mb-0">Status: <span className={`badge ${getStatusBadgeClass(Purchase.status)}`}>{Purchase.status}</span></p>
              </div>
            </div>
            <div className="d-flex align-items-center">
              <button className="btn btn-sm btn-outline-info me-2" onClick={(e) => handleActionClick(e, onViewItems, Purchase.items, Purchase.po_number)}>
                  <i className="bi bi-list-ul"></i>
              </button>
              {showActions && (
                <>
                  {onEdit && (
                    <button className="btn btn-sm btn-outline-primary me-2" onClick={(e) => handleActionClick(e, onEdit, Purchase.id)}>
                      <i className="bi bi-pencil-fill"></i>
                    </button>
                  )}
                  {onDelete && (
                    <button className="btn btn-sm btn-outline-danger me-2" onClick={(e) => handleActionClick(e, onDelete, Purchase.id)}>
                      <i className="bi bi-trash-fill"></i>
                    </button>
                  )}
                  {onAddPayment && (
                    <button className="btn btn-sm btn-outline-success" onClick={(e) => handleActionClick(e, onAddPayment, Purchase.id)}>
                      <i className="bi bi-credit-card-fill"></i>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default PurchaseOrderCard;