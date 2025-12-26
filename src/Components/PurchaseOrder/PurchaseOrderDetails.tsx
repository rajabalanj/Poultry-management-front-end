// src/components/PurchaseOrder/PurchaseOrderDetails.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import PageHeader from "../Layout/PageHeader";
import { purchaseOrderApi, inventoryItemApi, businessPartnerApi } from "../../services/api";
import { PurchaseOrderResponse, PurchaseOrderStatus, PaymentStatus, PaymentResponse, PaymentUpdate } from "../../types/PurchaseOrder";
import { BusinessPartner } from "../../types/BusinessPartner";
import { InventoryItemResponse } from "../../types/InventoryItem";
import { format } from 'date-fns';
import { Modal, Button, Form } from 'react-bootstrap';

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

const PurchaseOrderDetails: React.FC = () => {
  const { po_id } = useParams<{ po_id: string }>();
  const navigate = useNavigate();
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrderResponse | null>(null);
  const [businessPartners, setBusinessPartners] = useState<BusinessPartner[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItemResponse[]>([]);
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

  const fetchPurchaseOrderDetails = async () => {
    try {
      if (!po_id) {
        setError("Purchase ID is missing.");
        setLoading(false);
        return;
      }
      const [poData, partnersData, inventoryItemsData] = await Promise.all([
        purchaseOrderApi.getPurchaseOrder(Number(po_id)),
        businessPartnerApi.getVendors(),
        inventoryItemApi.getInventoryItems(),
      ]);
      setPurchaseOrder(poData);
      setBusinessPartners(partnersData);
      setInventoryItems(inventoryItemsData);
    } catch (err: any) {
      console.error("Error fetching Purchase:", err);
      setError(err?.message || "Failed to load Purchase details.");
      toast.error(err?.message || "Failed to load Purchase details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchaseOrderDetails();
  }, [po_id]);

  const getVendorName = (vendorId: number) => {
    const partner = businessPartners.find(bp => bp.id === vendorId);
    return partner?.name || 'N/A';
  };

  const getItemName = (itemId: number) => {
    const item = inventoryItems.find(i => i.id === itemId);
    return item?.name || 'N/A';
  };

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
        await purchaseOrderApi.deletePayment(selectedPayment.id);
        toast.success("Payment deleted successfully!");
        setShowDeletePaymentModal(false);
        fetchPurchaseOrderDetails(); // Refresh data
      } catch (err: any) {
        toast.error(err?.message || "Failed to delete payment.");
      }
    }
  };

  const handleUpdatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPayment) {
      try {
        await purchaseOrderApi.updatePayment(selectedPayment.id, editPaymentForm);
        toast.success("Payment updated successfully!");
        setShowEditPaymentModal(false);
        fetchPurchaseOrderDetails(); // Refresh data
      } catch (err: any) {
        toast.error(err?.message || "Failed to update payment.");
      }
    }
  };

  const handleDownloadReceipt = async () => {
    // If the backend returned a direct receipt URL/path with the PurchaseOrder,
    // prefer opening that URL directly (it's often an S3 url). Fallback to
    // the download endpoint only when a direct URL isn't available.
    try {
      const receiptPath = purchaseOrder?.payment_receipt;
      if (receiptPath) {
        // If it looks like an absolute URL, open it in a new tab.
        if (/^https?:\/\//i.test(receiptPath)) {
          window.open(receiptPath, '_blank');
          toast.success('Receipt opened in a new tab');
          return;
        }

        // If it's not an absolute URL but is a path (e.g. s3 key), try to use
        // the API download endpoint as a fallback.
      }

      if (purchaseOrder?.id) {
        await purchaseOrderApi.downloadPurchaseOrderReceipt(purchaseOrder.id);
        toast.success('Receipt downloaded successfully!');
        return;
      }

      toast.error('No receipt available to download');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to download receipt.');
    }
  };

  const handleDownloadPaymentReceipt = async (paymentId: number) => {
    try {
      await purchaseOrderApi.downloadPaymentReceipt(paymentId);
      toast.success("Payment receipt downloaded successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to download payment receipt.");
    }
  };

  if (loading) return <div className="text-center mt-5">Loading Purchase details...</div>;
  if (error) return <div className="text-center text-danger mt-5">{error}</div>;
  if (!purchaseOrder) return <div className="text-center mt-5">Purchase not found or data is missing.</div>;

  return (
    <>
      <PageHeader title={`Purchase Details: ${purchaseOrder.po_number}`} buttonVariant="secondary" buttonLabel="Back" buttonIcon="bi-arrow-left"/>
      <div className="container mt-4">
        <div className="card shadow-sm mb-4">
          <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Purchase Information</h5>
            {purchaseOrder.payment_receipt && (
              <Button
                variant="light"
                size="sm"
                onClick={handleDownloadReceipt}
              >
                <i className="bi bi-download me-1"></i> Download Receipt
              </Button>
            )}
          </div>
          <div className="card-body">
            <div className="row mb-3">
              <div className="col-md-6">
                <strong>Purchase ID:</strong> {purchaseOrder.po_number}
              </div>
              <div className="col-md-6">
                <strong>Vendor:</strong> {getVendorName(purchaseOrder.vendor_id)}
              </div>
              <div className="col-md-6">
                <strong>Date:</strong> {format(new Date(purchaseOrder.order_date), 'MMM dd, yyyy')}
              </div>
              <div className="col-md-6">
                <strong>Bill No:</strong> {purchaseOrder.bill_no || 'N/A'}
              </div>
              <div className="col-md-6">
                <strong>Status:</strong> <span className={`badge ${getStatusBadgeClass(purchaseOrder.status)}`}>{purchaseOrder.status}</span>
              </div>
              <div className="col-md-6">
                <strong>Total Amount:</strong> Rs. {(Number(purchaseOrder.total_amount) || 0).toFixed(2)}
              </div>
              <div className="col-md-6">
                <strong>Amount Paid:</strong> Rs. {(Number(purchaseOrder.total_amount_paid) || 0).toFixed(2)}
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

        {/* Purchase Items */}
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
                      <td colSpan={5} className="text-end fw-bold">Total Purchase Value:</td>
                      <td className="fw-bold">Rs. {(Number(purchaseOrder.total_amount) || 0).toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <p className="p-3">No items found for this Purchase.</p>
            )}
          </div>
        </div>

        {/* Payments Section */}
        <div className="card shadow-sm mb-4">
          <div className="card-header bg-success text-white">
            <h5 className="mb-0">Payments</h5>
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
                      <th>Receipt</th>
                      <th>Actions</th>
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
                        <td>
                          {payment.payment_receipt ? (
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => handleDownloadPaymentReceipt(payment.id)}
                            >
                              <i className="bi bi-download"></i>
                            </Button>
                          ) : (
                            'N/A'
                          )}
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
                      <td colSpan={1} className="text-end fw-bold">Total Paid:</td>
                      <td className="fw-bold">Rs. {(Number(purchaseOrder.total_amount_paid) || 0).toFixed(2)}</td>
                      <td colSpan={5}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <p className="p-3">No payments recorded for this Purchase yet.</p>
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
            className="btn btn-primary"
            onClick={() => navigate(`/purchase-orders/${purchaseOrder.id}/edit`)}
          >
            <i className="bi bi-pencil-square me-1"></i>
            Edit
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this purchase order?')) {
                // Add delete functionality here
                purchaseOrderApi.deletePurchaseOrder(Number(po_id))
                  .then(() => {
                    toast.success('Purchase order deleted successfully');
                    navigate('/purchase-orders');
                  })
                  .catch(err => {
                    toast.error('Failed to delete purchase order: ' + err.message);
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
            onClick={() => navigate(-1)}
          >
            Back
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
              <Form.Label>Amount Paid</Form.Label>
              <Form.Control
                type="number" step="0.01"
                value={editPaymentForm.amount_paid}
                onChange={(e) => setEditPaymentForm({ ...editPaymentForm, amount_paid: Number(e.target.value) })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Payment Date</Form.Label>
              <Form.Control
                type="date"
                value={editPaymentForm.payment_date}
                onChange={(e) => setEditPaymentForm({ ...editPaymentForm, payment_date: e.target.value })}
                required
              />
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
        <Modal.Body>
          Are you sure you want to delete this payment?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeletePaymentModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDeletePayment}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default PurchaseOrderDetails;