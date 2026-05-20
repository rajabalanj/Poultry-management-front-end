import React, { useCallback, useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BusinessPartner } from "../../types/BusinessPartner";
import BusinessPartnerCard from "./BusinessPartnerCard";
import CustomPagination from "../Common/CustomPagination";

interface BusinessPartnerTableProps {
  partners: BusinessPartner[];
  loading: boolean;
  error: string | null;
}

const BusinessPartnerTable: React.FC<BusinessPartnerTableProps> = ({ partners, loading, error }) => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  useEffect(() => {
    setCurrentPage(1);
  }, [partners]);

  const totalPages = Math.ceil(partners.length / ITEMS_PER_PAGE);
  const paginatedPartners = partners.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

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

  const partnerCards = useMemo(() => {
    return paginatedPartners.map((partner) => (
      <BusinessPartnerCard
        key={partner.id}
        partner={partner}
        onView={handleViewDetails}
      />
    ));
  }, [paginatedPartners, handleViewDetails]);

  if (loading) return <div className="text-center">Loading business partners...</div>;
  if (error) return <div className="text-center text-danger">{error}</div>;
  if (partners.length === 0) return <div className="text-center">No business partners found</div>;

  return (
    <div className="px-2">
      {partnerCards}
      <CustomPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </div>
  );
};

export default BusinessPartnerTable;