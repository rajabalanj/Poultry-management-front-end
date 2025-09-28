// src/components/SalesOrder/SalesOrderDetails.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import PageHeader from "../Layout/PageHeader";
import { salesOrderApi, inventoryItemApi, businessPartnerApi } from "../../services/api"; // Add businessPartnerApi
import { SalesOrderResponse, SalesOrderStatus, PaymentStatus } from "../../types/SalesOrder";
import { BusinessPartner } from "../../types/BusinessPartner";
import { InventoryItemResponse } from "../../types/InventoryItem"; // Add InventoryItemResponse
import { format } from 'date-fns';

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

const SalesOrderDetails: React.FC = () => {
  const { so_id } = useParams<{ so_id: string }>();
  const navigate = useNavigate();
  const [salesOrder, setSalesOrder] = useState<SalesOrderResponse | null>(null);
  const [customers, setCustomers] = useState<BusinessPartner[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItemResponse[]>([]); // Add inventoryItems state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSalesOrder = async () => {
      try {
        if (!so_id) {
          setError("Sales Order ID is missing.");
          setLoading(false);
          return;
        }
        const [soData, customersData, inventoryItemsData] = await Promise.all([
          salesOrderApi.getSalesOrder(Number(so_id)),
          businessPartnerApi.getCustomers(),
          inventoryItemApi.getInventoryItems(), // Fetch inventory items
        ]);
        setSalesOrder(soData);
        setCustomers(customersData);
        setInventoryItems(inventoryItemsData);
      } catch (err: any) {
        console.error("Error fetching sales order:", err);
        setError(err?.message || "Failed to load sales order details.");
        toast.error(err?.message || "Failed to load sales order details.");
      } finally {
        setLoading(false);
      }
    };

    fetchSalesOrder();
  }, [so_id]);

  // Map customer_id to customer name
  const getCustomerName = (customerId: number) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.name || 'N/A';
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

  if (loading) return <div className="text-center mt-5">Loading sales order details...</div>;
  if (error) return <div className="text-center text-danger mt-5">{error}</div>;
  if (!salesOrder) return <div className="text-center mt-5">Sales order not found or data is missing.</div>;

  return (
    <>
      <PageHeader title={`Sales Details: ${salesOrder.so_number}`} buttonVariant="secondary" buttonLabel="Back to List" buttonLink="/sales-orders" />
      <div className="container mt-4">
        <div className="card shadow-sm mb-4">
          <div className="card-header bg-primary text-white">
            <h4 className="mb-0">Sales Order Information</h4>
          </div>
          <div className="card-body">
            <div className="row mb-3">
              <div className="col-md-6">
                <strong>Sales ID:</strong> {salesOrder.so_number}
              </div>
              <div className="col-md-6">
                <strong>Customer:</strong> {getCustomerName(salesOrder.customer_id)}
              </div>
              <div className="col-md-6">
                <strong>Date:</strong> {format(new Date(salesOrder.order_date), 'MMM dd, yyyy')}
              </div>
              
              <div className="col-md-6">
                <strong>Status:</strong> <span className={`badge ${getStatusBadgeClass(salesOrder.status)}`}>{salesOrder.status}</span>
              </div>
              <div className="col-md-6">
                <strong>Total Amount:</strong> Rs. {(Number(salesOrder.total_amount) || 0).toFixed(2)}
              </div>
              <div className="col-md-6">
                <strong>Amount Received:</strong> Rs. {(Number(salesOrder.total_amount_paid) || 0).toFixed(2)}
              </div>
              <div className="col-12">
                <strong>Notes:</strong> {salesOrder.notes || 'N/A'}
              </div>
              {salesOrder.payment_receipt && (
                <div className="col-12">
                  <strong>Payment Receipt:</strong> {salesOrder.payment_receipt}
                </div>
              )}
              <div className="col-md-6">
                <strong>Created At:</strong> {new Date(salesOrder.created_at).toLocaleString()}
              </div>
              {salesOrder.updated_at && (
                <div className="col-md-6">
                  <strong>Last Updated:</strong> {new Date(salesOrder.updated_at).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sales Order Items */}
        <div className="card shadow-sm mb-4">
          <div className="card-header bg-info text-white">
            <h5 className="mb-0">Ordered Items</h5>
          </div>
          <div className="card-body p-0">
            {salesOrder.items && salesOrder.items.length > 0 ? (
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
                    {salesOrder.items.map((item, index) => (
                      <tr key={item.id || index}>
                        <td>{index + 1}</td>
                        <td>{getItemName(item.inventory_item_id)}</td>
                        <td>{item.quantity}</td>
                        <td>{getItemUnit(item.inventory_item_id)}</td>
                        <td>{(Number(item.price_per_unit) || 0).toFixed(2)}</td>
                        <td>{(Number(item.line_total) || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={5} className="text-end fw-bold">Total Sales Value:</td>
                      <td className="fw-bold">Rs. {(Number(salesOrder.total_amount) || 0).toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <p className="p-3">No items found for this sales order.</p>
            )}
          </div>
        </div>

        {/* Payments Section */}
        <div className="card shadow-sm mb-4">
          <div className="card-header bg-success text-white">
            <h5 className="mb-0">Payments</h5>
          </div>
          <div className="card-body p-0">
            {salesOrder.payments && salesOrder.payments.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-striped table-hover mb-0">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Amount Received (Rs.)</th>
                      <th>Payment Date</th>
                      <th>Mode</th>
                      <th>Reference</th>
                      <th>Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesOrder.payments.map((payment, index) => (
                      <tr key={payment.id || index}>
                        <td>{index + 1}</td>
                        <td>{(Number(payment.amount_paid) || 0).toFixed(2)}</td>
                        <td>{format(new Date(payment.payment_date), 'MMM dd, yyyy')}</td>
                        <td>{payment.payment_mode || 'N/A'}</td>
                        <td>{payment.reference_number || 'N/A'}</td>
                        <td>{payment.payment_receipt || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={1} className="text-end fw-bold">Total Received:</td>
                      <td className="fw-bold">Rs. {(Number(salesOrder.total_amount_paid) || 0).toFixed(2)}</td>
                      <td colSpan={4}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <p className="p-3">No payments recorded for this sales order yet.</p>
            )}
            <div className="card-footer text-end">
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => navigate(`/sales-orders/${so_id}/add-payment`)}
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
            onClick={() => navigate('/sales-orders')}
          >
            Back to List
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate(`/sales-orders/${salesOrder.id}/edit`)}
          >
            Edit Sales Order
          </button>
        </div>
      </div>
    </>
  );
};

export default SalesOrderDetails;