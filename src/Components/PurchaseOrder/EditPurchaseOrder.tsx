// src/components/PurchaseOrder/EditPurchaseOrder.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import PageHeader from '../Layout/PageHeader';
import { purchaseOrderApi, vendorApi, inventoryItemApi } from '../../services/api';
import {
  PurchaseOrderUpdate,
  PurchaseOrderStatus,
} from '../../types/PurchaseOrder';
import {
  PurchaseOrderItemCreate,
  PurchaseOrderItemUpdate,
  PurchaseOrderItemResponse, 
} from '../../types/PurchaseOrderItem';
import { VendorResponse } from '../../types/Vendor';
import { InventoryItemResponse } from '../../types/InventoryItem';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';

interface FormPurchaseOrderItem extends PurchaseOrderItemResponse {
  tempId: number; // For new items, to uniquely identify them before they have a backend ID
  isNew?: boolean; // Flag to indicate if this item is newly added
  isDeleted?: boolean; // Flag to indicate if this item is marked for deletion
  // For display purposes, derived from inventory_item relation
  inventory_item_name?: string;
  inventory_item_unit?: string;
}

const EditPurchaseOrder: React.FC = () => {
  const { po_id } = useParams<{ po_id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [vendors, setVendors] = useState<VendorResponse[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItemResponse[]>([]);

  // Purchase Order states, initialized from fetched data
  const [vendorId, setVendorId] = useState<number | ''>('');
  
  const [orderDate, setOrderDate] = useState<Date | null>(null);
  
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<PurchaseOrderStatus | ''>('');
  const [items, setItems] = useState<FormPurchaseOrderItem[]>([]); // Array of items for the PO

  // --- Initial Data Fetch (PO, Vendors, Inventory Items) ---
  useEffect(() => {
    const fetchInitialData = async () => {
      setInitialLoading(true);
      setError(null);
      try {
        if (!po_id) {
            setError("Purchase Order ID is missing.");
            setInitialLoading(false);
            return;
        }

        const [poData, vendorsData, inventoryItemsData] = await Promise.all([
          purchaseOrderApi.getPurchaseOrder(Number(po_id)),
          vendorApi.getVendors(),
          inventoryItemApi.getInventoryItems(),
        ]);

        // Set main PO details
        setVendorId(poData.vendor_id);
        
        setOrderDate(poData.order_date ? new Date(poData.order_date) : null);
        
        setNotes(poData.notes || '');
        setStatus(poData.status);

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

        setVendors(vendorsData);
        setInventoryItems(inventoryItemsData);

      } catch (err: any) {
        console.error('Error fetching data for edit:', err);
        setError(err?.message || 'Failed to load purchase order for editing.');
        toast.error(err?.message || 'Failed to load purchase order for editing.');
      } finally {
        setInitialLoading(false);
      }
    };
    fetchInitialData();
  }, [po_id]);

  // --- Item Management Functions ---
  const handleAddItem = useCallback(() => {
    const newItem: FormPurchaseOrderItem = {
      tempId: Date.now(),
      inventory_item_id: 0, // Placeholder for dropdown selection
      quantity: 1,
      price_per_unit: 0,
      id: 0, // No backend ID yet
      purchase_order_id: Number(po_id), // Link to this PO
      line_total: 0, // Will be calculated by backend
      isNew: true, // Mark as new
      isDeleted: false,
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
        toast.error("Purchase Order ID is missing for update.");
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
      if (!item.inventory_item_id || item.quantity <= 0 || item.price_per_unit <= 0) {
        toast.error('Please ensure all active items have a selected Inventory Item, quantity > 0, and price per unit > 0.');
        setIsLoading(false);
        return;
      }
    }

    try {
      // 1. Update main Purchase Order details
      const poUpdateData: PurchaseOrderUpdate = {
        vendor_id: Number(vendorId),
        order_date: orderDate ? format(orderDate, 'yyyy-MM-dd') : undefined,
        
        notes: notes || undefined,
        status: status as PurchaseOrderStatus, // Cast to expected enum
      };
      await purchaseOrderApi.updatePurchaseOrder(Number(po_id), poUpdateData);

      // 2. Process Purchase Order Items (Add, Update, Delete)
      for (const item of items) {
        if (item.isDeleted && !item.isNew) { // Existing item marked for deletion
          await purchaseOrderApi.deletePurchaseOrderItem(Number(po_id), item.id);
        } else if (item.isNew && !item.isDeleted) { // New item not marked for deletion
          const newItemData: PurchaseOrderItemCreate = {
            inventory_item_id: item.inventory_item_id,
            quantity: item.quantity,
            price_per_unit: item.price_per_unit,
          };
          await purchaseOrderApi.addPurchaseOrderItem(Number(po_id), newItemData);
        } else if (!item.isNew && !item.isDeleted) { // Existing item, potentially updated
          // Check if any fields actually changed before sending update request
          // This requires comparing against original values, which we don't store here.
          // For simplicity, we'll send the update if it's an existing item not deleted.
          // A more robust solution would involve deep comparison or only updating specific fields.
          const updateItemData: PurchaseOrderItemUpdate = {
            quantity: item.quantity,
            price_per_unit: item.price_per_unit,
          };
          await purchaseOrderApi.updatePurchaseOrderItem(Number(po_id), item.id, updateItemData);
        }
      }

      toast.success('Purchase Order updated successfully!');
      navigate('/purchase-orders'); // Navigate back to the PO list
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update purchase order.');
      console.error('Error updating PO:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (initialLoading) return <div className="text-center mt-5">Loading purchase order for editing...</div>;
  if (error) return <div className="text-center text-danger mt-5">{error}</div>;

  return (
    <>
      <PageHeader title={`Edit PO: ${po_id || 'Loading...'}`} buttonVariant="secondary" buttonLabel="Back to List" buttonLink="/purchase-orders" />
      <div className="container mt-4">
        <div className="card shadow-sm">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                {/* PO Details Section */}
                <h5 className="mb-3">Purchase Order Details</h5>
                <div className="col-md-6">
                  <label htmlFor="vendorSelect" className="form-label">Vendor <span className="text-danger">*</span></label>
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
                  {vendors.length === 0 && !isLoading && (
                    <div className="text-danger mt-1">No vendors found. Please add a vendor first.</div>
                  )}
                </div>
                
                <div className="col-md-6">
                  <label htmlFor="orderDate" className="form-label">Date <span className="text-danger">*</span></label>
                  <div>
                  <DatePicker
                    selected={orderDate}
                    onChange={(date: Date | null) => setOrderDate(date)}
                    dateFormat="yyyy-MM-dd"
                    className="form-control"
                    id="orderDate"
                    required
                    disabled={isLoading}
                  />
                  </div>
                </div>
                
                <div className="col-md-6">
                  <label htmlFor="status" className="form-label">Status <span className="text-danger">*</span></label>
                  <select
                    id="status"
                    className="form-select"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as PurchaseOrderStatus)}
                    required
                    disabled={isLoading}
                  >
                    {Object.values(PurchaseOrderStatus).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="col-12">
                  <label htmlFor="notes" className="form-label">Notes</label>
                  <textarea
                    className="form-control"
                    id="notes"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional notes for the purchase order"
                    disabled={isLoading}
                  ></textarea>
                </div>

                {/* Purchase Order Items Section */}
                <h5 className="mt-4 mb-3">Items <span className="text-danger">*</span></h5>
                {items.filter(item => !item.isDeleted).length === 0 && <p className="col-12 text-muted">No active items. Click "Add Item" to add new ones.</p>}

                {items.map((item, index) => (
                  <div key={item.tempId} className={`col-12 border p-3 mb-3 rounded ${item.isDeleted ? 'bg-danger-subtle border-danger' : 'bg-light'}`}>
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
                          className="btn btn-outline-secondary btn-sm"
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
                          <label htmlFor={`itemId-${item.tempId}`} className="form-label">Inventory Item <span className="text-danger">*</span></label>
                          <select
                            id={`itemId-${item.tempId}`}
                            className="form-select"
                            value={item.inventory_item_id || ''}
                            onChange={(e) => handleItemChange(item.tempId, 'inventory_item_id', e.target.value)}
                            required
                            disabled={isLoading || inventoryItems.length === 0 || !item.isNew} 
                          >
                            <option value="">Select an Item</option>
                            {inventoryItems.map((invItem) => (
                              <option key={invItem.id} value={invItem.id}>
                                {invItem.name} ({invItem.unit})
                              </option>
                            ))}
                          </select>
                          {inventoryItems.length === 0 && !isLoading && (
                              <div className="text-danger mt-1">No inventory items found. Please add items first.</div>
                          )}
                          {!item.isNew && (
                            <small className="text-muted">Cannot change item for existing entries.</small>
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
                    )}
                  </div>
                ))}

                <div className="col-12 text-center">
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm"
                    onClick={handleAddItem}
                    disabled={isLoading}
                  >
                    <i className="bi bi-plus-circle me-1"></i> Add New Item
                  </button>
                </div>

                <div className="col-12 mt-4">
                  <button
                    type="submit"
                    className="btn btn-primary me-2"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Updating...' : 'Update Purchase Order'}
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
    </>
  );
};

export default EditPurchaseOrder;