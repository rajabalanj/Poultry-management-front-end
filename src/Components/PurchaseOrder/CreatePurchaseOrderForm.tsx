// src/components/PurchaseOrder/CreatePurchaseOrderForm.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import PageHeader from '../Layout/PageHeader';
import { purchaseOrderApi, vendorApi, inventoryItemApi } from '../../services/api';
import {
  PurchaseOrderCreate,
} from '../../types/PurchaseOrder';
import { PurchaseOrderItemCreate } from '../../types/PurchaseOrderItem';
import { VendorResponse } from '../../types/Vendor';
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
  const [vendors, setVendors] = useState<VendorResponse[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItemResponse[]>([]);

  // Purchase Order states
  const [vendorId, setVendorId] = useState<number | ''>('');
  const [poNumber, setPoNumber] = useState('');
  const [orderDate, setOrderDate] = useState<Date>(new Date()); // ADD THIS STATE: Default to current date
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<Date | null>(null);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<FormPurchaseOrderItem[]>([]);

  // ... (rest of the useEffect for fetching initial data remains the same)
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const [vendorsData, inventoryItemsData] = await Promise.all([
          vendorApi.getVendors(),
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
    if (!vendorId || !poNumber.trim() || items.length === 0) {
      toast.error('Please select a Vendor, provide a PO Number, and add at least one item.');
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
      po_number: poNumber,
      order_date: format(orderDate, 'yyyy-MM-dd'), // ADD THIS LINE: Format to YYYY-MM-DD
      expected_delivery_date: expectedDeliveryDate ? format(expectedDeliveryDate, 'yyyy-MM-dd') : undefined, // Format expected delivery
      notes: notes || undefined,
      items: items.map(item => ({
        inventory_item_id: item.inventory_item_id,
        quantity: item.quantity,
        price_per_unit: item.price_per_unit,
      })),
    };

    try {
      await purchaseOrderApi.createPurchaseOrder(newPurchaseOrder);
      toast.success('Purchase Order created successfully!');
      navigate('/purchase-orders');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to create purchase order.');
      console.error('Error creating PO:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <PageHeader title="Create New Purchase Order" buttonVariant="secondary" buttonLabel="Back to List" buttonLink="/purchase-orders" />
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
                  <label htmlFor="poNumber" className="form-label">PO Number <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    id="poNumber"
                    value={poNumber}
                    onChange={(e) => setPoNumber(e.target.value)}
                    placeholder="e.g., PO-2024-001"
                    required
                    disabled={isLoading}
                  />
                </div>
                {/* ADD THIS FIELD: Order Date */}
                <div className="col-md-6">
                  <label htmlFor="orderDate" className="form-label">Order Date <span className="text-danger">*</span></label>
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
                <div className="col-md-6">
                  <label htmlFor="expectedDeliveryDate" className="form-label">Expected Delivery Date</label>
                  <DatePicker
                    selected={expectedDeliveryDate}
                    onChange={(date: Date | null) => setExpectedDeliveryDate(date)}
                    dateFormat="yyyy-MM-dd"
                    className="form-control"
                    id="expectedDeliveryDate"
                    placeholderText="YYYY-MM-DD"
                    isClearable
                    disabled={isLoading}
                  />
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
                    {isLoading ? 'Creating...' : 'Create Purchase Order'}
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

export default CreatePurchaseOrderForm;