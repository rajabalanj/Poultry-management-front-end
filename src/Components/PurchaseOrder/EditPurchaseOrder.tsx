// src/components/PurchaseOrder/EditPurchaseOrder.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import PageHeader from '../Layout/PageHeader';
import CustomDatePicker from '../Common/CustomDatePicker';
import { format } from 'date-fns';
import { purchaseOrderApi, inventoryItemApi, businessPartnerApi, s3Upload } from '../../services/api';
import CreateBusinessPartnerForm from '../BusinessPartner/CreateBusinessPartnerForm';
import CreateInventoryItemForm from '../InventoryItem/CreateInventoryItemForm';
import {
  PurchaseOrderUpdate,
} from '../../types/PurchaseOrder';
import {
  PurchaseOrderItemCreate,
  PurchaseOrderItemUpdate,
  PurchaseOrderItemResponse, 
} from '../../types/PurchaseOrderItem';
import { BusinessPartner } from '../../types/BusinessPartner';
import { InventoryItemResponse } from '../../types/InventoryItem';
import StyledSelect from '../Common/StyledSelect';

interface FormPurchaseOrderItem extends PurchaseOrderItemResponse {
  tempId: number; // For new items, to uniquely identify them before they have a backend ID
  isNew?: boolean; // Flag to indicate if this item is newly added
  isDeleted?: boolean; // Flag to indicate if this item is marked for deletion
  // For display purposes, derived from inventory_item relation
  inventory_item_name?: string;
  inventory_item_unit?: string;
}

type OptionType = { value: number; label: string };

const EditPurchaseOrder: React.FC = () => {
  const { po_id } = useParams<{ po_id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [poNumber, setPoNumber] = useState<string>('');

  const [vendors, setVendors] = useState<BusinessPartner[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItemResponse[]>([]);
  const [showCreateVendorModal, setShowCreateVendorModal] = useState(false);
  const [showCreateItemModal, setShowCreateItemModal] = useState(false);

  // Purchase states, initialized from fetched data
  const [vendorId, setVendorId] = useState<number | ''>(0);
  
  const [orderDate, setOrderDate] = useState<Date | null>(null);
  
  const [notes, setNotes] = useState('');
  
  const [items, setItems] = useState<FormPurchaseOrderItem[]>([]);
  const [originalItems, setOriginalItems] = useState<FormPurchaseOrderItem[]>([]);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [currentReceipt, setCurrentReceipt] = useState<string | null>(null); // Array of items for the Purchase

  const grandTotal = useMemo(() => {
    return items.filter(item => !item.isDeleted).reduce((sum, item) => sum + (item.quantity * item.price_per_unit), 0);
  }, [items]);

  // --- Initial Data Fetch (Purchase, Vendors, Inventory Items) ---
  useEffect(() => {
    const fetchInitialData = async () => {
      setInitialLoading(true);
      setError(null);
      try {
        if (!po_id) {
            setError("Purchase ID is missing.");
            setInitialLoading(false);
            return;
        }

        const [poData, vendorsData, inventoryItemsData] = await Promise.all([
          purchaseOrderApi.getPurchaseOrder(Number(po_id)),
          businessPartnerApi.getVendors(),
          inventoryItemApi.getInventoryItems(),
        ]);

        // Set main Purchase details
        setVendorId(poData.vendor_id);
        setPoNumber(poData.po_number);
        
        setOrderDate(poData.order_date ? new Date(poData.order_date) : null);
        
        setNotes(poData.notes || '');
        
        setCurrentReceipt(poData.payment_receipt || null);

        // Map existing items to form state, adding tempId for consistency and flags
        const formItems: FormPurchaseOrderItem[] = poData.items?.map(item => ({
          ...item,
          tempId: item.id || Date.now() + Math.random(), // Use actual ID or generate temp for safety
          isNew: false, // These are existing items
          isDeleted: false, // Not marked for deletion initially
          inventory_item_name: item.inventory_item?.name,
          inventory_item_unit: item.inventory_item?.unit,
        })) || [];
        setItems(formItems);
        setOriginalItems(formItems);

        setVendors(vendorsData);
        setInventoryItems(inventoryItemsData);

      } catch (err: any) {
        console.error('Error fetching data for edit:', err);
        setError(err?.message || 'Failed to load purchase for editing.');
        toast.error(err?.message || 'Failed to load purchase for editing.');
      } finally {
        setInitialLoading(false);
      }
    };
    fetchInitialData();
  }, [po_id]);

  useEffect(() => {
    if (showCreateVendorModal || showCreateItemModal) document.body.classList.add('modal-open');
    else document.body.classList.remove('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, [showCreateVendorModal, showCreateItemModal]);

  // --- Item Management Functions ---

  const handleVendorCreatedInline = (vendor: BusinessPartner) => {
    setVendors((prev) => [...prev, vendor]);
    setVendorId(vendor.id);
    setShowCreateVendorModal(false);
    toast.success(`Vendor "${vendor.name}" added.`);
  };

  const handleItemCreatedInline = (item: InventoryItemResponse) => {
    setInventoryItems((prev) => [...prev, item]);
    setItems((prev) => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      // assign to last added new row if exists
      const lastIdx = updated.map(i => i.isNew).lastIndexOf(true);
      if (lastIdx >= 0) {
        updated[lastIdx] = { ...updated[lastIdx], inventory_item_id: item.id, inventory_item_name: item.name, inventory_item_unit: item.unit } as any;
      } else {
        updated[updated.length - 1] = { ...updated[updated.length - 1], inventory_item_id: item.id, inventory_item_name: item.name, inventory_item_unit: item.unit } as any;
      }
      return updated;
    });
    setShowCreateItemModal(false);
    toast.success(`Item "${item.name}" added.`);
  };

  const handleAddItem = useCallback(() => {
    if (!po_id) {
      toast.error("Cannot add item without a purchase order ID.");
      return;
    }
    const newItem: FormPurchaseOrderItem = {
      tempId: Date.now(),
      id: 0, // Placeholder for new item
      purchase_order_id: Number(po_id),
      inventory_item_id: 0,
      quantity: 1,
      price_per_unit: 0,
      isNew: true,
      isDeleted: false,
      line_total: 0,
      inventory_item: undefined
    };
    setItems((prevItems) => [...prevItems, newItem]);
  }, [po_id]);

  const handleRemoveItem = useCallback((tempId: number) => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.tempId === tempId ? { ...item, isDeleted: true } : item // Mark for deletion instead of removing
      )
    );
  }, []);

  const handleUndoRemoveItem = useCallback((tempId: number) => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.tempId === tempId ? { ...item, isDeleted: false } : item
      )
    );
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

  // --- Form Submission ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!po_id) {
        toast.error("Purchase ID is missing for update.");
        setIsLoading(false);
        return;
    }

    // Filter out items marked for deletion for validation
    const activeItems = items.filter(item => !item.isDeleted);

    // Basic Validation
    if (!vendorId || activeItems.length === 0 || orderDate === null) {
      toast.error('Please select a Vendor, an Date, and ensure at least one active item.');
      setIsLoading(false);
      return;
    }

    // Validate each active item
    for (const item of activeItems) {
      if (!item.inventory_item_id || item.quantity <= 0) {
        toast.error('Please ensure all active items have a selected Inventory Item and quantity > 0.');
        setIsLoading(false);
        return;
      }
    }

    try {
      // 1. Update main Purchase details
      const poUpdateData: PurchaseOrderUpdate = {
        vendor_id: Number(vendorId),
        order_date: orderDate ? format(orderDate, 'yyyy-MM-dd') : undefined,
        
        notes: notes || undefined,
        
      };
      await purchaseOrderApi.updatePurchaseOrder(Number(po_id), poUpdateData);

      // Upload receipt if file is selected
      if (receiptFile) {
        const uploadConfig = await purchaseOrderApi.getPurchaseOrderReceiptUploadUrl(Number(po_id), receiptFile.name);
        await s3Upload(uploadConfig.upload_url, receiptFile);
      }

      // 2. Process Purchase Items (Add, Update, Delete)
      for (const item of items) {
        if (item.isDeleted && !item.isNew) { // Existing item marked for deletion
          await purchaseOrderApi.deletePurchaseOrderItem(Number(po_id), item.id);
        } else if (item.isNew && !item.isDeleted) { // New item not marked for deletion
          const newItemData: PurchaseOrderItemCreate = {
            inventory_item_id: item.inventory_item_id,
            quantity: item.quantity,
            price_per_unit: item.price_per_unit || 0,
          };
          await purchaseOrderApi.addPurchaseOrderItem(Number(po_id), newItemData);
        } else if (!item.isNew && !item.isDeleted) { // Existing item, potentially updated
          const originalItem = originalItems.find(oi => oi.id === item.id);

          const hasChanged = !originalItem || 
                               originalItem.inventory_item_id !== item.inventory_item_id ||
                               originalItem.quantity !== item.quantity || 
                               originalItem.price_per_unit !== item.price_per_unit;

          if (hasChanged) {
            const updateItemData: PurchaseOrderItemUpdate = {
              inventory_item_id: item.inventory_item_id,
              quantity: item.quantity,
              price_per_unit: item.price_per_unit || 0,
            };
            await purchaseOrderApi.updatePurchaseOrderItem(Number(po_id), item.id, updateItemData);
          }
        }
      }

      toast.success('Purchase updated successfully!');
      navigate('/purchase-orders'); // Navigate back to the Purchase list
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update purchase.');
      console.error('Error updating Purchase:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (initialLoading) return <div className="text-center mt-5">Loading purchase for editing...</div>;
  if (error) return <div className="text-center text-danger mt-5">{error}</div>;

  const vendorOptions: OptionType[] = vendors.map((vendor) => ({
    value: vendor.id,
    label: vendor.name,
  }));
  const selectedVendorOption = vendorOptions.find(option => option.value === vendorId);

  const inventoryItemOptions: OptionType[] = inventoryItems.map((item) => ({
    value: item.id,
    label: `${item.name} (${item.unit})`,
  }));

  return (
    <>
      <PageHeader title={`Edit Purchase: ${poNumber || 'Loading...'}`} buttonVariant="secondary" buttonLabel="Back to List" buttonLink="/purchase-orders" buttonIcon='bi-arrow-left' />
      <div className="container mt-4">
        <div className="card shadow-sm">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                {/* Purchase Details Section */}
                <h5 className="mb-3">Purchase Details</h5>
                <div className="col-md-6">
                  <label htmlFor="vendorSelect" className="form-label">Vendor <span className="form-field-required">*</span></label>
                  <div className="d-flex gap-2 align-items-center">
                  <StyledSelect
                      id="vendorSelect"
                      className="form-select"
                      value={selectedVendorOption}
                      onChange={(option, _action) => setVendorId(option ? Number(option.value) : '')}
                      options={vendorOptions}
                      placeholder="Select a Vendor"
                      isClearable
                      isLoading={isLoading || vendors.length === 0}
                    />
                    <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setShowCreateVendorModal(true)} title="Add Vendor">
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
                  <CustomDatePicker
                    selected={orderDate}
                    onChange={(date: Date | null) => setOrderDate(date)}
                    dateFormat="dd-MM-yyyy"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    className="form-control"
                    id="orderDate"
                    disabled={isLoading} />
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
                  <label htmlFor="receiptFile" className="form-label">Payment Receipt</label>
                  {currentReceipt && (
                    <div className="mb-2">
                      <small className="text-muted">Current receipt: {currentReceipt}</small>
                    </div>
                  )}
                  <input
                    type="file"
                    className="form-control"
                    id="receiptFile"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                    disabled={isLoading}
                  />
                  <div className="form-text">Upload new payment receipt (PDF, JPG, PNG) - will replace existing if any</div>
                </div>

                {/* Purchase Items Section */}
                <h5 className="mt-4 mb-3">Items <span className="form-field-required">*</span></h5>
                {items.filter(item => !item.isDeleted).length === 0 && <p className="col-12 text-muted">No active items. Click "Add Item" to add new ones.</p>}

                {items.map((item, index) => (
                  <div key={item.tempId} className={`col-12 border p-3 mb-3 ${item.isDeleted ? 'bg-danger-subtle border-danger' : 'bg-light'}`}>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h6>Item {index + 1} {item.isDeleted && <span className="badge bg-danger ms-2">Marked for Deletion</span>}</h6>
                      {!item.isDeleted ? (
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => handleRemoveItem(item.tempId)}
                          disabled={isLoading}
                        >
                          <i className="bi bi-x-lg"></i> Mark for Remove
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm fw-bold"
                          onClick={() => handleUndoRemoveItem(item.tempId)}
                          disabled={isLoading}
                        >
                          <i className="bi bi-arrow-counterclockwise"></i> Undo Remove
                        </button>
                      )}
                    </div>
                    {!item.isDeleted && (
                      <div className="row g-2">
                        <div className="col-md-6">
                          <label htmlFor={`itemId-${item.tempId}`} className="form-label">Inventory Item <span className="form-field-required">*</span></label>
                          <div className="d-flex gap-2 align-items-center">
                          <StyledSelect
                            id={`itemId-${item.tempId}`}
                            className="form-select"
                            value={inventoryItemOptions.find(option => option.value === item.inventory_item_id)}
                            onChange={(option, _action) => handleItemChange(item.tempId, 'inventory_item_id', option ? option.value : '')}
                            options={inventoryItemOptions}
                            placeholder="Select an Item"
                            isClearable
                            isLoading={isLoading}
                          />
                          {/* add-item button removed on edit page */}
                          </div>
                          {inventoryItems.length === 0 && !isLoading && (
                              <div className="text-danger mt-1">No inventory items found. Please add items first.</div>
                          )}
                          {/* Inventory item can now be changed for existing rows */}
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
                    )}
                  </div>
                ))}

                {items.filter(item => !item.isDeleted).length > 0 && (
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
                    {isLoading ? 'Updating...' : 'Update Purchase'}
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
                          <CreateBusinessPartnerForm hideHeader onCreated={handleVendorCreatedInline} onCancel={() => setShowCreateVendorModal(false)} />
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
                          <CreateInventoryItemForm hideHeader onCreated={handleItemCreatedInline} onCancel={() => setShowCreateItemModal(false)} />
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

export default EditPurchaseOrder;