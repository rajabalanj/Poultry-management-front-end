import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import PageHeader from '../Layout/PageHeader';
import { businessPartnerApi } from '../../services/api';
import { BusinessPartnerCreate, BusinessPartner } from '../../types/BusinessPartner';

interface CreateBusinessPartnerFormProps {
    onCreated?: (partner: BusinessPartner) => void;
    onCancel?: () => void;
    hideHeader?: boolean;
}

const CreateBusinessPartnerForm: React.FC<CreateBusinessPartnerFormProps> = ({ onCreated, onCancel, hideHeader }) => {
    const [name, setName] = useState('');
    const [contactName, setContactName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [email, setEmail] = useState('');
    const [isVendor, setIsVendor] = useState(false);
    const [isCustomer, setIsCustomer] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        if (!name.trim() || !contactName.trim() || !phone.trim() || !address.trim()) {
            toast.error('Please fill in all required fields (Name, Contact Name, Phone, Address).');
            setIsLoading(false);
            return;
        }

        if (!isVendor && !isCustomer) {
            toast.error('Please select at least one partner type (Vendor or Customer).');
            setIsLoading(false);
            return;
        }

        const newPartner: BusinessPartnerCreate = {
            name,
            contact_name: contactName,
            phone,
            address,
            email: email || undefined,
            is_vendor: isVendor,
            is_customer: isCustomer,
        };

        try {
            const created = await businessPartnerApi.createBusinessPartner(newPartner);
            toast.success('People created successfully!');
            if (onCreated) {
                onCreated(created);
            } else {
                navigate('/business-partners');
            }
        } catch (error: any) {
            toast.error(error?.message || 'Failed to create people.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {!hideHeader && (
              <PageHeader title="Create New People" buttonVariant="secondary" buttonLabel="Back to List" buttonLink="/business-partners" />
            )}
            <div className={hideHeader ? undefined : 'container mt-4'}>
                <div className="card shadow-sm">
                    <div className="card-body">
                        <form onSubmit={handleSubmit}>
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label htmlFor="partnerName" className="form-label">Partner Name <span className="text-danger">*</span></label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="partnerName"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g., ABC Company"
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
                                        placeholder="e.g., Jane Doe"
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
                                        placeholder="e.g., +91 9876543210"
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
                                        placeholder="e.g., info@company.com"
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
                                        placeholder="Full address of the partner"
                                        required
                                    ></textarea>
                                </div>
                                
                                <div className="col-12">
                                    <label className="form-label">Partner Type <span className="text-danger">*</span></label>
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
                                        disabled={isLoading}
                                    >
                                        {isLoading ? 'Creating...' : 'Create People'}
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-secondary ms-2"
                                        onClick={() => {
                                            if (onCancel) onCancel();
                                            else navigate('/business-partners');
                                        }}
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

export default CreateBusinessPartnerForm;