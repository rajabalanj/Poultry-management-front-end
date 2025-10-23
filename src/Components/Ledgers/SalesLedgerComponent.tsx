
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { ledgerApi, businessPartnerApi } from '../../services/api';
import { SalesLedger } from '../../types/ledgers';
import Loading from '../Common/Loading';
import { BusinessPartner } from '../../types/BusinessPartner';

const SalesLedgerComponent: React.FC = () => {
    const [customerId, setCustomerId] = useState('');
    const [ledgerData, setLedgerData] = useState<SalesLedger | null>(null);
    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState<BusinessPartner[]>([]);

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
        } catch (error: any) {
            toast.error(error.message || 'Failed to fetch Sales Ledger.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="row g-3 align-items-end p-3 border-bottom">
                <div className="col-md-8">
                    <label htmlFor="customerId" className="form-label">Customer ID</label>
                    <select
                        id="customerId"
                        className="form-select"
                        value={customerId}
                        onChange={(e) => setCustomerId(e.target.value)}
                    >
                        <option value="">Select a Customer</option>
                        {customers.map((customer) => (
                            <option key={customer.id} value={customer.id}>
                                {customer.id} - {customer.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="col-md-4">
                    <button className="btn btn-primary w-100 mb-2" onClick={handleFetchLedger} disabled={loading}>
                        {loading ? 'Generating...' : 'Get Sales Ledger'}
                    </button>
                </div>
            </div>
            {loading && <Loading message="Loading data..." />}
            {ledgerData && (
                <div className="p-3">
                    <h4 className="mb-3">{ledgerData.title}</h4>
                    <p className="text-muted">Customer ID: {ledgerData.customer_id}</p>
                    <div className="table-responsive">
                        <table className="table table-striped">
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
                                    <tr key={index}>
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
