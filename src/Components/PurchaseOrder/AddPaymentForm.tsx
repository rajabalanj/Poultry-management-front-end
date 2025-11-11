// src/components/PurchaseOrder/AddPaymentForm.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import PageHeader from '../Layout/PageHeader';
import DatePicker from 'react-datepicker';
import { format } from 'date-fns'; // Import format
import { purchaseOrderApi, s3Upload } from '../../services/api';
import { PaymentCreate, PurchaseOrderResponse } from '../../types/PurchaseOrder';

const paymentModes = ["Cash", "Bank Transfer", "Cheque", "Online Payment", "Other"];

const AddPaymentForm: React.FC = () => {
  const { po_id } = useParams<{ po_id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrderResponse | null>(null);
  const [loadingPo, setLoadingPo] = useState(true);
  const [errorPo, setErrorPo] = useState<string | null>(null);

  // Payment form states
  const [amountPaid, setAmountPaid] = useState<number | ''>('');
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [paymentMode, setPaymentMode] = useState<string>('');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  // Fetch the PO details to display context
  useEffect(() => {
    const fetchPoDetails = async () => {
      setLoadingPo(true);
      setErrorPo(null);
      try {
        if (!po_id) {
            setErrorPo("Purchase ID is missing.");
            setLoadingPo(false);
            return;
        }
        const data = await purchaseOrderApi.getPurchaseOrder(Number(po_id));
        setPurchaseOrder(data);
        // Optionally pre-fill amount with remaining balance
        const remainingBalance = data.total_amount - data.total_amount_paid;
        if (remainingBalance > 0) {
            setAmountPaid(parseFloat(remainingBalance.toFixed(2)));
        }

      } catch (err: any) {
        console.error("Error fetching Purchase for payment:", err);
        setErrorPo(err?.message || "Failed to load Purchase details.");
        toast.error(err?.message || "Failed to load Purchase details for payment.");
      } finally {
        setLoadingPo(false);
      }
    };
    fetchPoDetails();
  }, [po_id]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!po_id) {
      toast.error("Purchase ID is missing.");
      setIsLoading(false);
      return;
    }

    if (amountPaid === '' || amountPaid <= 0) {
      toast.error('Please enter a valid amount paid (greater than 0).');
      setIsLoading(false);
      return;
    }

    if (!paymentMode.trim()) {
      toast.error('Please select a payment mode.');
      setIsLoading(false);
      return;
    }

    // Optional: Add validation for overpayment
    if (purchaseOrder && (Number(amountPaid) + purchaseOrder.total_amount_paid) > purchaseOrder.total_amount + 0.01) { // Add small epsilon for floating point
        toast.warn(`Amount entered (${amountPaid.toFixed(2)}) would overpay this Purchase. Total due: Rs. ${(purchaseOrder.total_amount - purchaseOrder.total_amount_paid).toFixed(2)}.`);
        // Allow to proceed or return, depending on business logic. For now, warn and allow.
    }


    const newPayment: PaymentCreate = {
      purchase_order_id: Number(po_id),
      amount_paid: Number(amountPaid),
      payment_date: format(paymentDate, 'yyyy-MM-dd'),
      payment_mode: paymentMode,
      reference_number: referenceNumber || undefined,
      notes: notes || undefined,
    };

    try {
      const paymentResponse = await purchaseOrderApi.addPaymentToPurchaseOrder(newPayment);
      
      // Upload receipt if file is selected
      if (receiptFile && (paymentResponse as any).id) {
        const uploadConfig = await purchaseOrderApi.getPaymentReceiptUploadUrl((paymentResponse as any).id, receiptFile.name);
        await s3Upload(uploadConfig.upload_url, receiptFile);
      }
      
      toast.success('Payment added successfully!');
      navigate(`/purchase-orders/${po_id}/details`); // Go back to Purchase details page
    } catch (error: any) {
      toast.error(error?.message || 'Failed to add payment.');
      console.error('Error adding payment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingPo) return <div className="text-center mt-5">Loading Purchase details for payment...</div>;
  if (errorPo) return <div className="text-center text-danger mt-5">{errorPo}</div>;
  if (!purchaseOrder) return <div className="text-center mt-5">Purchase not found.</div>;


  return (
    <>
      <PageHeader
        title={`Add Payment for Purchase: ${purchaseOrder.po_number}`}
        buttonVariant="secondary"
        buttonLabel="Back to Purchase Details"
        buttonLink={`/purchase-orders/${po_id}/details`}
      />
      <div className="container mt-4">
        <div className="card shadow-sm">
          <div className="card-body">
            <h5 className="mb-3">Payment Details</h5>
            <div className="alert alert-info" role="alert">
                  <strong>Purchase Total:</strong> Rs. {Number(purchaseOrder.total_amount || 0).toFixed(2)} |
                  <strong> Paid So Far:</strong> Rs. {Number(purchaseOrder.total_amount_paid || 0).toFixed(2)} |
                  <strong> Remaining Due:</strong> Rs. {(Number(purchaseOrder.total_amount || 0) - Number(purchaseOrder.total_amount_paid || 0)).toFixed(2)}
            </div>
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label htmlFor="amountPaid" className="form-label">Amount Paid (Rs.) <span className="form-field-required">*</span></label>
                  <input
                    type="number"
                    className="form-control"
                    id="amountPaid"
                    // value={amountPaid}
                    onChange={(e) => setAmountPaid(Number(e.target.value))}
                    min="0.01"
                    step="0.01"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="paymentDate" className="form-label">Payment Date <span className="form-field-required">*</span></label>
                  <div>
                  <DatePicker
                    selected={paymentDate}
                    onChange={(date: Date | null) => date && setPaymentDate(date)}
                    dateFormat="dd-MM-yyyy"
                    className="form-control"
                    id="paymentDate"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    required
                    disabled={isLoading}
                  />
                  </div>
                </div>
                <div className="col-md-6">
                  <label htmlFor="paymentMode" className="form-label">Payment Mode <span className="form-field-required">*</span></label>
                  <select
                    id="paymentMode"
                    className="form-select"
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    required
                    disabled={isLoading}
                  >
                    <option value="">Select Mode</option>
                    {paymentModes.map((mode) => (
                      <option key={mode} value={mode}>{mode}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label htmlFor="referenceNumber" className="form-label">Reference Number (Optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    id="referenceNumber"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder="e.g., Cheque No., Transaction ID"
                    disabled={isLoading}
                  />
                </div>
                <div className="col-12">
                  <label htmlFor="notes" className="form-label">Notes (Optional)</label>
                  <textarea
                    className="form-control"
                    id="notes"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional notes about this payment"
                    disabled={isLoading}
                  ></textarea>
                </div>
                <div className="col-12">
                  <label htmlFor="receiptFile" className="form-label">Payment Receipt (Optional)</label>
                  <input
                    type="file"
                    className="form-control"
                    id="receiptFile"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                    disabled={isLoading}
                  />
                  <div className="form-text">Upload payment receipt (PDF, JPG, PNG)</div>
                </div>

                <div className="col-12 mt-4">
                  <button
                    type="submit"
                    className="btn btn-primary me-2"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Adding Payment...' : 'Add Payment'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => navigate(`/purchase-orders/${po_id}/details`)}
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddPaymentForm;