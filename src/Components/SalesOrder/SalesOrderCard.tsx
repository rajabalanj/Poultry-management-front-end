// src/components/SalesOrder/SalesOrderCard.tsx
import React from "react";
import { SalesOrderResponse, SalesOrderStatus, PaymentStatus } from "../../types/SalesOrder";
import { SalesOrderItemResponse } from "../../types/SalesOrderItem";
import { BusinessPartner } from "../../types/BusinessPartner";

interface SalesOrderCardProps {
  so: SalesOrderResponse;
  customers: BusinessPartner[];
  onView: (id: number) => void;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  onAddPayment?: (id: number) => void;
  onViewItems: (items: SalesOrderItemResponse[], so_number: string) => void;
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
  ({ so, customers, onView, onEdit, onDelete, onAddPayment, onViewItems }) => {
    
    const customerName = customers.find(c => c.id === so.customer_id)?.name || 'N/A';

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
            onClick={() => onView(so.id)}
          >
            <div className="card-body p-2">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-1">Sales: {so.so_number}</h6>
                  <div className="text-sm">
                    <p className="mb-0">Customer: {customerName}</p>
                    <p className="mb-0">Total Amount: {so.total_amount_str}</p>
                    <p className="mb-0">Amount Received: {so.total_amount_paid_str}</p>
                    <p className="mb-0">Status: <span className={`badge ${getStatusBadgeClass(so.status)}`}>{so.status}</span></p>
                  </div>
                </div>
                <div className="d-flex align-items-center">
                    <button className="btn btn-sm btn-outline-info me-2" onClick={(e) => handleActionClick(e, onViewItems, so.items, so.so_number)}>
                        <i className="bi bi-list-ul"></i>
                    </button>
                    {showActions && (
                    <>
                        {onEdit && (
                        <button className="btn btn-sm btn-outline-primary me-2" onClick={(e) => handleActionClick(e, onEdit, so.id)}>
                            <i className="bi bi-pencil-fill"></i>
                        </button>
                        )}
                        {onDelete && (
                        <button className="btn btn-sm btn-outline-danger me-2" onClick={(e) => handleActionClick(e, onDelete, so.id)}>
                            <i className="bi bi-trash-fill"></i>
                        </button>
                        )}
                        {onAddPayment && (
                        <button className="btn btn-sm btn-outline-success" onClick={(e) => handleActionClick(e, onAddPayment, so.id)}>
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

export default SalesOrderCard;