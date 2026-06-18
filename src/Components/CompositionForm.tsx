import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { InventoryItemResponse } from '../types/InventoryItem';
import { InventoryItemInComposition } from '../types/compositon';
import { useSubscription } from './context/SubscriptionContext';
import SubscriptionWarning from './Common/SubscriptionWarning';
import CustomPagination from './Common/CustomPagination';
import { useShortcuts } from './context/KeyboardShortcutContext';

interface CompositionFormProps {
  title: string;
  initialCompName?: string;
  onCompNameChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  wastagePercentage?: number | string;
  onWastagePercentageChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  search: string;
  handleItemSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
  filteredItems: InventoryItemResponse[];
  editItems: InventoryItemInComposition[];
  items: InventoryItemResponse[];
  handleAddItem: (item: InventoryItemResponse) => void;
  handleRemoveItem: (item_id: number) => void;
  handleItemWeightChange: (item_id: number, weight: number | string) => void;
  handleItemWastageChange: (item_id: number, wastage: number | string) => void;
  onSave: () => void;
  saveButtonLabel: string;
  onCancel: () => void;
  onOpenCreateItem?: () => void;
}

function CompositionForm({
  title,
  initialCompName,
  onCompNameChange,
  wastagePercentage,
  onWastagePercentageChange,
  search,
  handleItemSearch,
  filteredItems,
  editItems,
  items,
  handleAddItem,
  handleRemoveItem,
  handleItemWeightChange,
  handleItemWastageChange,
  onSave,
  saveButtonLabel,
  onCancel,
  onOpenCreateItem,
}: CompositionFormProps) {
  const { isSubscriptionPaid } = useSubscription();
  const { registerShortcuts } = useShortcuts();
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Pagination logic
  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 when search changes
  useEffect(() => setCurrentPage(1), [search]);

  const handlersRef = useRef({ onSave, onCancel });
  useLayoutEffect(() => {
    handlersRef.current = { onSave, onCancel };
  });

  useEffect(() => {
    const formShortcuts = [
      {
        key: '/',
        description: 'Focus Search Items',
        category: 'Form Actions',
        action: () => {
          searchInputRef.current?.focus();
        }
      },
      {
        key: 'Alt+s',
        description: saveButtonLabel,
        category: 'Form Actions',
        action: () => {
          handlersRef.current.onSave();
        }
      },
      {
        key: 'Escape',
        description: 'Cancel',
        category: 'Form Actions',
        action: () => {
          handlersRef.current.onCancel();
        }
      }
    ];

    return registerShortcuts(formShortcuts);
  }, [registerShortcuts, saveButtonLabel]);

  // Filter items out that are already in the composition, then paginate
  const availableItems = filteredItems.filter((i) => !editItems.some((ei) => ei.inventory_item_id === i.id));
  const totalPages = Math.ceil(availableItems.length / ITEMS_PER_PAGE);
  const paginatedAvailableItems = availableItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="card shadow-sm mb-4">
      <SubscriptionWarning />
      <div className="card-header bg-primary text-white">
        <h5 className="mb-0">{title}</h5>
      </div>
      <div className="card-body">
      <div className="row">
        <div className="mb-3 col-12 col-md-6">
          {initialCompName !== undefined && onCompNameChange && (
            <div className="d-flex gap-2 mb-2">
              <div className="flex-grow-1">
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Composition Name"
                  value={initialCompName}
                  onChange={onCompNameChange}
                />
              </div>
              <div style={{ width: '120px' }}>
                <input
                  type="number"
                  className="form-control form-control-sm"
                  placeholder="Wastage %"
                  value={wastagePercentage ?? ''}
                  onChange={onWastagePercentageChange}
                  title="Overall Wastage Percentage"
                />
              </div>
            </div>
          )}
          <div className="card mb-3">
            <ul className="list-group list-group-flush">
            {editItems.map((i) => {
              const item = items.find((fd) => fd.id === i.inventory_item_id);
              if (!item) return null;
              return (
                <li
                  key={i.inventory_item_id}
                  className="list-group-item d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center"
                >
                  <span className="mb-2 mb-sm-0">{item.name}</span>
                  <div className="d-flex align-items-center gap-2 flex-nowrap">
                    <input
                      type="number"
                      className="form-control form-control-sm text-center"
                      value={i.weight ?? ''}
                      min={0}
                      onChange={(e) =>
                        handleItemWeightChange(i.inventory_item_id, e.target.value)
                      }
                      style={{ width: '60px' }}
                    />
                    <span className="text-muted">kg</span>
                    <input
                      type="number"
                      className="form-control form-control-sm text-center"
                      value={i.wastage_percentage ?? ''}
                      min={0}
                      onChange={(e) =>
                        handleItemWastageChange(i.inventory_item_id, e.target.value)
                      }
                      style={{ width: '70px' }}
                    />
                    <span className="text-muted">% was</span>
                    <button
                      onClick={() => handleRemoveItem(i.inventory_item_id)}
                      className="btn btn-sm btn-danger flex-shrink-0"
                      title="Remove Item"
                      disabled={isSubscriptionPaid === false}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </li>
              );
            })}
            </ul>
          </div>
        </div>
        <div className="mb-3 col-12 col-md-6">
          <div className="d-flex gap-2 align-items-center mb-2">
            <input
              ref={searchInputRef}
              type="text"
              className="form-control form-control-sm"
              placeholder="Search Items..."
              value={search}
              onChange={handleItemSearch}
            />
            {onOpenCreateItem && (
              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                onClick={onOpenCreateItem}
                title="Create Item"
                disabled={isSubscriptionPaid === false}
              >
                <i className="bi bi-plus-lg"></i>
              </button>
            )}
          </div>
          <div className="card d-flex flex-column" style={{ height: '240px' }}>
            <div
              className="list-group list-group-flush"
              style={{ overflowY: 'auto', flexGrow: 1 }}
            >
            {paginatedAvailableItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleAddItem(item)}
                  className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${
                    editItems.some((ei) => ei.inventory_item_id === item.id) ? 'disabled' : ''
                  }`}
                  disabled={editItems.some((ei) => ei.inventory_item_id === item.id) || isSubscriptionPaid === false}
                >
                  {item.name}
                  <i className="bi bi-plus-circle-fill text-success"></i>
                </button>
              ))}
          </div>
          {totalPages > 1 && (
            <div className="card-footer bg-white d-flex justify-content-center border-top py-2">
          <CustomPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            className="mb-0"
            size="sm"
          />
            </div>
          )}
        </div>
      </div>
      <div className="d-flex gap-2 mt-3">
        <button onClick={onSave} className="btn btn-primary" disabled={isSubscriptionPaid === false}>
          <i className="bi bi-save me-1"></i>{saveButtonLabel}
        </button>
        <button onClick={onCancel} className="btn btn-secondary">
          <i className="bi bi-x-lg me-1"></i>Cancel
        </button>
      </div>
      </div>
      </div>
    </div>
  );
}

export default CompositionForm;