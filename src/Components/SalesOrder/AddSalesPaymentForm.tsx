// src/components/SalesOrder/AddSalesPaymentForm.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import PageHeader from '../Layout/PageHeader';
import CustomDatePicker from '../Common/CustomDatePicker';
import { salesOrderApi } from '../../services/api';
import { PaymentCreate as SalesPaymentCreate, SalesOrderResponse } from '../../types/SalesOrder';
import { format } from 'date-fns';
import StyledSelect from '../Common/StyledSelect';

const paymentModes = ["Cash", "Bank Transfer", "Cheque", "Online Payment", "Other"];
type OptionType = { value: string; label: string };

const AddSalesPaymentForm: React.FC = () => {
  const { so_id } = useParams<{ so_id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [salesOrder, setSalesOrder] = useState<SalesOrderResponse | null>(null);
  const [loadingSo, setLoadingSo] = useState(true);
  const [errorSo, setErrorSo] = useState<string | null>(null);

  // Payment form states
  const [amountPaid, setAmountPaid] = useState<number | ''>('');
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [paymentMode, setPaymentMode] = useState<string>('');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');


  // Fetch the SO details to display context
  useEffect(() => {
    const fetchSoDetails = async () => {
      setLoadingSo(true);
      setErrorSo(null);
      try {
        if (!so_id) {
            setErrorSo("Sales Order ID is missing.");
            setLoadingSo(false);
            return;
        }
        const data = await salesOrderApi.getSalesOrder(Number(so_id));
        setSalesOrder(data);
        // Optionally pre-fill amount with remaining balance
        const remainingBalance = data.total_amount - data.total_amount_paid;
        if (remainingBalance > 0) {
            setAmountPaid(parseFloat(remainingBalance.toFixed(2)));
        }

      } catch (err: any) {
        console.error("Error fetching Sales for payment:", err);
        setErrorSo(err?.message || "Failed to load Sales Order details.");
        toast.error(err?.message || "Failed to load Sales Order details for payment.");
      } finally {
        setLoadingSo(false);
      }
    };
    fetchSoDetails();
  }, [so_id]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!so_id) {
      toast.error("Sales Order ID is missing.");
      setIsLoading(false);
      return;
    }

    if (amountPaid === '' || amountPaid <= 0) {
      toast.error('Please enter a valid amount received (greater than 0).');
      setIsLoading(false);
      return;
    }

    if (!paymentMode.trim()) {
      toast.error('Please select a payment mode.');
      setIsLoading(false);
      return;
    }

    // Optional: Add validation for overpayment
    if (salesOrder && (Number(amountPaid) + salesOrder.total_amount_paid) > salesOrder.total_amount + 0.01) { // Add small epsilon for floating point
        toast.warn(`Amount entered (${Number(amountPaid).toFixed(2)}) would overpay this Sales. Total due: Rs. ${(salesOrder.total_amount - salesOrder.total_amount_paid).toFixed(2)}.`);
        // Allow to proceed or return, depending on business logic. For now, warn and allow.
    }


    const newPayment: SalesPaymentCreate = {
      sales_order_id: Number(so_id),
      amount_paid: Number(amountPaid),
      payment_date: format(paymentDate, 'yyyy-MM-dd'),
      payment_mode: paymentMode,
      reference_number: referenceNumber || undefined,
      notes: notes || undefined,
    };

    try {
      await salesOrderApi.addPaymentToSalesOrder(newPayment);
      toast.success('Payment added successfully!');
      navigate(`/sales-orders/${so_id}/details`); // Go back to SO details page
    } catch (error: any) {
      toast.error(error?.message || 'Failed to add payment.');
      console.error('Error adding payment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingSo) return <div className="text-center mt-5">Loading Sales Order details for payment...</div>;
  if (errorSo) return <div className="text-center text-danger mt-5">{errorSo}</div>;
  if (!salesOrder) return <div className="text-center mt-5">Sales Order not found.</div>;

  const paymentModeOptions: OptionType[] = paymentModes.map((mode) => ({
    value: mode,
    label: mode,
  }));
  const selectedPaymentModeOption = paymentModeOptions.find(option => option.value === paymentMode);


  return (
    <>
      <PageHeader
        title={`Add Payment for Sales: ${salesOrder.so_number}`}
        buttonVariant="secondary"
        buttonLabel="Back"
        buttonLink={`/sales-orders/${so_id}/details`}
        buttonIcon="bi-arrow-left"
      />
      <div className="container mt-4">
        <div className="card shadow-sm">
          <div className="card-body">
            <h5 className="mb-3">Payment Details</h5>
            <div className="alert alert-info" role="alert">
                  <strong>Sales Total:</strong> Rs. {Number(salesOrder.total_amount || 0).toFixed(2)} |
                  <strong> Received So Far:</strong> Rs. {Number(salesOrder.total_amount_paid || 0).toFixed(2)} |
                  <strong> Remaining Due:</strong> Rs. {(Number(salesOrder.total_amount || 0) - Number(salesOrder.total_amount_paid || 0)).toFixed(2)}
            </div>
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label htmlFor="amountPaid" className="form-label">Amount Received (Rs.) <span className="form-field-required">*</span></label>
                  <input
                    type="number"
                    className="form-control"
                    id="amountPaid"
                    value={amountPaid}
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
                  <CustomDatePicker
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
                  <StyledSelect
                    id="paymentMode"
                    value={selectedPaymentModeOption}
                    onChange={(option, _action) => setPaymentMode(option ? String(option.value) : '')}
                    options={paymentModeOptions}
                    placeholder="Select Mode"
                    isClearable
                    required
                    isDisabled={isLoading}
                  />
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
                    onClick={() => navigate(`/sales-orders/${so_id}/details`)}
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

export default AddSalesPaymentForm;