import React from "react";
import { BusinessPartner } from "../../types/BusinessPartner";

interface BusinessPartnerCardProps {
  partner: BusinessPartner;
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

const BusinessPartnerCard: React.FC<BusinessPartnerCardProps> = React.memo(
  ({ partner, onView}) => {
    const getPartnerType = () => {
      if (partner.is_vendor && partner.is_customer) return "Vendor & Customer";
      if (partner.is_vendor) return "Vendor";
      if (partner.is_customer) return "Customer";
      return "Partner";
    };

    const getTypeBadgeClass = () => {
      if (partner.is_vendor && partner.is_customer) return "bg-info";
      if (partner.is_vendor) return "bg-primary";
      if (partner.is_customer) return "bg-success";
      return "bg-secondary";
    };

    return (
      <div 
        className="card mb-2 mt-2 border-top-0 border-end-0 border-start-0 border-bottom"
        style={{ cursor: 'pointer', borderRadius: 0 }}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        onClick={() => onView(partner.id)}
      >
        <div className="card-body p-2">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h6 className="mb-1">
                {partner.name}
                <span className={`badge ms-2 ${getTypeBadgeClass()}`}>
                  {getPartnerType()}
                </span>
              </h6>
              <div className="text-sm">
                <p className="mb-0">Contact: {partner.contact_name} ({partner.phone})</p>
                <p className="mb-0">Address: {partner.address}</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }
);

export default BusinessPartnerCard;