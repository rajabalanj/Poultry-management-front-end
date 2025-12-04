import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import PageHeader from "../Layout/PageHeader";
import { businessPartnerApi } from "../../services/api";
import { BusinessPartner, BusinessPartnerUpdate } from "../../types/BusinessPartner";

const EditBusinessPartner: React.FC = () => {
  const { partner_id } = useParams<{ partner_id: string }>();
  const navigate = useNavigate();
  const [partner, setPartner] = useState<BusinessPartner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [isVendor, setIsVendor] = useState(false);
  const [isCustomer, setIsCustomer] = useState(false);

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
        setName(data.name);
        setContactName(data.contact_name);
        setPhone(data.phone);
        setAddress(data.address);
        setEmail(data.email || '');
        setIsVendor(data.is_vendor || false);
        setIsCustomer(data.is_customer || false);
      } catch (err: any) {
        console.error("Error fetching partner:", err);
        setError(err?.message || "Failed to load people for editing.");
        toast.error(err?.message || "Failed to load people for editing.");
      } finally {
        setLoading(false);
      }
    };

    fetchPartner();
  }, [partner_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!name.trim() || !contactName.trim() || !phone.trim() || !address.trim()) {
      toast.error('Please fill in all required fields (Name, Contact Name, Phone, Address).');
      setLoading(false);
      return;
    }

    if (!isVendor && !isCustomer) {
      toast.error('Please select at least one partner type (Vendor or Customer).');
      setLoading(false);
      return;
    }

    if (!partner_id) {
      toast.error('Partner ID is missing for update operation.');
      setLoading(false);
      return;
    }

    const updatedPartner: BusinessPartnerUpdate = {
      name,
      contact_name: contactName,
      phone,
      address,
      email: email || undefined,
      is_vendor: isVendor,
      is_customer: isCustomer,
    };

    try {
      await businessPartnerApi.updateBusinessPartner(Number(partner_id), updatedPartner);
      toast.success('People updated successfully!');
      navigate('/business-partners');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update people.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !partner) return <div className="text-center mt-5">Loading partner data...</div>;
  if (error) return <div className="text-center text-danger mt-5">{error}</div>;
  if (!partner) return <div className="text-center mt-5">People not found.</div>;

  return (
    <>
      <PageHeader title={`Edit Partner: ${partner.name}`} buttonVariant="secondary" buttonLabel="Back to List" buttonLink="/business-partners" buttonIcon="bi-arrow-left"/>
      <div className="container mt-4">
        <div className="card shadow-sm">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label htmlFor="partnerName" className="form-label">Partner Name <span className="form-field-required">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    id="partnerName"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="contactName" className="form-label">Contact Person <span className="form-field-required">*</span></label>
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
                  <label htmlFor="phone" className="form-label">Phone <span className="form-field-required">*</span></label>
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
                  <label htmlFor="address" className="form-label">Address <span className="form-field-required">*</span></label>
                  <textarea
                    className="form-control"
                    id="address"
                    rows={3}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                  ></textarea>
                </div>
                
                <div className="col-12">
                  <label className="form-label">People Type <span className="form-field-required">*</span></label>
                  <div className="d-flex gap-3">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="isVendor"
                        checked={isVendor}
                        onChange={(e) => setIsVendor(e.target.checked)}
                      />
                      <label className="form-check-label" htmlFor="isVendor">
                        Vendor (We buy from them)
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="isCustomer"
                        checked={isCustomer}
                        onChange={(e) => setIsCustomer(e.target.checked)}
                      />
                      <label className="form-check-label" htmlFor="isCustomer">
                        Customer (We sell to them)
                      </label>
                    </div>
                  </div>
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
                    onClick={() => navigate('/business-partners')}
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

export default EditBusinessPartner;