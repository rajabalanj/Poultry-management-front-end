// src/components/SalesOrder/EditSalesOrder.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import PageHeader from '../Layout/PageHeader';
import { salesOrderApi, inventoryItemApi, businessPartnerApi, s3Upload } from '../../services/api';
import CreateBusinessPartnerForm from '../BusinessPartner/CreateBusinessPartnerForm';
import CreateInventoryItemForm from '../InventoryItem/CreateInventoryItemForm';
import {
  SalesOrderUpdate,
} from '../../types/SalesOrder';
import {
  SalesOrderItemCreate,
  SalesOrderItemUpdate,
  SalesOrderItemResponse, 
} from '../../types/SalesOrderItem';
import { BusinessPartner } from '../../types/BusinessPartner';
import { InventoryItemResponse } from '../../types/InventoryItem';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';

interface FormSalesOrderItem extends SalesOrderItemResponse {
  tempId: number; // For new items, to uniquely identify them before they have a backend ID
  isNew?: boolean; // Flag to indicate if this item is newly added
  isDeleted?: boolean; // Flag to indicate if this item is marked for deletion
  // For display purposes, derived from inventory_item relation
  inventory_item_name?: string;
  inventory_item_unit?: string;
}

const EditSalesOrder: React.FC = () => {
  const { so_id } = useParams<{ so_id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [customers, setCustomers] = useState<BusinessPartner[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItemResponse[]>([]);
  const [showCreateCustomerModal, setShowCreateCustomerModal] = useState(false);
  const [showCreateItemModal, setShowCreateItemModal] = useState(false);

  // Sales Order states, initialized from fetched data
  const [customerId, setCustomerId] = useState<number | ''>('');
  
  const [orderDate, setOrderDate] = useState<Date | null>(null);
  
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<FormSalesOrderItem[]>([]);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [currentReceipt, setCurrentReceipt] = useState<string | null>(null); // Array of items for the SO

  const grandTotal = useMemo(() => {
    return items.filter(item => !item.isDeleted).reduce((sum, item) => sum + (item.quantity * item.price_per_unit), 0);
  }, [items]);

  // --- Initial Data Fetch (SO, Customers, Inventory Items) ---
  useEffect(() => {
    const fetchInitialData = async () => {
      setInitialLoading(true);
      setError(null);
      try {
        if (!so_id) {
            setError("Sales Order ID is missing.");
            setInitialLoading(false);
            return;
        }

        const [soData, customersData, inventoryItemsData] = await Promise.all([
          salesOrderApi.getSalesOrder(Number(so_id)),
          businessPartnerApi.getCustomers(),
          inventoryItemApi.getInventoryItems(),
        ]);

        // Set main SO details
        setCustomerId(soData.customer_id);
        
        setOrderDate(soData.order_date ? new Date(soData.order_date) : null);
        
        setNotes(soData.notes || '');
        setCurrentReceipt(soData.payment_receipt || null);

        // Map existing items to form state, adding tempId for consistency and flags
        const formItems: FormSalesOrderItem[] = soData.items?.map(item => ({
          ...item,
          tempId: item.id || Date.now() + Math.random(), // Use actual ID or generate temp for safety
          isNew: false, // These are existing items
          isDeleted: false, // Not marked for deletion initially
          inventory_item_name: item.inventory_item?.name,
          inventory_item_unit: item.inventory_item?.unit,
        })) || [];
        setItems(formItems);

        setCustomers(customersData);
        setInventoryItems(inventoryItemsData);

      } catch (err: any) {
        console.error('Error fetching data for edit:', err);
        setError(err?.message || 'Failed to load sales order for editing.');
        toast.error(err?.message || 'Failed to load sales order for editing.');
      } finally {
        setInitialLoading(false);
      }
    };
    fetchInitialData();
  }, [so_id]);

  useEffect(() => {
    if (showCreateCustomerModal || showCreateItemModal) document.body.classList.add('modal-open');
    else document.body.classList.remove('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, [showCreateCustomerModal, showCreateItemModal]);

  // --- Item Management Functions ---

  const handleCustomerCreatedInline = (customer: BusinessPartner) => {
    setCustomers((prev) => [...prev, customer]);
    setCustomerId(customer.id);
    setShowCreateCustomerModal(false);
    toast.success(`Customer "${customer.name}" added.`);
  };

  const handleItemCreatedInline = (item: InventoryItemResponse) => {
    setInventoryItems((prev) => [...prev, item]);
    setItems((prev) => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      updated[updated.length - 1] = { ...updated[updated.length - 1], inventory_item_id: item.id, inventory_item_name: item.name, inventory_item_unit: item.unit } as any;
      return updated;
    });
    setShowCreateItemModal(false);
    toast.success(`Item "${item.name}" added.`);
  };

  const handleAddItem = useCallback(() => {
    if (!so_id) {
      toast.error("Cannot add item without a sales order ID.");
      return;
    }
    const newItem: FormSalesOrderItem = {
      tempId: Date.now(),
      id: 0, // Placeholder for new item
      sales_order_id: Number(so_id),
      inventory_item_id: 0,
      quantity: 1,
      price_per_unit: 0,
      isNew: true,
      isDeleted: false,
      line_total: 0,
      inventory_item: undefined
    };
    setItems((prevItems) => [...prevItems, newItem]);
  }, [so_id]);

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

  const handleItemChange = useCallback((tempId: number, field: keyof FormSalesOrderItem, value: any) => {
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

    if (!so_id) {
        toast.error("Sales Order ID is missing for update.");
        setIsLoading(false);
        return;
    }

    // Filter out items marked for deletion for validation
    const activeItems = items.filter(item => !item.isDeleted);

    // Basic Validation
    if (!customerId || activeItems.length === 0 || orderDate === null) {
      toast.error('Please select a Customer, an Date, and ensure at least one active item.');
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
      // 1. Update main Sales Order details
      const soUpdateData: SalesOrderUpdate = {
        customer_id: Number(customerId),
        order_date: orderDate ? format(orderDate, 'yyyy-MM-dd') : undefined,
        notes: notes || undefined,
      };
      await salesOrderApi.updateSalesOrder(Number(so_id), soUpdateData);

      // Upload receipt if file is selected
      if (receiptFile) {
        const uploadConfig = await salesOrderApi.getSalesOrderReceiptUploadUrl(Number(so_id), receiptFile.name);
        await s3Upload(uploadConfig.upload_url, receiptFile);
      }

      // 2. Process Sales Order Items (Add, Update, Delete)
      for (const item of items) {
        if (item.isDeleted && !item.isNew) { // Existing item marked for deletion
          await salesOrderApi.deleteSalesOrderItem(Number(so_id), item.id);
        } else if (item.isNew && !item.isDeleted) { // New item not marked for deletion
          const newItemData: SalesOrderItemCreate = {
            inventory_item_id: item.inventory_item_id,
            quantity: item.quantity,
            price_per_unit: item.price_per_unit || 0,
          };
          await salesOrderApi.addSalesOrderItem(Number(so_id), newItemData);
        } else if (!item.isNew && !item.isDeleted) { // Existing item, potentially updated
          // Check if any fields actually changed before sending update request
          // This requires comparing against original values, which we don't store here.
          // For simplicity, we'll send the update if it's an existing item not deleted.
          // A more robust solution would involve deep comparison or only updating specific fields.
          const updateItemData: SalesOrderItemUpdate = {
            quantity: item.quantity,
            price_per_unit: item.price_per_unit || 0,
          };
          await salesOrderApi.updateSalesOrderItem(Number(so_id), item.id, updateItemData);
        }
      }

      toast.success('Sales Order updated successfully!');
      navigate('/sales-orders'); // Navigate back to the SO list
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update sales order.');
      console.error('Error updating Sales:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (initialLoading) return <div className="text-center mt-5">Loading sales order for editing...</div>;
  if (error) return <div className="text-center text-danger mt-5">{error}</div>;

  return (
    <>
      <PageHeader title={`Edit Sales: ${so_id || 'Loading...'}`} buttonVariant="secondary" buttonLabel="Back"/>
      <div className="container mt-4">
        <div className="card shadow-sm">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                {/* SO Details Section */}
                <h5 className="mb-3">Sales Order Details</h5>
                <div className="col-md-6">
                  <label htmlFor="customerSelect" className="form-label">Customer <span className="text-danger">*</span></label>
                  <div className="d-flex">
                    <select
                      id="customerSelect"
                      className="form-select me-2"
                      value={customerId}
                      onChange={(e) => setCustomerId(Number(e.target.value))}
                      required
                      disabled={isLoading || customers.length === 0}
                    >
                      <option value="">Select a Customer</option>
                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>{customer.name}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      onClick={() => setShowCreateCustomerModal(true)}
                      disabled={isLoading}
                      title="Add Customer"
                    >
                      <i className="bi bi-plus-lg"></i>
                    </button>
                  </div>
                  {customers.length === 0 && !isLoading && (
                    <div className="text-danger mt-1">No customers found. Please add a customer first.</div>
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
                
                <div className="col-12">
                  <label htmlFor="notes" className="form-label">Notes</label>
                  <textarea
                    className="form-control"
                    id="notes"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional notes for the sales order"
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

                {/* Sales Order Items Section */}
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
                          <label htmlFor={`itemId-${item.tempId}`} className="form-label">Inventory Item <span className="text-danger">*</span></label>
                          <div className="d-flex">
                            <select
                              id={`itemId-${item.tempId}`}
                              className="form-select me-2"
                              value={item.inventory_item_id || ''}
                              onChange={(e) => handleItemChange(item.tempId, 'inventory_item_id', e.target.value)}
                              required
                              disabled={!item.isNew || isLoading}
                            >
                              <option value="">Select an Item</option>
                              {inventoryItems.map((invItem) => (
                                <option key={invItem.id} value={invItem.id}>
                                  {invItem.name} ({invItem.unit})
                                </option>
                              ))}
                            </select>
                            {/* add-item button removed on edit page */}
                          </div>
                          {inventoryItems.length === 0 && !isLoading && (
                              <div className="text-danger mt-1">No inventory items found. Please add items first.</div>
                          )}
                          {/* Inventory item can now be changed for existing rows */}
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
                    <h4>Grand Total: <strong>Rs. {grandTotal.toFixed(2)}</strong></h4>
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
                    {isLoading ? 'Updating...' : 'Update Sales Order'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => navigate('/sales-orders')}
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
      {/* Create Customer Modal */}
      {showCreateCustomerModal && (
        <>
          <div className="modal fade show" tabIndex={-1} role="dialog" style={{ display: 'block' }} aria-modal="true">
            <div className="modal-dialog modal-lg" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Create Customer</h5>
                  <button type="button" className="btn-close" aria-label="Close" onClick={() => setShowCreateCustomerModal(false)}></button>
                </div>
                <div className="modal-body">
                  <CreateBusinessPartnerForm hideHeader onCreated={handleCustomerCreatedInline} onCancel={() => setShowCreateCustomerModal(false)} />
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

export default EditSalesOrder;