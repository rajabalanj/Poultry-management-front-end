// src/components/Vendor/VendorDetails.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import PageHeader from "../Layout/PageHeader"; // Adjust path if necessary
import { vendorApi } from "../../services/api"; // Adjust path if necessary
import { VendorResponse } from "../../types/Vendor"; // Import VendorResponse

const VendorDetails: React.FC = () => {
  const { vendor_id } = useParams<{ vendor_id: string }>();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState<VendorResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVendor = async () => {
      try {
        if (!vendor_id) {
            setError("Vendor ID is missing.");
            setLoading(false);
            return;
        }
        const data = await vendorApi.getVendor(Number(vendor_id));
        setVendor(data);
      } catch (err: any) {
        console.error("Error fetching vendor:", err);
        setError(err?.message || "Failed to load vendor details.");
        toast.error(err?.message || "Failed to load vendor details.");
      } finally {
        setLoading(false);
      }
    };

    fetchVendor();
  }, [vendor_id]);

  if (loading) return <div className="text-center mt-5">Loading vendor details...</div>;
  if (error) return <div className="text-center text-danger mt-5">{error}</div>;
  if (!vendor) return <div className="text-center mt-5">Vendor not found or data is missing.</div>;

  return (
    <>
      <PageHeader title="Vendor Details" buttonVariant="secondary" buttonLabel="Back to List" buttonLink="/vendors" />
      <div className="container mt-4">
        <div className="card shadow-sm">
          <div className="card-header bg-primary text-white">
            <h4 className="mb-0">Vendor Information: {vendor.name}</h4>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6 mb-3">
                <strong>Vendor Name:</strong> {vendor.name}
              </div>
              <div className="col-md-6 mb-3">
                <strong>Contact Person:</strong> {vendor.contact_name}
              </div>
              <div className="col-md-6 mb-3">
                <strong>Phone:</strong> {vendor.phone}
              </div>
              <div className="col-md-6 mb-3">
                <strong>Email:</strong> {vendor.email || 'N/A'}
              </div>
              <div className="col-12 mb-3">
                <strong>Address:</strong> {vendor.address}
              </div>
              <div className="col-md-6 mb-3">
                <strong>Status:</strong> <span className={`badge ${vendor.status === 'Active' ? 'bg-success' : 'bg-warning'}`}>{vendor.status}</span>
              </div>
              <div className="col-md-6 mb-3">
                <strong>Created At:</strong> {new Date(vendor.created_at).toLocaleString()}
              </div>
              {vendor.updated_at && (
                <div className="col-md-6 mb-3">
                  <strong>Last Updated:</strong> {new Date(vendor.updated_at).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 d-flex justify-content-center gap-3">
          <button
            type="button"
            className="btn btn-info"
            onClick={() => navigate(`/vendors/${vendor.id}/purchase-history`)} // Link to purchase history
          >
            View Purchase History
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate(-1)} // Go back to the previous page
          >
            Back
          </button>
        </div>
      </div>
    </>
  );
};

export default VendorDetails;