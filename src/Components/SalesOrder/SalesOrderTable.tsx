// src/components/SalesOrder/SalesOrderTable.tsx
import React, { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { SalesOrderResponse } from "../../types/SalesOrder";
import { BusinessPartner } from "../../types/BusinessPartner";
import SalesOrderCard from "../SalesOrder/SalesOrderCard";

interface SalesOrderTableProps {
  salesOrders: SalesOrderResponse[];
  loading: boolean;
  error: string | null;
  onDelete: (id: number) => void;
  customers: BusinessPartner[];
  onAddPayment: (id: number) => void;
}

const SalesOrderTable: React.FC<SalesOrderTableProps> = ({ salesOrders, loading, error, onDelete, customers, onAddPayment }) => {
  const navigate = useNavigate();

  const handleViewDetails = useCallback(
    (id: number) => {
      if (!id) {
        console.error("Sales Order ID is required");
        return;
      }
      navigate(`/sales-orders/${id}/details`);
    },
    [navigate]
  );

  const handleEdit = useCallback(
    (id: number) => {
      if (!id) {
        console.error("Sales Order ID is required");
        return;
      }
      navigate(`/sales-orders/${id}/edit`);
    },
    [navigate]
  );

  const soCards = useMemo(() => {
    return salesOrders.map((so) => (
      <SalesOrderCard
        key={so.id}
        so={so}
  customers={customers}
        onView={handleViewDetails}
        onEdit={handleEdit}
        onDelete={onDelete}
        onAddPayment={onAddPayment}
      />
    ));
  }, [salesOrders, customers, handleViewDetails, handleEdit, onDelete, onAddPayment]); // Add customers to dependencies

  if (loading) return <div className="text-center">Loading sales orders...</div>;
  if (error) return <div className="text-center text-danger">{error}</div>;
  if (salesOrders.length === 0) return <div className="text-center">No sales orders found</div>;

  return <div className="px-2">{soCards}</div>;
};

export default SalesOrderTable;