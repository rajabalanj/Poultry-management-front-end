import React from 'react';
import { InventoryItemResponse } from '../types/InventoryItem';
import { InventoryItemInComposition } from '../types/compositon';

interface CompositionFormProps {
  title: string;
  initialCompName?: string;
  onCompNameChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  search: string;
  handleItemSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
  filteredItems: InventoryItemResponse[];
  editItems: InventoryItemInComposition[];
  items: InventoryItemResponse[];
  handleAddItem: (item: InventoryItemResponse) => void;
  handleRemoveItem: (item_id: number) => void;
  handleItemWeightChange: (item_id: number, weight: number) => void;
  onSave: () => void;
  saveButtonLabel: string;
  onCancel: () => void;
  onOpenCreateItem?: () => void;
}

function CompositionForm({
  title,
  initialCompName,
  onCompNameChange,
  search,
  handleItemSearch,
  filteredItems,
  editItems,
  items,
  handleAddItem,
  handleRemoveItem,
  handleItemWeightChange,
  onSave,
  saveButtonLabel,
  onCancel,
  onOpenCreateItem,
}: CompositionFormProps) {
  return (
    <div className="card shadow-sm mb-4">
      <div className="card-header bg-primary text-white">
        <h5 className="mb-0">{title}</h5>
      </div>
      <div className="card-body">
      <div className="row">
        <div className="mb-3 col-12 col-md-6">
        {initialCompName !== undefined && onCompNameChange && (
            <input
              type="text"
              className="form-control form-control-sm mb-2"
              placeholder="Composition Name"
              value={initialCompName}
              onChange={onCompNameChange}
            />
          )}
          <div className="card mb-3">
            <ul className="list-group list-group-flush">
            {editItems.map((i) => {
              const item = items.find((fd) => fd.id === i.inventory_item_id);
              if (!item) return null;
              return (
                <li
                  key={i.inventory_item_id}
                  className="list-group-item d-flex justify-content-between align-items-center"
                >
                  <span>{item.name}</span>
                  <div className="d-flex align-items-center gap-2 flex-nowrap">
                    <input
                      type="number"
                      className="form-control form-control-sm text-center"
                      value={i.weight}
                      min={0}
                      onChange={(e) =>
                        handleItemWeightChange(i.inventory_item_id, Number(e.target.value))
                      }
                      style={{ width: '60px' }}
                    />
                    <span className="text-muted">kg</span>
                    <button
                      onClick={() => handleRemoveItem(i.inventory_item_id)}
                      className="btn btn-sm btn-danger flex-shrink-0"
                      title="Remove Item"
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
              >
                <i className="bi bi-plus-lg"></i>
              </button>
            )}
          </div>
          <div className="card" style={{ maxHeight: '200px' }}>
            <div
              className="list-group list-group-flush"
              style={{ maxHeight: '150px', overflowY: 'auto' }}
            >
            {filteredItems
              .filter((i) => !editItems.some((ei) => ei.inventory_item_id === i.id))
              .map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleAddItem(item)}
                  className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${
                    editItems.some((ei) => ei.inventory_item_id === item.id) ? 'disabled' : ''
                  }`}
                  disabled={editItems.some((ei) => ei.inventory_item_id === item.id)}
                >
                  {item.name}
                  <i className="bi bi-plus-circle-fill text-success"></i>
                </button>
              ))}
          </div>
        </div>
      </div>
      <div className="d-flex gap-2 mt-3">
        <button onClick={onSave} className="btn btn-primary">
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