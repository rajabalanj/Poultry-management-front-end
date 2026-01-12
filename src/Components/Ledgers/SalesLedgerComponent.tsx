
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { ledgerApi, businessPartnerApi } from '../../services/api';
import { SalesLedger } from '../../types/ledgers';
import Loading from '../Common/Loading';
import { BusinessPartner } from '../../types/BusinessPartner';
import StyledSelect from '../Common/StyledSelect';

type OptionType = { value: string; label: string };

const SalesLedgerComponent: React.FC = () => {
    const [customerId, setCustomerId] = useState(() => sessionStorage.getItem('sl_customer_id') || '');
    const [ledgerData, setLedgerData] = useState<SalesLedger | null>(null);
    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState<BusinessPartner[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const customersData = await businessPartnerApi.getCustomers();
                setCustomers(customersData);
            } catch (error) {
                toast.error('Failed to fetch customers.');
            }
        };
        fetchCustomers();
    }, []);

    useEffect(() => {
        sessionStorage.setItem('sl_customer_id', customerId);
    }, [customerId]);

    useEffect(() => {
        if (sessionStorage.getItem('sl_loaded') === 'true' && customerId) {
            handleFetchLedger();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleFetchLedger = async () => {
        if (!customerId) {
            toast.error('Please enter a Customer ID.');
            return;
        }
        setLoading(true);
        setLedgerData(null);
        try {
            const data = await ledgerApi.getSalesLedger(parseInt(customerId, 10));
            setLedgerData(data);
            sessionStorage.setItem('sl_loaded', 'true');
        } catch (error: any) {
            toast.error(error.message || 'Failed to fetch Sales Ledger.');
        } finally {
            setLoading(false);
        }
    };

    const handleRowClick = (entry: SalesLedger['entries'][0]) => {
        navigate(`/sales-orders/${(entry as any).so_id}/details`);
    };

    const customerOptions: OptionType[] = customers.map((customer) => ({
        value: String(customer.id),
        label: `${customer.id} - ${customer.name}`,
    }));
    const selectedCustomerOption = customerOptions.find(option => option.value === customerId);

    return (
        <div>
            <div className="row g-3 align-items-end p-3 border-bottom">
                <div className="col-md-4">
                    <label htmlFor="customerId" className="form-label">Customer ID</label>
                    <StyledSelect
                        id="customerId"
                        value={selectedCustomerOption}
                        onChange={(option, _action) => setCustomerId(option ? String(option.value) : '')}
                        options={customerOptions}
                        placeholder="Select a Customer"
                    />
                </div>
                <div className="col-md-4 d-flex justify-content-center justify-content-md-end">
                    <button className="btn btn-primary mb-2" onClick={handleFetchLedger} disabled={loading}>
                        {loading ? 'Generating...' : 'Get Sales Ledger'}
                    </button>
                </div>
            </div>
            {loading && <Loading message="Loading data..." />}
            {ledgerData && (
                <div className="p-3">
                    <h5 className="mb-3">{ledgerData.title}</h5>
                    <p className="text-muted">Customer ID: {ledgerData.customer_id}</p>
                    <div className="table-responsive">
                        <table className="table table-striped table-hover">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Customer Name</th>
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
                                        <td>{entry.customer_name}</td>
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

export default SalesLedgerComponent;
