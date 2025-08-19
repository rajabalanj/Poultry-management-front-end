// src/components/PurchaseOrder/CreatePurchaseOrderForm.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import PageHeader from '../Layout/PageHeader';
import { purchaseOrderApi, inventoryItemApi, businessPartnerApi } from '../../services/api';
import CreateBusinessPartnerForm from '../BusinessPartner/CreateBusinessPartnerForm';
import CreateInventoryItemForm from '../InventoryItem/CreateInventoryItemForm';
import {
  PurchaseOrderCreate,
} from '../../types/PurchaseOrder';
import { PurchaseOrderItemCreate } from '../../types/PurchaseOrderItem';
import { BusinessPartner } from '../../types/BusinessPartner';
import { InventoryItemResponse } from '../../types/InventoryItem';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns'; // Import format for date formatting

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
  const [vendorId, setVendorId] = useState<number | ''>('');
  
  const [orderDate, setOrderDate] = useState<Date>(new Date()); // ADD THIS STATE: Default to current date
  
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<FormPurchaseOrderItem[]>([]);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

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
      if (!item.inventory_item_id || item.quantity <= 0 || item.price_per_unit <= 0) {
        toast.error('Please ensure all items have a selected Inventory Item, quantity > 0, and price per unit > 0.');
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
        price_per_unit: item.price_per_unit,
      })),
    };

    try {
      const poResponse = await purchaseOrderApi.createPurchaseOrder(newPurchaseOrder);
      
      // Upload receipt if file is selected
      if (receiptFile && poResponse.id) {
        const formData = new FormData();
        formData.append('file', receiptFile);
        await purchaseOrderApi.uploadPurchaseOrderReceipt(poResponse.id, formData);
      }
      
      toast.success('Purchase created successfully!');
      navigate('/purchase-orders');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to create purchase.');
      console.error('Error creating Purchase:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <PageHeader title="Create New Purchase" buttonVariant="secondary" buttonLabel="Back to List" buttonLink="/purchase-orders" />
      <div className="container mt-4">
        <div className="card shadow-sm">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                {/* Purchase Details Section */}
                <h5 className="mb-3">Purchase Details</h5>
                <div className="col-md-6">
                  <label htmlFor="vendorSelect" className="form-label">Vendor <span className="text-danger">*</span></label>
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
                
                {/* ADD THIS FIELD: Order Date */}
                <div className="col-md-6">
                  <label htmlFor="orderDate" className="form-label">Date <span className="text-danger">*</span></label>
                  <div>
                  <DatePicker
                    selected={orderDate}
                    onChange={(date: Date | null) => date && setOrderDate(date)} // Ensure date is not null
                    dateFormat="yyyy-MM-dd"
                    className="form-control"
                    id="orderDate"
                    required
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
                <h5 className="mt-4 mb-3">Items <span className="text-danger">*</span></h5>
                {items.length === 0 && <p className="col-12 text-muted">No items added yet. Click "Add Item" to start.</p>}
                {items.map((item, index) => (
                  <div key={item.tempId} className="col-12 border p-3 mb-3 rounded bg-light">
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
                        <label htmlFor={`itemId-${item.tempId}`} className="form-label">Inventory Item <span className="text-danger">*</span></label>
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
                        <label htmlFor={`quantity-${item.tempId}`} className="form-label">Quantity <span className="text-danger">*</span></label>
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
                        <label htmlFor={`pricePerUnit-${item.tempId}`} className="form-label">Price per Unit <span className="text-danger">*</span></label>
                        <input
                          type="number"
                          className="form-control"
                          id={`pricePerUnit-${item.tempId}`}
                          value={item.price_per_unit}
                          onChange={(e) => handleItemChange(item.tempId, 'price_per_unit', Number(e.target.value))}
                          min="0.01"
                          step="0.01"
                          required
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  </div>
                ))}

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
                    {isLoading ? 'Creating...' : 'Create Purchase'}
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
                    <React.Suspense fallback={<div>Loading...</div>}>
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
                    <React.Suspense fallback={<div>Loading...</div>}>
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