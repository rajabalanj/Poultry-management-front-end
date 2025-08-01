// src/components/Vendor/VendorTable.tsx
import React, { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { VendorResponse } from "../../types/Vendor";
import VendorCard from "./VendorCard"; // Import the VendorCard

interface VendorTableProps {
  vendors: VendorResponse[];
  loading: boolean;
  error: string | null;
  onDelete: (id: number) => void;
}

const VendorTable: React.FC<VendorTableProps> = ({ vendors, loading, error, onDelete }) => {
  const navigate = useNavigate();

  const handleViewDetails = useCallback(
    (id: number) => {
      if (!id) {
        console.error("Vendor ID is required");
        return;
      }
      navigate(`/vendors/${id}/details`);
    },
    [navigate]
  );

  const handleEdit = useCallback(
    (id: number) => {
      if (!id) {
        console.error("Vendor ID is required");
        return;
      }
      navigate(`/vendors/${id}/edit`);
    },
    [navigate]
  );

  const vendorCards = useMemo(() => {
    return vendors.map((vendor) => (
      <VendorCard
        key={vendor.id}
        vendor={vendor}
        onView={handleViewDetails}
        onEdit={handleEdit}
        onDelete={onDelete}
      />
    ));
  }, [vendors, handleViewDetails, handleEdit, onDelete]);

  if (loading) return <div className="text-center">Loading vendors...</div>;
  if (error) return <div className="text-center text-danger">{error}</div>;
  if (vendors.length === 0) return <div className="text-center">No vendors found</div>;

  return <div className="px-2">{vendorCards}</div>;
};

export default VendorTable;