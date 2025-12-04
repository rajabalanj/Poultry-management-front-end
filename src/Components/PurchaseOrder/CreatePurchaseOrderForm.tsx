// src/components/PurchaseOrder/CreatePurchaseOrderForm.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import PageHeader from '../Layout/PageHeader';
import DatePicker from 'react-datepicker';
import { format } from 'date-fns'; // Import format
import { purchaseOrderApi, inventoryItemApi, businessPartnerApi, s3Upload } from '../../services/api';
import CreateBusinessPartnerForm from '../BusinessPartner/CreateBusinessPartnerForm';
import CreateInventoryItemForm from '../InventoryItem/CreateInventoryItemForm';
import {
  PurchaseOrderCreate,
  PurchaseOrderResponse,
} from '../../types/PurchaseOrder';
import { PurchaseOrderItemCreate } from '../../types/PurchaseOrderItem';
import { BusinessPartner } from '../../types/BusinessPartner';
import { InventoryItemResponse } from '../../types/InventoryItem';
import Loading from '../Common/Loading'

interface FormPurchaseOrderItem extends PurchaseOrderItemCreate {
  tempId: number;
  inventory_item_name?: string;
  inventory_item_unit?: string;
  available_stock?: number;
}

const CreatePurchaseOrderForm: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [vendors, setVendors] = useState<BusinessPartner[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItemResponse[]>([]);
  // Modal states
  const [showCreateVendorModal, setShowCreateVendorModal] = useState(false);
  const [showCreateItemModal, setShowCreateItemModal] = useState(false);

  // Purchase states
  const [vendorId, setVendorId] = useState<number | ''>(0);
  
  const [orderDate, setOrderDate] = useState<Date>(new Date()); // ADD THIS STATE: Default to current date
  
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<FormPurchaseOrderItem[]>([]);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  // Step management
  const [formStep, setFormStep] = useState<'createOrder' | 'addPayment'>('createOrder');
  const [newPurchaseOrder, setNewPurchaseOrder] = useState<PurchaseOrderResponse | null>(null);

  // Payment states
  const [amountPaid, setAmountPaid] = useState<number | ''>(0);
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [paymentMode, setPaymentMode] = useState<string>('');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [paymentReceiptFile, setPaymentReceiptFile] = useState<File | null>(null);
  const paymentModes = ["Cash", "Bank Transfer", "Cheque", "Online Payment", "Other"];

  const grandTotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.quantity * item.price_per_unit), 0);
  }, [items]);

  // ... (rest of the useEffect for fetching initial data remains the same)
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const [vendorsData, inventoryItemsData] = await Promise.all([
          businessPartnerApi.getVendors(),
          inventoryItemApi.getInventoryItems(),
        ]);
        setVendors(vendorsData);
        setInventoryItems(inventoryItemsData);

        if (vendorsData.length > 0) {
          setVendorId(vendorsData[0].id);
        }
      } catch (error: any) {
        toast.error(error?.message || 'Failed to load necessary data (Vendors, Inventory Items).');
        console.error('Error fetching initial data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // Manage body class for bootstrap modal behavior
  useEffect(() => {
    if (showCreateVendorModal || showCreateItemModal) document.body.classList.add('modal-open');
    else document.body.classList.remove('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, [showCreateVendorModal, showCreateItemModal]);


  // --- Item Management Functions ---
  const handleAddItem = useCallback(() => {
    const newItem: FormPurchaseOrderItem = {
      tempId: Date.now(),
      inventory_item_id: 0,
      quantity: 1,
      price_per_unit: 0,
    };
    setItems((prevItems) => [...prevItems, newItem]);
  }, []);

  const handleVendorCreatedInline = (vendor: BusinessPartner) => {
    setVendors((prev) => [...prev, vendor]);
    setVendorId(vendor.id);
    setShowCreateVendorModal(false);
    toast.success(`Vendor "${vendor.name}" added.`);
  };

  const handleItemCreatedInline = (item: InventoryItemResponse) => {
    setInventoryItems((prev) => [...prev, item]);
    // If there's at least one item row, set the last added row to this item
    setItems((prev) => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      updated[updated.length - 1] = { ...updated[updated.length - 1], inventory_item_id: item.id, inventory_item_name: item.name, inventory_item_unit: item.unit };
      return updated;
    });
    setShowCreateItemModal(false);
    toast.success(`Item "${item.name}" added.`);
  };

  const handleRemoveItem = useCallback((tempId: number) => {
    setItems((prevItems) => prevItems.filter((item) => item.tempId !== tempId));
  }, []);

  const handleItemChange = useCallback((tempId: number, field: keyof FormPurchaseOrderItem, value: any) => {
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.tempId === tempId) {
          if (field === 'inventory_item_id') {
            const selectedItem = inventoryItems.find(inv => inv.id === Number(value));
            return {
              ...item,
              [field]: Number(value),
              inventory_item_name: selectedItem?.name,
              inventory_item_unit: selectedItem?.unit,
            };
          }
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  }, [inventoryItems]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Basic Validation
    if (!vendorId || items.length === 0) {
      toast.error('Please select a Vendor and add at least one item.');
      setIsLoading(false);
      return;
    }

    // Validate each item
    for (const item of items) {
      if (!item.inventory_item_id || item.quantity <= 0) {
        toast.error('Please ensure all items have a selected Inventory Item and quantity > 0.');
        setIsLoading(false);
        return;
      }
    }

    const newPurchaseOrder: PurchaseOrderCreate = {
      vendor_id: Number(vendorId),
      order_date: format(orderDate, 'yyyy-MM-dd'), // ADD THIS LINE: Format to YYYY-MM-DD
      
      notes: notes || undefined,
      items: items.map(item => ({
        inventory_item_id: item.inventory_item_id,
        quantity: item.quantity,
        price_per_unit: item.price_per_unit || 0,
      })),
    };

    try {
      const poResponse = await purchaseOrderApi.createPurchaseOrder(newPurchaseOrder);
      
      // Upload receipt if file is selected
      if (receiptFile && poResponse.id) {
        const uploadConfig = await purchaseOrderApi.getPurchaseOrderReceiptUploadUrl(poResponse.id, receiptFile.name);
        await s3Upload(uploadConfig.upload_url, receiptFile);
      }
      
      toast.success('Purchase Order created successfully! Now, add a payment.');
      setNewPurchaseOrder(poResponse); // Save the newly created PO
      setFormStep('addPayment'); // Move to the next step

    } catch (error: any) {
      toast.error(error?.message || 'Failed to create purchase order.');
      console.error('Error creating Purchase Order:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!newPurchaseOrder) {
      toast.error("Purchase Order ID is missing.");
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

    const newPayment = {
      purchase_order_id: newPurchaseOrder.id,
      amount_paid: Number(amountPaid),
      payment_date: format(paymentDate, 'yyyy-MM-dd'),
      payment_mode: paymentMode,
      reference_number: referenceNumber || undefined,
      notes: paymentNotes || undefined,
    };

    try {
      const paymentResponse = await purchaseOrderApi.addPaymentToPurchaseOrder(newPayment);
      
      if (paymentReceiptFile && (paymentResponse as any).id) {
        const uploadConfig = await purchaseOrderApi.getPaymentReceiptUploadUrl((paymentResponse as any).id, paymentReceiptFile.name);
        await s3Upload(uploadConfig.upload_url, paymentReceiptFile);
      }
      
      toast.success('Payment added successfully!');
      navigate(`/purchase-orders/${newPurchaseOrder.id}/details`);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to add payment.');
      console.error('Error adding payment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <PageHeader title={formStep === 'createOrder' ? "Create New Purchase" : `Add Payment for PO #${newPurchaseOrder?.id}`} buttonVariant="secondary" buttonLabel="Back" buttonLink="/purchase-orders" buttonIcon='bi-arrow-left'/>
      <div className="container mt-4">
        <div className="card shadow-sm">
          <div className="card-body">
            {formStep === 'createOrder' ? (
              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  {/* Purchase Details Section */}
                  <h5 className="mb-3">Step 1: Purchase Details</h5>
                  <div className="col-md-6">
                    <label htmlFor="vendorSelect" className="form-label">Vendor <span className="form-field-required">*</span></label>
                    <div className="d-flex gap-2 align-items-center">
                      <select
                        id="vendorSelect"
                        className="form-select"
                        value={vendorId}
                        onChange={(e) => setVendorId(Number(e.target.value))}
                        required
                        disabled={isLoading || vendors.length === 0}
                      >
                        <option value="">Select a Vendor</option>
                        {vendors.map((vendor) => (
                          <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => setShowCreateVendorModal(true)}
                        title="Add Vendor"
                      >
                        <i className="bi bi-plus-lg"></i>
                      </button>
                    </div>
                    {vendors.length === 0 && !isLoading && (
                      <div className="text-danger mt-1">No vendors found. Please add a vendor first.</div>
                    )}
                  </div>
                  
                  <div className="col-md-6">
                    <label htmlFor="orderDate" className="form-label">Date <span className="form-field-required">*</span></label>
                    <div>
                    <DatePicker
                      selected={orderDate}
                      onChange={(date: Date | null) => date && setOrderDate(date)}
                      dateFormat="dd-MM-yyyy"
                      className="form-control"
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
                      id="orderDate"
                      disabled={isLoading}
                    />
                    </div>
                  </div>
                  
                  <div className="col-12">
                    <label htmlFor="notes" className="form-label">Notes</label>
                    <textarea
                      className="form-control"
                      id="notes"
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any additional notes for the purchase"
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

                  {/* Purchase Items Section */}
                  <h5 className="mt-4 mb-3">Items <span className="form-field-required">*</span></h5>
                  {items.length === 0 && <p className="col-12 text-muted">No items added yet. Click "Add Item" to start.</p>}
                  {items.map((item, index) => (
                    <div key={item.tempId} className="col-12 border p-3 mb-3 bg-light">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6>Item {index + 1}</h6>
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => handleRemoveItem(item.tempId)}
                          disabled={isLoading}
                        >
                          <i className="bi bi-x-lg"></i> Remove
                        </button>
                      </div>
                      <div className="row g-2">
                        <div className="col-md-6">
                          <label htmlFor={`itemId-${item.tempId}`} className="form-label">Inventory Item <span className="form-field-required">*</span></label>
                          <div className="d-flex gap-2 align-items-center">
                            <select
                              id={`itemId-${item.tempId}`}
                              className="form-select"
                              value={item.inventory_item_id || ''}
                              onChange={(e) => handleItemChange(item.tempId, 'inventory_item_id', e.target.value)}
                              required
                              disabled={isLoading || inventoryItems.length === 0}
                            >
                              <option value="">Select an Item</option>
                              {inventoryItems.map((invItem) => (
                                <option key={invItem.id} value={invItem.id}>
                                  {invItem.name} ({invItem.unit})
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => setShowCreateItemModal(true)}
                              title="Add Item"
                            >
                              <i className="bi bi-plus-lg"></i>
                            </button>
                          </div>
                          {inventoryItems.length === 0 && !isLoading && (
                              <div className="text-danger mt-1">No inventory items found. Please add items first.</div>
                          )}
                        </div>
                        <div className="col-md-3">
                          <label htmlFor={`quantity-${item.tempId}`} className="form-label">Quantity <span className="form-field-required">*</span></label>
                          <input
                            type="number"
                            className="form-control"
                            id={`quantity-${item.tempId}`}
                            value={item.quantity}
                            onChange={(e) => handleItemChange(item.tempId, 'quantity', Number(e.target.value))}
                            min="1"
                            required
                            disabled={isLoading}
                          />
                        </div>
                        <div className="col-md-3">
                          <label htmlFor={`pricePerUnit-${item.tempId}`} className="form-label">Price per Unit</label>
                          <input
                            type="number"
                            className="form-control"
                            id={`pricePerUnit-${item.tempId}`}
                            value={item.price_per_unit}
                            onChange={(e) => handleItemChange(item.tempId, 'price_per_unit', Number(e.target.value))}
                            step="0.01"
                            disabled={isLoading}
                          />
                        </div>

                        <div className="col-md-12">
                          <p className="text-end mb-0">
                            Line Total: <strong>Rs. {(item.quantity * item.price_per_unit).toFixed(2)}</strong>
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {items.length > 0 && (
                    <div className="col-12 text-end">
                      <h5>Grand Total: <strong>Rs. {grandTotal.toFixed(2)}</strong></h5>
                    </div>
                  )}

                  <div className="col-12 text-center">
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm"
                      onClick={handleAddItem}
                      disabled={isLoading}
                    >
                      <i className="bi bi-plus-circle me-1"></i> Add Item
                    </button>
                  </div>

                  <div className="col-12 mt-4">
                    <button
                      type="submit"
                      className="btn btn-primary me-2"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Creating...' : 'Proceed to Add Payment'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => navigate('/purchase-orders')}
                      disabled={isLoading}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <form onSubmit={handlePaymentSubmit}>
                <h5 className="mb-3">Step 2: Add Payment</h5>
                {newPurchaseOrder && (
                  <div className="alert alert-info">
                    <strong>PO Total:</strong> Rs. {Number(newPurchaseOrder.total_amount || 0).toFixed(2)} | 
                    <strong>Paid:</strong> Rs. {Number(newPurchaseOrder.total_amount_paid || 0).toFixed(2)} | 
                    <strong>Due:</strong> Rs. {(Number(newPurchaseOrder.total_amount || 0) - Number(newPurchaseOrder.total_amount_paid || 0)).toFixed(2)}
                  </div>
                )}
                <div className="row g-3">
                  <div className="col-md-6">
                    <label htmlFor="amountPaid" className="form-label">Amount Paid (Rs.) <span className="form-field-required">*</span></label>
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
                    <DatePicker
                      selected={paymentDate}
                      onChange={(date: Date | null) => date && setPaymentDate(date)}
                      dateFormat="dd-MM-yyyy"
                      className="form-control"
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
                      id="paymentDate"
                      required
                      disabled={isLoading}
                    />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="paymentMode" className="form-label">Payment Mode <span className="form-field-required">*</span></label>
                    <select id="paymentMode" className="form-select" value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} required disabled={isLoading}>
                      <option value="">Select Mode</option>
                      {paymentModes.map(mode => <option key={mode} value={mode}>{mode}</option>)}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="referenceNumber" className="form-label">Reference Number</label>
                    <input type="text" className="form-control" id="referenceNumber" value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} disabled={isLoading} />
                  </div>
                  <div className="col-12">
                    <label htmlFor="paymentNotes" className="form-label">Notes</label>
                    <textarea className="form-control" id="paymentNotes" rows={3} value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} disabled={isLoading}></textarea>
                  </div>
                  <div className="col-12">
                    <label htmlFor="paymentReceiptFile" className="form-label">Payment Receipt (Optional)</label>
                    <input type="file" className="form-control" id="paymentReceiptFile" onChange={(e) => setPaymentReceiptFile(e.target.files?.[0] || null)} disabled={isLoading} />
                  </div>
                </div>
                <div className="col-12 mt-4">
                  <button type="submit" className="btn btn-primary me-2" disabled={isLoading}>
                    {isLoading ? 'Saving Payment...' : 'Save Payment'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => navigate(`/purchase-orders/${newPurchaseOrder?.id}/details`)} disabled={isLoading}>
                    Skip & Finish
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
        {/* Create Vendor Modal */}
        {showCreateVendorModal && (
          <>
            <div className="modal fade show" tabIndex={-1} role="dialog" style={{ display: 'block' }} aria-modal="true">
              <div className="modal-dialog modal-lg" role="document">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Create Vendor</h5>
                    <button type="button" className="btn-close" aria-label="Close" onClick={() => setShowCreateVendorModal(false)}></button>
                  </div>
                  <div className="modal-body">
                    {/* lazy import to avoid circular deps */}
                    <React.Suspense fallback={<Loading message="Loading data..." />}>
                      <CreateBusinessPartnerForm hideHeader onCreated={handleVendorCreatedInline} onCancel={() => setShowCreateVendorModal(false)} />
                    </React.Suspense>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-backdrop fade show"></div>
          </>
        )}

        {/* Create Inventory Item Modal */}
        {showCreateItemModal && (
          <>
            <div className="modal fade show" tabIndex={-1} role="dialog" style={{ display: 'block' }} aria-modal="true">
              <div className="modal-dialog modal-lg" role="document">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Create Inventory Item</h5>
                    <button type="button" className="btn-close" aria-label="Close" onClick={() => setShowCreateItemModal(false)}></button>
                  </div>
                  <div className="modal-body">
                    <React.Suspense fallback={<Loading message="Loading data..." />}>
                      <CreateInventoryItemForm hideHeader onCreated={handleItemCreatedInline} onCancel={() => setShowCreateItemModal(false)} />
                    </React.Suspense>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-backdrop fade show"></div>
          </>
        )}
    </>
  );
};

export default CreatePurchaseOrderForm;