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
  ({ item, onView, thresholds }) => {
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
      <div 
        className={`card mb-2 mt-2 border-top-0 border-end-0 border-start-0 border-bottom ${getCardBackground()}`}
        style={{ cursor: 'pointer', borderRadius: 0 }}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        onClick={() => onView(item.id)}
      >
        <div className="card-body p-2">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h6 className="mb-1">Name: {item.name}</h6>
              <div className="text-sm">
                <p className="mb-0">Unit: {item.unit}</p>
                
                <p className="mb-0">Quantity: {item.current_stock}</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }
);

export default InventoryItemCard;