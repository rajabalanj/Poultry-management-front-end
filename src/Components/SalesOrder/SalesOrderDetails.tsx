// src/components/SalesOrder/SalesOrderDetails.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import PageHeader from "../Layout/PageHeader";
import CustomDatePicker from '../Common/CustomDatePicker';
import { SalesOrderResponse, SalesOrderStatus, PaymentStatus, PaymentResponse, PaymentUpdate } from "../../types/SalesOrder";
import { BusinessPartner } from "../../types/BusinessPartner";
import { InventoryItemResponse } from "../../types/InventoryItem"; // Add InventoryItemResponse
import { format } from 'date-fns';
import { Modal, Button, Form } from 'react-bootstrap';
import { salesOrderApi, inventoryItemApi, businessPartnerApi } from "../../services/api"; // Add businessPartnerApiimport DatePicker from 'react-datepicker';

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
  
  // State for payment modals
  const [showEditPaymentModal, setShowEditPaymentModal] = useState(false);
  const [showDeletePaymentModal, setShowDeletePaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentResponse | null>(null);
  const [editPaymentForm, setEditPaymentForm] = useState<PaymentUpdate>({
    amount_paid: 0,
    payment_date: '',
    payment_mode: '',
    reference_number: '',
    notes: '',
  });

  const fetchSalesOrderDetails = async () => {
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
  };

  useEffect(() => {
    fetchSalesOrderDetails();
  }, [so_id]);

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

  const handleEditPayment = (payment: PaymentResponse) => {
    setSelectedPayment(payment);
    setEditPaymentForm({
      amount_paid: payment.amount_paid,
      payment_date: format(new Date(payment.payment_date), 'yyyy-MM-dd'),
      payment_mode: payment.payment_mode,
      reference_number: payment.reference_number || '',
      notes: payment.notes || '',
    });
    setShowEditPaymentModal(true);
  };

  const handleDeletePayment = (payment: PaymentResponse) => {
    setSelectedPayment(payment);
    setShowDeletePaymentModal(true);
  };

  const confirmDeletePayment = async () => {
    if (selectedPayment) {
      try {
        await salesOrderApi.deleteSalesPayment(selectedPayment.id);
        toast.success("Payment deleted successfully!");
        setShowDeletePaymentModal(false);
        fetchSalesOrderDetails(); // Refresh data
      } catch (err: any) {
        toast.error(err?.message || "Failed to delete payment.");
      }
    }
  };

  const handleUpdatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPayment) {
      try {
        // Assuming the API requires all fields from PaymentUpdate
        const updatePayload: PaymentUpdate = {
          amount_paid: editPaymentForm.amount_paid,
          payment_date: editPaymentForm.payment_date,
          payment_mode: editPaymentForm.payment_mode,
          reference_number: editPaymentForm.reference_number,
          notes: editPaymentForm.notes,
        };
        await salesOrderApi.updateSalesPayment(selectedPayment.id, updatePayload);
        toast.success("Payment updated successfully!");
        setShowEditPaymentModal(false);
        fetchSalesOrderDetails(); // Refresh data
      } catch (err: any) {
        toast.error(err?.message || "Failed to update payment.");
      }
    }
  };

  const handleDownloadReceipt = async () => {
    try {
      if (salesOrder?.id) {
        console.log(`Attempting to download sales order receipt for SO ID: ${salesOrder.id}`);
        await salesOrderApi.downloadSalesOrderReceipt(salesOrder.id);
        toast.success("Receipt opened in a new tab!");
      } else {
        console.warn('Sales Order ID is not available to download receipt.');
        toast.error('Sales Order ID is not available to download receipt.');
      }
    } catch (error: any) {
      console.error(`Error downloading sales order receipt for SO ID ${salesOrder?.id}:`, error);
      toast.error(error.message || "Failed to download receipt.");
    }
  };

  const handleDownloadPaymentReceipt = async (paymentId: number) => {
    try {
      await salesOrderApi.downloadSalesPaymentReceipt(paymentId);
      toast.success("Payment receipt downloaded successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to download payment receipt.");
    }
  };

  if (loading) return <div className="text-center mt-5">Loading sales order details...</div>;
  if (error) return <div className="text-center text-danger mt-5">{error}</div>;
  if (!salesOrder) return <div className="text-center mt-5">Sales order not found or data is missing.</div>;

  return (
    <>
      <PageHeader title={`Sales Details: ${salesOrder.so_number}`} buttonVariant="secondary" buttonLabel="Back to List" buttonLink="/sales-orders" buttonIcon="bi-arrow-left" />
      <div className="container mt-4">
        <div className="card shadow-sm mb-4">
          <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Sales Order Information</h5>
            <Button
              variant="light"
              size="sm"
              onClick={handleDownloadReceipt}
            >
              <i className="bi bi-download me-1"></i> Download Receipt
            </Button>
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
                <strong>Bill No:</strong> {salesOrder.bill_no || 'N/A'}
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
                      <th>Actions</th>
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
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleDownloadPaymentReceipt(payment.id)}
                          >
                            <i className="bi bi-download"></i>
                          </Button>
                        </td>
                        <td>
                          <Button
                            variant="info" size="sm" className="me-2"
                            onClick={() => handleEditPayment(payment)}
                          >
                            <i className="bi bi-pencil"></i>
                          </Button>
                          <Button
                            variant="danger" size="sm"
                            onClick={() => handleDeletePayment(payment)}
                          >
                            <i className="bi bi-trash"></i>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={1} className="text-end fw-bold">Total Received:</td>
                      <td className="fw-bold">Rs. {(Number(salesOrder.total_amount_paid) || 0).toFixed(2)}</td>
                      <td colSpan={5}></td>
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
            className="btn btn-primary"
            onClick={() => navigate(`/sales-orders/${salesOrder.id}/edit`)}
          >
            <i className="bi bi-pencil-square me-1"></i>
            Edit
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this sales order?')) {
                // Add delete functionality here
                salesOrderApi.deleteSalesOrder(Number(so_id))
                  .then(() => {
                    toast.success('Sales order deleted successfully');
                    navigate('/sales-orders');
                  })
                  .catch(err => {
                    toast.error('Failed to delete sales order: ' + err.message);
                  });
              }
            }}
          >
            <i className="bi bi-trash me-1"></i>
            Delete
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/sales-orders')}
          >
            Back to List
          </button>
        </div>
      </div>

      {/* Edit Payment Modal */}
      <Modal show={showEditPaymentModal} onHide={() => setShowEditPaymentModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Payment</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleUpdatePayment}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Amount Received</Form.Label>
              <Form.Control
                type="number" step="0.01"
                value={editPaymentForm.amount_paid}
                onChange={(e) => setEditPaymentForm({ ...editPaymentForm, amount_paid: Number(e.target.value) })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Payment Date</Form.Label>
              <div>
              <CustomDatePicker
                selected={editPaymentForm.payment_date ? new Date(editPaymentForm.payment_date) : null}
                onChange={(date: Date | null) => date && setEditPaymentForm({ ...editPaymentForm, payment_date: format(date, 'yyyy-MM-dd') })}
                dateFormat="dd-MM-yyyy"
                className="form-control"
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                required
              />
              </div>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Payment Mode</Form.Label>
              <Form.Control
                type="text"
                value={editPaymentForm.payment_mode}
                onChange={(e) => setEditPaymentForm({ ...editPaymentForm, payment_mode: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Reference Number</Form.Label>
              <Form.Control
                type="text"
                value={editPaymentForm.reference_number}
                onChange={(e) => setEditPaymentForm({ ...editPaymentForm, reference_number: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control
                as="textarea" rows={3}
                value={editPaymentForm.notes}
                onChange={(e) => setEditPaymentForm({ ...editPaymentForm, notes: e.target.value })}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditPaymentModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Changes
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Payment Confirmation Modal */}
      <Modal show={showDeletePaymentModal} onHide={() => setShowDeletePaymentModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to delete this payment?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeletePaymentModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={confirmDeletePayment}>Delete</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default SalesOrderDetails;
