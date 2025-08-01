// src/components/PurchaseOrder/PurchaseOrderTable.tsx
import React, { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PurchaseOrderResponse } from "../../types/PurchaseOrder";
import PurchaseOrderCard from "./PurchaseOrderCard";

interface PurchaseOrderTableProps {
  purchaseOrders: PurchaseOrderResponse[];
  loading: boolean;
  error: string | null;
  onDelete: (id: number) => void;
}

const PurchaseOrderTable: React.FC<PurchaseOrderTableProps> = ({ purchaseOrders, loading, error, onDelete }) => {
  const navigate = useNavigate();

  const handleViewDetails = useCallback(
    (id: number) => {
      if (!id) {
        console.error("Purchase Order ID is required");
        return;
      }
      navigate(`/purchase-orders/${id}/details`);
    },
    [navigate]
  );

  const handleEdit = useCallback(
    (id: number) => {
      if (!id) {
        console.error("Purchase Order ID is required");
        return;
      }
      navigate(`/purchase-orders/${id}/edit`);
    },
    [navigate]
  );

  const poCards = useMemo(() => {
    return purchaseOrders.map((po) => (
      <PurchaseOrderCard
        key={po.id}
        po={po}
        onView={handleViewDetails}
        onEdit={handleEdit}
        onDelete={onDelete}
      />
    ));
  }, [purchaseOrders, handleViewDetails, handleEdit, onDelete]);

  if (loading) return <div className="text-center">Loading purchase orders...</div>;
  if (error) return <div className="text-center text-danger">{error}</div>;
  if (purchaseOrders.length === 0) return <div className="text-center">No purchase orders found</div>;

  return <div className="px-2">{poCards}</div>;
};

export default PurchaseOrderTable;