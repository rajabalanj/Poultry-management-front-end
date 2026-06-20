import React, { useCallback, useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { BusinessPartner } from "../../types/BusinessPartner";
import BusinessPartnerCard from "./BusinessPartnerCard";
import CustomPagination from "../Common/CustomPagination";
import { useTableKeyboardNavigation } from "../../hooks/useTableKeyboardNavigation";
import KeyboardShortcutsIndicator from "../Common/KeyboardShortcutsIndicator";

interface BusinessPartnerTableProps {
  partners: BusinessPartner[];
  loading: boolean;
  error: string | null;
}

const BusinessPartnerTable: React.FC<BusinessPartnerTableProps> = ({ partners, loading, error }) => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  
  // Keyboard navigation state
  const [focusedRowIndex, setFocusedRowIndex] = useState<number>(-1);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  
  // Keyboard navigation hook
  const { resetSelection, setSelectedIndex } = useTableKeyboardNavigation({
    rowCount: paginatedPartners.length,
    containerRef: tableContainerRef,
    onRowSelect: (index) => {
      setFocusedRowIndex(index);
    },
    onRowEnter: (index) => {
      const partner = paginatedPartners[index];
      if (partner) {
        handleViewDetails(partner.id);
      }
    },
    enabled: !loading && paginatedPartners.length > 0,
  });

  useEffect(() => {
    setCurrentPage(1);
    resetSelection();
    setFocusedRowIndex(-1);
  }, [partners, resetSelection]);

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
    return paginatedPartners.map((partner, index) => (
      <BusinessPartnerCard
        key={partner.id}
        partner={partner}
        onView={handleViewDetails}
        isFocused={focusedRowIndex === index}
        index={index}
        setSelectedIndex={setSelectedIndex}
      />
    ));
  }, [paginatedPartners, handleViewDetails, focusedRowIndex, setSelectedIndex]);

  if (loading) return <div className="text-center">Loading business partners...</div>;
  if (error) return <div className="text-center text-danger">{error}</div>;
  if (partners.length === 0) return <div className="text-center">No business partners found</div>;

  return (
    <div className="px-2" ref={tableContainerRef}>
      <KeyboardShortcutsIndicator />
      {partnerCards}
      <CustomPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </div>
  );
};

export default BusinessPartnerTable;