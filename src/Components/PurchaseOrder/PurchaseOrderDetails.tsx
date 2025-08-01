// src/components/PurchaseOrder/PurchaseOrderDetails.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import PageHeader from "../Layout/PageHeader";
import { purchaseOrderApi, vendorApi, inventoryItemApi } from "../../services/api"; // Add inventoryItemApi
import { PurchaseOrderResponse, PurchaseOrderStatus, PaymentStatus } from "../../types/PurchaseOrder";
import { VendorResponse } from "../../types/Vendor";
import { InventoryItemResponse } from "../../types/InventoryItem"; // Add InventoryItemResponse
import { format } from 'date-fns';

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

const PurchaseOrderDetails: React.FC = () => {
  const { po_id } = useParams<{ po_id: string }>();
  const navigate = useNavigate();
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrderResponse | null>(null);
  const [vendors, setVendors] = useState<VendorResponse[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItemResponse[]>([]); // Add inventoryItems state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPurchaseOrder = async () => {
      try {
        if (!po_id) {
          setError("Purchase Order ID is missing.");
          setLoading(false);
          return;
        }
        const [poData, vendorsData, inventoryItemsData] = await Promise.all([
          purchaseOrderApi.getPurchaseOrder(Number(po_id)),
          vendorApi.getVendors(),
          inventoryItemApi.getInventoryItems(), // Fetch inventory items
        ]);
        setPurchaseOrder(poData);
        setVendors(vendorsData);
        setInventoryItems(inventoryItemsData);
      } catch (err: any) {
        console.error("Error fetching purchase order:", err);
        setError(err?.message || "Failed to load purchase order details.");
        toast.error(err?.message || "Failed to load purchase order details.");
      } finally {
        setLoading(false);
      }
    };

    fetchPurchaseOrder();
  }, [po_id]);

  // Map vendor_id to vendor name
  const getVendorName = (vendorId: number) => {
    const vendor = vendors.find(v => v.id === vendorId);
    return vendor?.name || 'N/A';
  };

  // Map inventory_item_id to item name
  const getItemName = (itemId: number) => {
    const item = inventoryItems.find(i => i.id === itemId);
    return item?.name || 'N/A';
  };

  // Map inventory_item_id to item unit
  const getItemUnit = (itemId: number) => {
    const item = inventoryItems.find(i => i.id === itemId);
    return item?.unit || 'N/A';
  };

  if (loading) return <div className="text-center mt-5">Loading purchase order details...</div>;
  if (error) return <div className="text-center text-danger mt-5">{error}</div>;
  if (!purchaseOrder) return <div className="text-center mt-5">Purchase order not found or data is missing.</div>;

  return (
    <>
      <PageHeader title={`PO Details: ${purchaseOrder.po_number}`} buttonVariant="secondary" buttonLabel="Back to List" buttonLink="/purchase-orders" />
      <div className="container mt-4">
        <div className="card shadow-sm mb-4">
          <div className="card-header bg-primary text-white">
            <h4 className="mb-0">Purchase Order Information</h4>
          </div>
          <div className="card-body">
            <div className="row mb-3">
              <div className="col-md-6">
                <strong>PO Number:</strong> {purchaseOrder.po_number}
              </div>
              <div className="col-md-6">
                <strong>Vendor:</strong> {getVendorName(purchaseOrder.vendor_id)}
              </div>
              <div className="col-md-6">
                <strong>Order Date:</strong> {format(new Date(purchaseOrder.order_date), 'MMM dd, yyyy')}
              </div>
              <div className="col-md-6">
                <strong>Expected Delivery:</strong> {purchaseOrder.expected_delivery_date ? format(new Date(purchaseOrder.expected_delivery_date), 'MMM dd, yyyy') : 'N/A'}
              </div>
              <div className="col-md-6">
                <strong>Status:</strong> <span className={`badge ${getStatusBadgeClass(purchaseOrder.status)}`}>{purchaseOrder.status}</span>
              </div>
              <div className="col-md-6">
                <strong>Payment Status:</strong> <span className={`badge ${getStatusBadgeClass(purchaseOrder.payment_status)}`}>{purchaseOrder.payment_status}</span>
              </div>
              <div className="col-md-6">
                <strong>Total Amount:</strong> Rs. {(Number(purchaseOrder.total_amount) || 0).toFixed(2)}
              </div>
              <div className="col-md-6">
                <strong>Amount Paid:</strong> Rs. {(Number(purchaseOrder.amount_paid) || 0).toFixed(2)}
              </div>
              <div className="col-12">
                <strong>Notes:</strong> {purchaseOrder.notes || 'N/A'}
              </div>
              <div className="col-md-6">
                <strong>Created At:</strong> {new Date(purchaseOrder.created_at).toLocaleString()}
              </div>
              {purchaseOrder.updated_at && (
                <div className="col-md-6">
                  <strong>Last Updated:</strong> {new Date(purchaseOrder.updated_at).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Purchase Order Items */}
        <div className="card shadow-sm mb-4">
          <div className="card-header bg-info text-white">
            <h5 className="mb-0">Ordered Items</h5>
          </div>
          <div className="card-body p-0">
            {purchaseOrder.items && purchaseOrder.items.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-striped table-hover mb-0">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Item Name</th>
                      <th>Quantity</th>
                      <th>Unit</th>
                      <th>Price/Unit (Rs.)</th>
                      <th>Line Total (Rs.)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchaseOrder.items.map((item, index) => (
                      <tr key={item.id || index}>
                        <td>{index + 1}</td>
                        <td>{getItemName(item.inventory_item_id)}</td> {/* Use getItemName */}
                        <td>{item.quantity}</td>
                        <td>{getItemUnit(item.inventory_item_id)}</td> {/* Use getItemUnit */}
                        <td>{(Number(item.price_per_unit) || 0).toFixed(2)}</td>
                        <td>{(Number(item.line_total) || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={5} className="text-end fw-bold">Total PO Value:</td>
                      <td className="fw-bold">Rs. {(Number(purchaseOrder.total_amount) || 0).toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <p className="p-3">No items found for this purchase order.</p>
            )}
          </div>
        </div>

        {/* Payments Section */}
        <div className="card shadow-sm mb-4">
          <div className="card-header bg-success text-white">
            <h5 className="mb-0">Payments Received</h5>
          </div>
          <div className="card-body p-0">
            {purchaseOrder.payments && purchaseOrder.payments.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-striped table-hover mb-0">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Amount Paid (Rs.)</th>
                      <th>Payment Date</th>
                      <th>Mode</th>
                      <th>Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchaseOrder.payments.map((payment, index) => (
                      <tr key={payment.id || index}>
                        <td>{index + 1}</td>
                        <td>{(Number(payment.amount_paid) || 0).toFixed(2)}</td>
                        <td>{format(new Date(payment.payment_date), 'MMM dd, yyyy')}</td>
                        <td>{payment.payment_mode || 'N/A'}</td>
                        <td>{payment.reference_number || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={1} className="text-end fw-bold">Total Paid:</td>
                      <td className="fw-bold">Rs. {(Number(purchaseOrder.amount_paid) || 0).toFixed(2)}</td>
                      <td colSpan={3}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <p className="p-3">No payments recorded for this purchase order yet.</p>
            )}
            <div className="card-footer text-end">
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => navigate(`/purchase-orders/${po_id}/add-payment`)}
              >
                <i className="bi bi-wallet-fill me-1"></i> Add Payment
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 d-flex justify-content-center gap-3">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/purchase-orders')}
          >
            Back to List
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate(`/purchase-orders/${purchaseOrder.id}/edit`)}
          >
            Edit Purchase Order
          </button>
        </div>
      </div>
    </>
  );
};

export default PurchaseOrderDetails;