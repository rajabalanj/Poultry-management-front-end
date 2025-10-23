
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { ledgerApi, businessPartnerApi } from '../../services/api';
import { PurchaseLedger } from '../../types/ledgers';
import Loading from '../Common/Loading';
import { BusinessPartner } from '../../types/BusinessPartner';

const PurchaseLedgerComponent: React.FC = () => {
    const [vendorId, setVendorId] = useState('');
    const [ledgerData, setLedgerData] = useState<PurchaseLedger | null>(null);
    const [loading, setLoading] = useState(false);
    const [vendors, setVendors] = useState<BusinessPartner[]>([]);

    useEffect(() => {
        const fetchVendors = async () => {
            try {
                const vendorsData = await businessPartnerApi.getVendors();
                setVendors(vendorsData);
            } catch (error) {
                toast.error('Failed to fetch vendors.');
            }
        };
        fetchVendors();
    }, []);

    const handleFetchLedger = async () => {
        if (!vendorId) {
            toast.error('Please enter a Vendor ID.');
            return;
        }
        setLoading(true);
        setLedgerData(null);
        try {
            const data = await ledgerApi.getPurchaseLedger(parseInt(vendorId, 10));
            setLedgerData(data);
        } catch (error: any) {
            toast.error(error.message || 'Failed to fetch Purchase Ledger.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="row g-3 align-items-end p-3 border-bottom">
                <div className="col-md-8">
                    <label htmlFor="vendorId" className="form-label">Vendor ID</label>
                    <select
                        id="vendorId"
                        className="form-select"
                        value={vendorId}
                        onChange={(e) => setVendorId(e.target.value)}
                    >
                        <option value="">Select a Vendor</option>
                        {vendors.map((vendor) => (
                            <option key={vendor.id} value={vendor.id}>
                                {vendor.id} - {vendor.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="col-md-4">
                    <button className="btn btn-primary w-100 mb-2" onClick={handleFetchLedger} disabled={loading}>
                        {loading ? 'Generating...' : 'Get Purchase Ledger'}
                    </button>
                </div>
            </div>
            {loading && <Loading message="Loading data..." />}
            {ledgerData && (
                <div className="p-3">
                    <h4 className="mb-3">{ledgerData.title}</h4>
                    <p className="text-muted">Vendor ID: {ledgerData.vendor_id}</p>
                    <div className="table-responsive">
                        <table className="table table-striped">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Vendor Name</th>
                                    <th>Invoice Number</th>
                                    <th>Description</th>
                                    <th>Amount</th>
                                    <th>Amount Paid</th>
                                    <th>Balance Amount</th>
                                    <th>Payment Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ledgerData.entries.map((entry, index) => (
                                    <tr key={index}>
                                        <td>{entry.date}</td>
                                        <td>{entry.vendor_name}</td>
                                        <td>{entry.invoice_number}</td>
                                        <td>{entry.description}</td>
                                        <td>{entry.amount.toFixed(2)}</td>
                                        <td>{entry.amount_paid.toFixed(2)}</td>
                                        <td>{entry.balance_amount.toFixed(2)}</td>
                                        <td>{entry.payment_status}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PurchaseLedgerComponent;
