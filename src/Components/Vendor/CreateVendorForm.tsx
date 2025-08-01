// src/components/Vendor/CreateVendorForm.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import PageHeader from '../Layout/PageHeader'; // Adjust path if necessary
import { vendorApi } from '../../services/api'; // Adjust path if necessary
import { VendorCreate } from '../../types/Vendor'; // Import VendorStatus

const CreateVendorForm: React.FC = () => {
    const [name, setName] = useState('');
    const [contactName, setContactName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Basic validation
        if (!name.trim() || !contactName.trim() || !phone.trim() || !address.trim()) {
            toast.error('Please fill in all required fields (Name, Contact Name, Phone, Address).');
            setIsLoading(false);
            return;
        }

        const newVendor: VendorCreate = {
            name,
            contact_name: contactName,
            phone,
            address,
            email: email || undefined, // Send undefined if empty string
        };

        try {
            await vendorApi.createVendor(newVendor);
            toast.success('Vendor created successfully!');
            navigate('/vendors'); // Navigate back to the vendor list
        } catch (error: any) {
            toast.error(error?.message || 'Failed to create vendor.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <PageHeader title="Create New Vendor" buttonVariant="secondary" buttonLabel="Back to List" buttonLink="/vendors" />
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
                                        placeholder="e.g., ABC Suppliers"
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
                                        placeholder="e.g., John Doe"
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
                                        placeholder="e.g., info@abc.com"
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
                                        placeholder="Full address of the vendor"
                                        required
                                    ></textarea>
                                </div>

                                <div className="col-12 mt-4">
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? 'Creating...' : 'Create Vendor'}
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

export default CreateVendorForm;