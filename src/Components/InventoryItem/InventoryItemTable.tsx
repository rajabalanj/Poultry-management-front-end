// src/components/InventoryItem/InventoryItemTable.tsx
import React, { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { InventoryItemResponse } from "../../types/InventoryItem";
import InventoryItemCard from "./InventoryItemCard";

interface InventoryItemTableProps {
  items: InventoryItemResponse[];
  loading: boolean;
  error: string | null;
  onDelete: (id: number) => void;
}

const InventoryItemTable: React.FC<InventoryItemTableProps> = ({ items, loading, error, onDelete }) => {
  const navigate = useNavigate();

  const handleViewDetails = useCallback(
    (id: number) => {
      if (!id) {
        console.error("Inventory Item ID is required");
        return;
      }
      navigate(`/inventory-items/${id}/details`);
    },
    [navigate]
  );

  const handleEdit = useCallback(
    (id: number) => {
      if (!id) {
        console.error("Inventory Item ID is required");
        return;
      }
      navigate(`/inventory-items/${id}/edit`);
    },
    [navigate]
  );

  const itemCards = useMemo(() => {
    return items.map((item) => (
      <InventoryItemCard
        key={item.id}
        item={item}
        onView={handleViewDetails}
        onEdit={handleEdit}
        onDelete={onDelete}
      />
    ));
  }, [items, handleViewDetails, handleEdit, onDelete]);

  if (loading) return <div className="text-center">Loading inventory items...</div>;
  if (error) return <div className="text-center text-danger">{error}</div>;
  if (items.length === 0) return <div className="text-center">No inventory items found</div>;

  return <div className="px-2">{itemCards}</div>;
};

export default InventoryItemTable;