// src/components/Vendor/EditVendor.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import PageHeader from "../Layout/PageHeader"; // Adjust path if necessary
import { vendorApi } from "../../services/api"; // Adjust path if necessary
import { VendorResponse, VendorUpdate } from "../../types/Vendor"; // Import VendorStatus

const EditVendor: React.FC = () => {
  const { vendor_id } = useParams<{ vendor_id: string }>();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState<VendorResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // States for form fields
  const [name, setName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');

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
        // Initialize form states with fetched data
        setName(data.name);
        setContactName(data.contact_name);
        setPhone(data.phone);
        setAddress(data.address);
        setEmail(data.email || '');
      } catch (err: any) {
        console.error("Error fetching vendor:", err);
        setError(err?.message || "Failed to load vendor for editing.");
        toast.error(err?.message || "Failed to load vendor for editing.");
      } finally {
        setLoading(false);
      }
    };

    fetchVendor();
  }, [vendor_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); // Reuse loading state for update operation

    // Basic validation
    if (!name.trim() || !contactName.trim() || !phone.trim() || !address.trim()) {
        toast.error('Please fill in all required fields (Name, Contact Name, Phone, Address).');
        setLoading(false);
        return;
    }

    if (!vendor_id) {
        toast.error('Vendor ID is missing for update operation.');
        setLoading(false);
        return;
    }

    const updatedVendor: VendorUpdate = {
        name,
        contact_name: contactName,
        phone,
        address,
        email: email || undefined, // Send undefined if empty string
    };

    try {
        await vendorApi.updateVendor(Number(vendor_id), updatedVendor);
        toast.success('Vendor updated successfully!');
        navigate('/vendors'); // Navigate back to the vendor list
    } catch (error: any) {
        toast.error(error?.message || 'Failed to update vendor.');
    } finally {
        setLoading(false);
    }
  };

  if (loading && !vendor) return <div className="text-center mt-5">Loading vendor data...</div>;
  if (error) return <div className="text-center text-danger mt-5">{error}</div>;
  if (!vendor) return <div className="text-center mt-5">Vendor not found.</div>; // Should ideally not happen if error is handled

  return (
    <>
      <PageHeader title={`Edit Vendor: ${vendor.name}`} buttonVariant="secondary" buttonLabel="Back to List" buttonLink="/vendors" />
      <div className="container mt-4">
        <div className="card shadow-sm">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label htmlFor="vendorName" className="form-label">Vendor Name <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    id="vendorName"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="contactName" className="form-label">Contact Person <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    id="contactName"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="phone" className="form-label">Phone <span className="text-danger">*</span></label>
                  <input
                    type="tel"
                    className="form-control"
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="email" className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="col-12">
                  <label htmlFor="address" className="form-label">Address <span className="text-danger">*</span></label>
                  <textarea
                    className="form-control"
                    id="address"
                    rows={3}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                  ></textarea>
                </div>

                <div className="col-12 mt-4">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary ms-2"
                    onClick={() => navigate('/vendors')}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditVendor;