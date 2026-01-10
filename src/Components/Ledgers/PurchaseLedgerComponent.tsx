
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { ledgerApi, businessPartnerApi } from '../../services/api';
import { PurchaseLedger } from '../../types/ledgers';
import Loading from '../Common/Loading';
import { BusinessPartner } from '../../types/BusinessPartner';
import StyledSelect from '../Common/StyledSelect';

type OptionType = { value: string; label: string };

const PurchaseLedgerComponent: React.FC = () => {
    const [vendorId, setVendorId] = useState('');
    const [ledgerData, setLedgerData] = useState<PurchaseLedger | null>(null);
    const [loading, setLoading] = useState(false);
    const [vendors, setVendors] = useState<BusinessPartner[]>([]);
    const navigate = useNavigate();

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

    const handleRowClick = (entry: PurchaseLedger['entries'][0]) => {
        navigate(`/purchase-orders/${(entry as any).po_id}/details`);
    };

    const vendorOptions: OptionType[] = vendors.map((vendor) => ({
        value: String(vendor.id),
        label: `${vendor.id} - ${vendor.name}`,
    }));
    const selectedVendorOption = vendorOptions.find(option => option.value === vendorId);

    return (
        <div>
            <div className="row g-3 align-items-end p-3 border-bottom">
                <div className="col-md-4">
                    <label htmlFor="vendorId" className="form-label">Vendor ID</label>
                    <StyledSelect
                        id="vendorId"
                        value={selectedVendorOption}
                        onChange={(option, _action) => setVendorId(option ? String(option.value) : '')}
                        options={vendorOptions}
                        placeholder="Select a Vendor"
                    />
                </div>
                <div className="col-md-4 d-flex justify-content-center justify-content-md-end">
                    <button className="btn btn-primary mb-2" onClick={handleFetchLedger} disabled={loading}>
                        {loading ? 'Generating...' : 'Get Purchase Ledger'}
                    </button>
                </div>
            </div>
            {loading && <Loading message="Loading data..." />}
            {ledgerData && (
                <div className="p-3">
                    <h5 className="mb-3">{ledgerData.title}</h5>
                    <p className="text-muted">Vendor ID: {ledgerData.vendor_id}</p>
                    <div className="table-responsive">
                        <table className="table table-striped table-hover">
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
                                    <tr key={index} onClick={() => handleRowClick(entry)} style={{ cursor: 'pointer' }}>
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
