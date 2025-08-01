// src/components/Vendor/VendorCard.tsx
import React from "react";
import { VendorResponse } from "../../types/Vendor";

interface VendorCardProps {
  vendor: VendorResponse;
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

const VendorCard: React.FC<VendorCardProps> = React.memo(
  ({ vendor, onView, onEdit, onDelete }) => {
    return (
      <div className="card mb-2 mt-2 border shadow-sm">
        <div className="card-body p-2">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h6 className="mb-1">Name: {vendor.name}</h6>
              <div className="text-sm">
                <p className="mb-0">Contact: {vendor.contact_name} ({vendor.phone})</p>
                {/* {vendor.email && <p className="mb-0">Email: {vendor.email}</p>} */}
                <p className="mb-0">Address: {vendor.address}</p>
                {/* <p className="mb-0">Status: <span className={`badge ${vendor.status === 'Active' ? 'bg-success' : 'bg-warning'}`}>{vendor.status}</span></p> */}
              </div>
            </div>
            <div className="d-flex flex-column flex-md-row gap-2">
              <button
                className="btn btn-info btn-sm d-flex align-items-center justify-content-center"
                onClick={() => onView(vendor.id)}
                title="View Details"
                aria-label={`View Details for Vendor ${vendor.name}`}
              >
                <i className="bi bi-eye me-1"></i>
                <span className="text-sm">Details</span>
              </button>
              <button
                className="btn btn-success btn-sm d-flex align-items-center justify-content-center"
                onClick={() => onEdit(vendor.id)}
                title="Edit Vendor"
                aria-label={`Edit Vendor ${vendor.name}`}
              >
                <i className="bi bi-pencil-square me-1"></i>
                <span className="text-sm">Edit</span>
              </button>
              <button
                className="btn btn-danger btn-sm d-flex align-items-center justify-content-center"
                onClick={() => onDelete(vendor.id)}
                title="Delete Vendor"
                aria-label={`Delete Vendor ${vendor.name}`}
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

export default VendorCard;