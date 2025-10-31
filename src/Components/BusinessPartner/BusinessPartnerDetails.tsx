import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import PageHeader from "../Layout/PageHeader";
import { businessPartnerApi } from "../../services/api";
import { BusinessPartner } from "../../types/BusinessPartner";

const BusinessPartnerDetails: React.FC = () => {
  const { partner_id } = useParams<{ partner_id: string }>();
  const navigate = useNavigate();
  const [partner, setPartner] = useState<BusinessPartner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPartner = async () => {
      try {
        if (!partner_id) {
          setError("Partner ID is missing.");
          setLoading(false);
          return;
        }
        const data = await businessPartnerApi.getBusinessPartner(Number(partner_id));
        setPartner(data);
      } catch (err: any) {
        console.error("Error fetching partner:", err);
        setError(err?.message || "Failed to load people details.");
        toast.error(err?.message || "Failed to load people details.");
      } finally {
        setLoading(false);
      }
    };

    fetchPartner();
  }, [partner_id]);

  const getPartnerType = () => {
    if (!partner) return "";
    if (partner.is_vendor && partner.is_customer) return "Vendor & Customer";
    if (partner.is_vendor) return "Vendor";
    if (partner.is_customer) return "Customer";
    return "Partner";
  };

  const getTypeBadgeClass = () => {
    if (!partner) return "bg-secondary";
    if (partner.is_vendor && partner.is_customer) return "bg-info";
    if (partner.is_vendor) return "bg-primary";
    if (partner.is_customer) return "bg-success";
    return "bg-secondary";
  };

  if (loading) return <div className="text-center mt-5">Loading partner details...</div>;
  if (error) return <div className="text-center text-danger mt-5">{error}</div>;
  if (!partner) return <div className="text-center mt-5">People not found.</div>;

  return (
    <>
      <PageHeader title="People Details" buttonVariant="secondary" buttonLabel="Back to List" buttonLink="/business-partners" />
      <div className="container mt-4">
        <div className="card shadow-sm">
          <div className="card-header bg-primary text-white">
            <h4 className="mb-0">
              Partner Information: {partner.name}
              <span className={`badge ms-2 ${getTypeBadgeClass()}`}>
                {getPartnerType()}
              </span>
            </h4>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6 mb-3">
                <strong>Partner Name:</strong> {partner.name}
              </div>
              <div className="col-md-6 mb-3">
                <strong>Contact Person:</strong> {partner.contact_name}
              </div>
              <div className="col-md-6 mb-3">
                <strong>Phone:</strong> {partner.phone}
              </div>
              <div className="col-md-6 mb-3">
                <strong>Email:</strong> {partner.email || 'N/A'}
              </div>
              <div className="col-12 mb-3">
                <strong>Address:</strong> {partner.address}
              </div>
              <div className="col-md-6 mb-3">
                <strong>Status:</strong> 
                <span className={`badge ms-1 ${partner.status === 'Active' ? 'bg-success' : 'bg-warning'}`}>
                  {partner.status}
                </span>
              </div>
              <div className="col-md-6 mb-3">
                <strong>Partner Type:</strong>
                <span className={`badge ms-1 ${getTypeBadgeClass()}`}>
                  {getPartnerType()}
                </span>
              </div>
              <div className="col-md-6 mb-3">
                <strong>Created At:</strong> {new Date(partner.created_at).toLocaleString()}
              </div>
              {partner.updated_at && (
                <div className="col-md-6 mb-3">
                  <strong>Last Updated:</strong> {new Date(partner.updated_at).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 d-flex justify-content-center gap-3">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate(`/business-partners/${partner.id}/edit`)}
          >
            <i className="bi bi-pencil-square me-1"></i>
            Edit
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this business partner?')) {
                // Add delete functionality here
                businessPartnerApi.deleteBusinessPartner(Number(partner_id))
                  .then(() => {
                    toast.success('Business partner deleted successfully');
                    navigate('/business-partners');
                  })
                  .catch(err => {
                    toast.error('Failed to delete business partner: ' + err.message);
                  });
              }
            }}
          >
            <i className="bi bi-trash me-1"></i>
            Delete
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate(-1)}
          >
            Back
          </button>
        </div>
      </div>
    </>
  );
};

export default BusinessPartnerDetails;