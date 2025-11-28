// src/components/PurchaseOrder/PurchaseOrderTable.tsx
import React, { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PurchaseOrderResponse } from "../../types/PurchaseOrder";
import { BusinessPartner } from "../../types/BusinessPartner";
import PurchaseOrderCard from "./PurchaseOrderCard";

interface PurchaseOrderTableProps {
  purchaseOrders: PurchaseOrderResponse[];
  loading: boolean;
  error: string | null;
  onDelete?: (id: number) => void;
  vendors: BusinessPartner[];
  onAddPayment?: (id: number) => void;
}

const PurchaseOrderTable: React.FC<PurchaseOrderTableProps> = ({ purchaseOrders, loading, error, onDelete, vendors, onAddPayment }) => {
  const navigate = useNavigate();

  const handleViewDetails = useCallback(
    (id: number) => {
      if (!id) {
        console.error("Purchase ID is required");
        return;
      }
      navigate(`/purchase-orders/${id}/details`);
    },
    [navigate]
  );

  const handleEdit = useCallback(
    (id: number) => {
      if (!id) {
        console.error("Purchase ID is required");
        return;
      }
      navigate(`/purchase-orders/${id}/edit`);
    },
    [navigate]
  );

  const poCards = useMemo(() => {
    return purchaseOrders.map((Purchase) => (
      <PurchaseOrderCard
        key={Purchase.id}
        Purchase={Purchase}
  vendors={vendors}
        onView={handleViewDetails}
        onEdit={handleEdit}
        onDelete={onDelete}
        onAddPayment={onAddPayment}
      />
    ));
  }, [purchaseOrders, vendors, handleViewDetails, handleEdit, onDelete, onAddPayment]); // Add vendors to dependencies

  if (loading) return <div className="text-center">Loading Purchase...</div>;
  if (error) return <div className="text-center text-danger">{error}</div>;
  if (purchaseOrders.length === 0) return <div className="text-center">No Purchase found</div>;

  return <div className="px-2">{poCards}</div>;
};

export default PurchaseOrderTable;