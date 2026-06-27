// src/components/SalesOrder/EditSalesOrder.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import PageHeader from '../Layout/PageHeader';
import CustomDatePicker from '../Common/CustomDatePicker';
import { salesOrderApi, inventoryItemApi, businessPartnerApi, inventoryItemVariantApi, compositionApi } from '../../services/api';
import CreateBusinessPartnerForm from '../BusinessPartner/CreateBusinessPartnerForm';
import CreateInventoryItemForm from '../InventoryItem/CreateInventoryItemForm';
import {
  SalesOrderUpdate,
} from '../../types/SalesOrder';
import { CompositionResponse } from '../../types/compositon';
import {
  SalesOrderItemCreate,
  SalesOrderItemUpdate,
  SalesOrderItemResponse,
} from '../../types/SalesOrderItem';
import { BusinessPartner } from '../../types/BusinessPartner';
import { InventoryItemResponse } from '../../types/InventoryItem';
import { InventoryItemVariant } from '../../types/inventoryItemVariant';
import { format } from 'date-fns';
import StyledSelect from '../Common/StyledSelect';
import { useSubscription } from '../context/SubscriptionContext';
import SubscriptionWarning from '../Common/SubscriptionWarning';

interface FormSalesOrderItem extends SalesOrderItemResponse {
  tempId: number; // For new items, to uniquely identify them before they have a backend ID
  isNew?: boolean; // Flag to indicate if this item is newly added
  isDeleted?: boolean; // Flag to indicate if this item is marked for deletion
  item_type: 'inventory' | 'composition'; // Track item type
  // For display purposes, derived from inventory_item relation
  inventory_item_name?: string;
  inventory_item_unit?: string;
}

type OptionType = { value: number; label: string };


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
  const [variantsByItem, setVariantsByItem] = useState<{ [key: number]: InventoryItemVariant[] }>({});
  const [compositions, setCompositions] = useState<CompositionResponse[]>([]);

  // Sales Order states, initialized from fetched data
  const [customerId, setCustomerId] = useState<number | ''>('');

  const [orderDate, setOrderDate] = useState<Date | null>(null);

  const [notes, setNotes] = useState('');
  const [billNo, setBillNo] = useState<string>('');
  const [items, setItems] = useState<FormSalesOrderItem[]>([]);
  const [originalItems, setOriginalItems] = useState<FormSalesOrderItem[]>([]);

  const grandTotal = useMemo(() => {
    return items.filter(item => !item.isDeleted).reduce((sum, item) => sum + (item.quantity * item.price_per_unit), 0);
  }, [items]);

  const { isSubscriptionPaid } = useSubscription();

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

        const [soData, customersData, inventoryItemsData, compositionsData] = await Promise.all([
          salesOrderApi.getSalesOrder(Number(so_id)),
          businessPartnerApi.getCustomers(),
          inventoryItemApi.getInventoryItems(0, 1000),
          compositionApi.getCompositions(),
        ]);

        // Set main SO details
        setCustomerId(soData.customer_id);

        setOrderDate(soData.order_date ? new Date(soData.order_date) : null);

        setNotes(soData.notes || '');
        setBillNo(soData.bill_no || '');

        setCompositions(compositionsData);

        // Map existing items to form state, adding tempId for consistency and flags
        const formItems: FormSalesOrderItem[] = soData.items?.map(item => ({
          ...item,
          tempId: item.id || Date.now() + Math.random(), // Use actual ID or generate temp for safety
          isNew: false, // These are existing items
          isDeleted: false, // Not marked for deletion initially
          item_type: item.composition_id ? 'composition' : 'inventory',
          inventory_item_name: item.composition_id ? (item.composition?.name || compositionsData.find(c => c.id === item.composition_id)?.name) : item.inventory_item?.name,
          inventory_item_unit: item.composition_id ? 'kg' : item.inventory_item?.unit,
        })) || [];
        setItems(formItems);
        setOriginalItems(formItems);

        // Fetch variants for all items
        const variantPromises = formItems.map(item =>
          item.inventory_item_id
            ? inventoryItemVariantApi.getInventoryItemVariants(item.inventory_item_id)
            : Promise.resolve([])
        );

        const variantsByItemArray = await Promise.all(variantPromises);

        const variantsMap = formItems.reduce((acc, item, index) => {
          acc[item.tempId] = variantsByItemArray[index];
          return acc;
        }, {} as { [key: number]: InventoryItemVariant[] });

        setVariantsByItem(variantsMap);

        setCustomers(customersData);

        // Ensure already selected items remain in the list even if they are no longer sellable
        const existingItemIds = new Set(soData.items?.map(i => i.inventory_item_id) || []);
        const itemsToSet = inventoryItemsData.filter(item => item.is_sellable || existingItemIds.has(item.id));
        setInventoryItems(itemsToSet);

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
    const tempId = Date.now();
    const newItem: FormSalesOrderItem = {
      tempId,
      id: 0, // Placeholder for new item
      sales_order_id: Number(so_id),
      item_type: 'inventory',
      inventory_item_id: undefined,
      composition_id: undefined,
      quantity: 1,
      price_per_unit: 0,
      isNew: true,
      isDeleted: false,
      line_total: 0,
      inventory_item: undefined,
      variant_id: null,
      variant_name: '',
    };
    setItems((prevItems) => [...prevItems, newItem]);

    // Focus the first input (Inventory Item select) of the newly added row
    setTimeout(() => {
      const row = document.getElementById(`item-row-${tempId}`);
      if (row) {
        const firstInput = row.querySelector('input');
        if (firstInput) {
          firstInput.focus();
        }
      }
    }, 50);
  }, [so_id]);

  const handleRemoveItem = useCallback((tempId: number) => {
    setItems((prevItems) => {
      const index = prevItems.findIndex(i => i.tempId === tempId);

      setTimeout(() => {
        let focusTargetId = null;
        for (let i = index - 1; i >= 0; i--) {
          if (!prevItems[i].isDeleted) {
            focusTargetId = prevItems[i].tempId;
            break;
          }
        }

        if (focusTargetId) {
          const row = document.getElementById(`item-row-${focusTargetId}`);
          const input = row?.querySelector('input[type="number"]') as HTMLElement;
          if (input) input.focus();
        } else {
          const btn = document.getElementById('add-item-btn');
          if (btn) btn.focus();
        }
      }, 50);

      return prevItems.map((item) =>
        item.tempId === tempId ? { ...item, isDeleted: true } : item
      );
    });
  }, []);

  const handleUndoRemoveItem = useCallback((tempId: number) => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.tempId === tempId ? { ...item, isDeleted: false } : item
      )
    );
  }, []);

  const handleItemTypeChange = useCallback((tempId: number, type: 'inventory' | 'composition') => {
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.tempId === tempId) {
          return {
            ...item,
            item_type: type,
            inventory_item_id: undefined,
            composition_id: undefined,
            inventory_item_name: undefined,
            inventory_item_unit: undefined,
            variant_id: null,
            variant_name: '',
          };
        }
        return item;
      })
    );
  }, []);

  const handleItemChange = useCallback(async (tempId: number, field: keyof FormSalesOrderItem, value: string | number) => {
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.tempId === tempId) {
          if (field === 'inventory_item_id') {
            const selectedItem = inventoryItems.find(inv => inv.id === Number(value));
            // Reset variant when item changes
            return {
              ...item,
              [field]: Number(value) || undefined,
              composition_id: undefined,
              inventory_item_name: selectedItem?.name,
              inventory_item_unit: selectedItem?.unit,
              variant_id: null,
              variant_name: '',
            };
          }
          if (field === 'composition_id') {
            const selectedComp = compositions.find(comp => comp.id === Number(value));
            return {
              ...item,
              [field]: Number(value) || undefined,
              inventory_item_id: undefined,
              inventory_item_name: selectedComp?.name,
              inventory_item_unit: 'kg',
              variant_id: null,
              variant_name: '',
            };
          }
          if (field === 'variant_id') {
            const variantId = value ? Number(value) : null;
            const variants = variantsByItem[tempId] || [];
            const selectedVariant = variants.find(v => v.id === variantId);
            return {
              ...item,
              variant_id: variantId,
              variant_name: selectedVariant ? selectedVariant.name : '',
            };
          }
          return { ...item, [field]: value };
        }
        return item;
      })
    );

    if (field === 'inventory_item_id' && value) {
      try {
        const variants = await inventoryItemVariantApi.getInventoryItemVariants(Number(value));
        setVariantsByItem(prev => ({ ...prev, [tempId]: variants }));
      } catch (error) {
        toast.error('Failed to fetch item variants.');
        setVariantsByItem(prev => ({ ...prev, [tempId]: [] }));
      }
    }
  }, [inventoryItems, compositions, variantsByItem]);

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
      const hasItem = item.item_type === 'inventory' ? !!item.inventory_item_id : !!item.composition_id;
      if (!hasItem || item.quantity <= 0) {
        toast.error('Please ensure all active items have a selected Inventory Item or Composition and quantity > 0.');
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
        bill_no: billNo || undefined,
      };
      await salesOrderApi.updateSalesOrder(Number(so_id), soUpdateData);

      // 2. Process Sales Order Items (Add, Update, Delete)
      for (const item of items) {
        if (item.isDeleted && !item.isNew) { // Existing item marked for deletion
          await salesOrderApi.deleteSalesOrderItem(Number(so_id), item.id);
        } else if (item.isNew && !item.isDeleted) { // New item not marked for deletion
          const newItemData: SalesOrderItemCreate = {
            inventory_item_id: item.item_type === 'inventory' ? item.inventory_item_id : undefined,
            composition_id: item.item_type === 'composition' ? item.composition_id : undefined,
            quantity: item.quantity,
            price_per_unit: item.price_per_unit || 0,
            variant_id: item.item_type === 'inventory' ? item.variant_id : undefined,
            variant_name: item.item_type === 'inventory' ? item.variant_name : undefined,
          };
          await salesOrderApi.addSalesOrderItem(Number(so_id), newItemData);
        } else if (!item.isNew && !item.isDeleted) { // Existing item, potentially updated
          const originalItem = originalItems.find(oi => oi.id === item.id);

          const hasChanged = !originalItem ||
            originalItem.inventory_item_id !== item.inventory_item_id ||
            originalItem.composition_id !== item.composition_id ||
            originalItem.quantity !== item.quantity ||
            originalItem.price_per_unit !== item.price_per_unit ||
            originalItem.variant_id !== item.variant_id ||
            originalItem.variant_name !== item.variant_name;

          if (hasChanged) {
            const updateItemData: SalesOrderItemUpdate = {
              inventory_item_id: item.item_type === 'inventory' ? item.inventory_item_id : null,
              composition_id: item.item_type === 'composition' ? item.composition_id : null,
              quantity: item.quantity,
              price_per_unit: item.price_per_unit || 0,
              variant_id: item.item_type === 'inventory' ? item.variant_id : null,
              variant_name: item.item_type === 'inventory' ? item.variant_name : undefined,
            };
            await salesOrderApi.updateSalesOrderItem(Number(so_id), item.id, updateItemData);
          }
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

  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter') {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' && target.getAttribute('role') !== 'combobox') {
        e.preventDefault();
        const form = e.currentTarget;
        const focusableElements = Array.from(
          form.querySelectorAll(
            'input:not([disabled]):not([type="hidden"]), select:not([disabled]), button:not([disabled]), textarea:not([disabled])'
          )
        ) as HTMLElement[];
        const currentIndex = focusableElements.indexOf(target);
        if (currentIndex > -1 && currentIndex < focusableElements.length - 1) {
          focusableElements[currentIndex + 1].focus();
        }
      }
    }
  };

  if (initialLoading) return <div className="text-center mt-5">Loading sales order for editing...</div>;
  if (error) return <div className="text-center text-danger mt-5">{error}</div>;

  const customerOptions: OptionType[] = customers.map((customer) => ({
    value: customer.id,
    label: customer.name,
  }));
  const selectedCustomerOption = customerOptions.find(option => option.value === customerId);

  const inventoryItemOptions: OptionType[] = inventoryItems.map((item) => ({
    value: item.id,
    label: `${item.name} (${item.unit})`,
  }));

  const compositionOptions = compositions.map((comp) => ({
    value: comp.id,
    label: comp.name,
  }));

  return (
    <>
      <PageHeader title={`Edit Sales: ${so_id || 'Loading...'}`} buttonVariant="secondary" buttonLabel="Back" buttonIcon='bi-arrow-left' />
      <div className="container">
        <SubscriptionWarning />
        <div className="card shadow-sm">
          <div className="card-body">
            <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown}>
              <div className="row g-3">
                {/* SO Details Section */}
                <h5 className="mb-3">Sales Order Details</h5>
                <div className="col-md-6">
                  <label htmlFor="customerSelect" className="form-label">Customer <span className="form-field-required">*</span></label>
                  <div className="d-flex">
                    <StyledSelect
                      id="customerSelect"
                      className="me-2"
                      value={selectedCustomerOption}
                      onChange={(option, _action) => setCustomerId(option ? Number(option.value) : '')}
                      options={customerOptions}
                      placeholder="Select a Customer"
                      isClearable
                      isLoading={isLoading || customers.length === 0}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      onClick={() => setShowCreateCustomerModal(true)}
                      disabled={isLoading || isSubscriptionPaid === false}
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
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="col-md-6">
                  <label htmlFor="billNo" className="form-label">Bill No</label>
                  <input
                    type="text"
                    className="form-control"
                    id="billNo"
                    value={billNo}
                    onChange={(e) => setBillNo(e.target.value)}
                    placeholder="Enter bill number"
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
                    placeholder="Any additional notes for the sales order"
                    disabled={isLoading}
                  ></textarea>
                </div>


                {/* Sales Order Items Section */}
                <h5 className="mt-4 mb-3">Items <span className="form-field-required">*</span></h5>
                {items.filter(item => !item.isDeleted).length === 0 && <p className="col-12 text-muted">No active items. Click "Add Item" to add new ones.</p>}

                {items.map((item, index) => {
                  const itemVariants = variantsByItem[item.tempId] || [];
                  const variantOptions: OptionType[] = itemVariants.map(v => ({ value: v.id, label: v.name }));
                  const selectedVariantOption = variantOptions.find(o => o.value === item.variant_id);

                  return (
                    <div
                      key={item.tempId}
                      id={`item-row-${item.tempId}`}
                      className={`col-12 border p-3 mb-3 ${item.isDeleted ? 'bg-danger-subtle border-danger' : 'bg-light'}`}
                      onKeyDown={(e) => {
                        if (e.altKey && (e.key === 'Delete' || e.key === 'Backspace')) {
                          e.preventDefault();
                          if (item.isDeleted) handleUndoRemoveItem(item.tempId);
                          else handleRemoveItem(item.tempId);
                        }
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6>Item {index + 1} {item.isDeleted && <span className="badge bg-danger ms-2">Marked for Deletion</span>}</h6>
                        {!item.isDeleted ? (
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => handleRemoveItem(item.tempId)}
                            disabled={isLoading || isSubscriptionPaid === false}
                            title="Mark for Remove (Alt + Backspace)"
                          >
                            <i className="bi bi-x-lg"></i> Mark for Remove
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-outline-primary btn-sm fw-bold"
                            onClick={() => handleUndoRemoveItem(item.tempId)}
                            disabled={isLoading || isSubscriptionPaid === false}
                            title="Undo Remove (Alt + Backspace)"
                          >
                            <i className="bi bi-arrow-counterclockwise"></i> Undo Remove
                          </button>
                        )}
                      </div>
                      {!item.isDeleted && (
                        <div className="row g-2">
                          <div className="col-md-2">
                            <label className="form-label">Type</label>
                            <select
                              className="form-select"
                              value={item.item_type}
                              onChange={(e) => handleItemTypeChange(item.tempId, e.target.value as 'inventory' | 'composition')}
                              disabled={isLoading}
                            >
                              <option value="inventory">Inventory Item</option>
                              <option value="composition">Composition</option>
                            </select>
                          </div>
                          <div className="col-md-4">
                            <label htmlFor={`itemId-${item.tempId}`} className="form-label">
                              {item.item_type === 'inventory' ? 'Inventory Item' : 'Composition'}{" "}
                              <span className="form-field-required">*</span>
                            </label>
                            <div className="d-flex">
                              <StyledSelect
                                id={`itemId-${item.tempId}`}
                                className="me-2"
                                value={
                                  item.item_type === 'inventory'
                                    ? inventoryItemOptions.find((option) => option.value === item.inventory_item_id)
                                    : compositionOptions.find((option) => option.value === item.composition_id)
                                }
                                onChange={(option, _action) =>
                                  handleItemChange(
                                    item.tempId,
                                    item.item_type === 'inventory' ? "inventory_item_id" : "composition_id",
                                    option ? option.value : ""
                                  )
                                }
                                options={item.item_type === 'inventory' ? inventoryItemOptions : compositionOptions}
                                placeholder={item.item_type === 'inventory' ? "Select an Item" : "Select a Composition"}
                                isClearable
                                isLoading={isLoading}
                              />
                            </div>
                            {item.item_type === 'inventory' && inventoryItems.length === 0 && !isLoading && (
                              <div className="text-danger mt-1">No inventory items found. Please add items first.</div>
                            )}
                            {item.item_type === 'composition' && compositions.length === 0 && !isLoading && (
                              <div className="text-danger mt-1">No compositions found.</div>
                            )}
                          </div>
                          <div className="col-md-3">
                            <label htmlFor={`variantId-${item.tempId}`} className="form-label">
                              Variant
                            </label>
                            <StyledSelect
                              id={`variantId-${item.tempId}`}
                              value={selectedVariantOption}
                              onChange={(option, _action) => handleItemChange(item.tempId, 'variant_id', option ? option.value : '')}
                              options={variantOptions}
                              placeholder="Select Variant"
                              isClearable
                              isDisabled={item.item_type !== 'inventory' || !item.inventory_item_id || itemVariants.length === 0}
                            />
                          </div>
                          <div className="col-md-2">
                            <label htmlFor={`quantity-${item.tempId}`} className="form-label">Quantity <span className="form-field-required">*</span></label>
                            <input
                              type="number"
                              className="form-control"
                              id={`quantity-${item.tempId}`}
                              value={item.quantity || ''}
                              onChange={(e) => handleItemChange(item.tempId, 'quantity', Number(e.target.value))}
                              min="1"
                              required
                              disabled={isLoading}
                            />
                          </div>
                          <div className="col-md-2">
                            <label htmlFor={`pricePerUnit-${item.tempId}`} className="form-label">Price per Unit</label>
                            <input
                              type="number"
                              className="form-control"
                              id={`pricePerUnit-${item.tempId}`}
                              value={item.price_per_unit || ''}
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
                  )
                })}

                {items.filter(item => !item.isDeleted).length > 0 && (
                  <div className="col-12 text-end">
                    <h5>Grand Total: <strong>Rs. {grandTotal.toFixed(2)}</strong></h5>
                  </div>
                )}

                <div className="col-12 text-center">
                  <button
                    type="button"
                    id="add-item-btn"
                    className="btn btn-outline-primary btn-sm"
                    onClick={handleAddItem}
                    disabled={isLoading || isSubscriptionPaid === false}
                  >
                    <i className="bi bi-plus-circle me-1"></i> Add Item
                  </button>
                </div>

                <div className="col-12 mt-4">
                  <button
                    type="submit"
                    className="btn btn-primary me-2"
                    disabled={isLoading || isSubscriptionPaid === false}
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