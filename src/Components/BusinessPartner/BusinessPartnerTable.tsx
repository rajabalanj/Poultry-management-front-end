import React, { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { BusinessPartner } from "../../types/BusinessPartner";
import BusinessPartnerCard from "./BusinessPartnerCard";

interface BusinessPartnerTableProps {
  partners: BusinessPartner[];
  loading: boolean;
  error: string | null;
  onDelete: (id: number) => void;
}

const BusinessPartnerTable: React.FC<BusinessPartnerTableProps> = ({ partners, loading, error, onDelete }) => {
  const navigate = useNavigate();

  const handleViewDetails = useCallback(
    (id: number) => {
      if (!id) {
        console.error("Partner ID is required");
        return;
      }
      navigate(`/business-partners/${id}/details`);
    },
    [navigate]
  );

  const handleEdit = useCallback(
    (id: number) => {
      if (!id) {
        console.error("Partner ID is required");
        return;
      }
      navigate(`/business-partners/${id}/edit`);
    },
    [navigate]
  );

  const partnerCards = useMemo(() => {
    return partners.map((partner) => (
      <BusinessPartnerCard
        key={partner.id}
        partner={partner}
        onView={handleViewDetails}
        onEdit={handleEdit}
        onDelete={onDelete}
      />
    ));
  }, [partners, handleViewDetails, handleEdit, onDelete]);

  if (loading) return <div className="text-center">Loading business partners...</div>;
  if (error) return <div className="text-center text-danger">{error}</div>;
  if (partners.length === 0) return <div className="text-center">No business partners found</div>;

  return <div className="px-2">{partnerCards}</div>;
};

export default BusinessPartnerTable;