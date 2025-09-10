import React from "react";
import { InventoryItemResponse, InventoryItemCategory } from "../../types/InventoryItem";

interface InventoryItemCardProps {
  item: InventoryItemResponse;
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  thresholds: {
    lowKgThreshold: number;
    medicineLowKgThreshold: number;
  };
}

const InventoryItemCard: React.FC<InventoryItemCardProps> = React.memo(
  ({ item, onView, onEdit, onDelete, thresholds }) => {
    const getCardBackground = () => {
      const currentStock = parseFloat(String(item.current_stock));
      const reorderLevel = item.reorder_level ? parseFloat(String(item.reorder_level)) : 0;

      if (reorderLevel > 0) {
        if (currentStock < reorderLevel) {
          return "bg-danger-subtle";
        }
      } else {
        if (item.category === InventoryItemCategory.FEED && currentStock < thresholds.lowKgThreshold) {
          return "bg-danger-subtle";
        }
        if (item.category === InventoryItemCategory.MEDICINE && currentStock < thresholds.medicineLowKgThreshold) {
          return "bg-danger-subtle";
        }
      }
      return "";
    };

    return (
      <div className={`card mb-2 mt-2 border shadow-sm ${getCardBackground()}`}>
        <div className="card-body p-2">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h6 className="mb-1">Name: {item.name}</h6>
              <div className="text-sm">
                <p className="mb-0">Unit: {item.unit}</p>
                
                <p className="mb-0">Quantity: {item.current_stock}</p>
              </div>
            </div>
            <div className="d-flex flex-column flex-md-row gap-2">
              <button
                className="btn btn-primary btn-sm d-flex align-items-center justify-content-center"
                onClick={() => onView(item.id)}
                title="View Details"
                aria-label={`View Details for ${item.name}`}
              >
                <i className="bi bi-eye me-1"></i>
                <span className="text-sm">Details</span>
              </button>
              <button
                className="btn btn-success btn-sm d-flex align-items-center justify-content-center"
                onClick={() => onEdit(item.id)}
                title="Edit Item"
                aria-label={`Edit ${item.name}`}
              >
                <i className="bi bi-pencil-square me-1"></i>
                <span className="text-sm">Edit</span>
              </button>
              <button
                className="btn btn-danger btn-sm d-flex align-items-center justify-content-center"
                onClick={() => onDelete(item.id)}
                title="Delete Item"
                aria-label={`Delete ${item.name}`}
              >
                <i className="bi bi-trash me-1"></i>
                <span className="text-sm">Delete</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default InventoryItemCard;