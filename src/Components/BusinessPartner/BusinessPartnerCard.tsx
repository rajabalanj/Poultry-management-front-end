import React from "react";
import { BusinessPartner } from "../../types/BusinessPartner";

interface BusinessPartnerCardProps {
  partner: BusinessPartner;
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

const BusinessPartnerCard: React.FC<BusinessPartnerCardProps> = React.memo(
  ({ partner, onView, onEdit, onDelete }) => {
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
      <div className="card mb-2 mt-2 border shadow-sm">
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
            <div className="d-flex flex-column flex-md-row gap-2">
              <button
                className="btn btn-primary btn-sm d-flex align-items-center justify-content-center"
                onClick={() => onView(partner.id)}
                title="View Details"
              >
                <i className="bi bi-eye me-1"></i>
                <span className="text-sm">Details</span>
              </button>
              <button
                className="btn btn-success btn-sm d-flex align-items-center justify-content-center"
                onClick={() => onEdit(partner.id)}
                title="Edit Partner"
              >
                <i className="bi bi-pencil-square me-1"></i>
                <span className="text-sm">Edit</span>
              </button>
              <button
                className="btn btn-danger btn-sm d-flex align-items-center justify-content-center"
                onClick={() => onDelete(partner.id)}
                title="Delete Partner"
              >
                <i className="bi bi-trash me-1"></i>
                <span className="text-sm">Delete</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default BusinessPartnerCard;