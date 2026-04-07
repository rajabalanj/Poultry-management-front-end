
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Modal } from 'react-bootstrap';
import { ledgerApi, businessPartnerApi, salesOrderApi } from '../../services/api';
import { SalesLedger } from '../../types/ledgers';
import Loading from '../Common/Loading';
import { BusinessPartner } from '../../types/BusinessPartner';
import StyledSelect from '../Common/StyledSelect';
import CustomDatePicker from '../Common/CustomDatePicker';
import AddSalesPaymentForm from '../SalesOrder/AddSalesPaymentForm';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { useTableKeyboardNavigation } from '../../hooks/useTableKeyboardNavigation';

type OptionType = { value: string; label: string };

const SalesLedgerComponent: React.FC = () => {
    const [customerId, setCustomerId] = useState(() => sessionStorage.getItem('sl_customer_id') || '');
    const [ledgerData, setLedgerData] = useState<SalesLedger | null>(null);
    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState<BusinessPartner[]>([]);
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const navigate = useNavigate();
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [downloadingBill, setDownloadingBill] = useState(false);
    const [selectedSoId, setSelectedSoId] = useState<number | null>(null);
    const [focusedRowIndex, setFocusedRowIndex] = useState<number>(-1);

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
            const formattedStartDate = startDate ? format(startDate, 'yyyy-MM-dd') : undefined;
            const formattedEndDate = endDate ? format(endDate, 'yyyy-MM-dd') : undefined;
            const data = await ledgerApi.getSalesLedger(parseInt(customerId, 10), formattedStartDate, formattedEndDate);
            setLedgerData(data);
            sessionStorage.setItem('sl_loaded', 'true');
        } catch (error: any) {
            toast.error(error.message || 'Failed to fetch Sales Ledger.');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadBill = async (status: 'paid' | 'unpaid') => {
        if (!customerId) {
            toast.error('Please select a customer.');
            return;
        }
        setDownloadingBill(true);
        try {
            const formattedStartDate = startDate ? format(startDate, 'yyyy-MM-dd') : undefined;
            const formattedEndDate = endDate ? format(endDate, 'yyyy-MM-dd') : undefined;
            const blob = await salesOrderApi.getCustomerBill(parseInt(customerId, 10), formattedStartDate, formattedEndDate, status);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Bill_${customerId}_${status}_${format(new Date(), 'yyyyMMdd')}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error: any) {
            toast.error(error.message || 'Failed to download bill.');
        } finally {
            setDownloadingBill(false);
        }
    };

    const handleRowClick = (entry: SalesLedger['entries'][0], index?: number) => {
        if (index !== undefined) {
            setFocusedRowIndex(index);
            setSelectedIndex(index);
        }
        navigate(`/sales-orders/${entry.so_id}/details`);
    };

    const handleOpenPayment = (e: React.MouseEvent, so_id: number) => {
        e.stopPropagation();
        setSelectedSoId(so_id);
        setShowPaymentModal(true);
    };

    // Handle Escape key for payment modal
    useEscapeKey(() => setShowPaymentModal(false), showPaymentModal);

    // Keyboard navigation for table rows
    const { resetSelection, setSelectedIndex } = useTableKeyboardNavigation({
        rowCount: ledgerData?.entries.length || 0,
        onRowSelect: (index) => {
            setFocusedRowIndex(index);
            const row = document.querySelector(`tr[data-row-index="${index}"]`);
            row?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        },
        onRowEnter: (index) => {
            if (ledgerData && ledgerData.entries[index]) {
                handleRowClick(ledgerData.entries[index], index);
            }
        },
        onRowAction: (index, key) => {
            if (key === 'p' && ledgerData && ledgerData.entries[index]) {
                setSelectedSoId(ledgerData.entries[index].so_id);
                setShowPaymentModal(true);
            }
        },
        enabled: !showPaymentModal && !!ledgerData,
    });

    // Reset keyboard navigation when ledger data changes
    useEffect(() => {
        resetSelection();
        setFocusedRowIndex(-1);
    }, [ledgerData, resetSelection]);

    const customerOptions: OptionType[] = customers.map((customer) => ({
        value: String(customer.id),
        label: `${customer.id} - ${customer.name}`,
    }));
    const selectedCustomerOption = customerOptions.find(option => option.value === customerId);

    return (
        <>
            <div>
                <div className="row g-3 align-items-end p-3 border-bottom">
                    <div className="col-md-3">
                        <label htmlFor="customerId" className="form-label">Customer ID</label>
                        <StyledSelect
                            id="customerId"
                            value={selectedCustomerOption}
                            onChange={(option, _action) => setCustomerId(option ? String(option.value) : '')}
                            options={customerOptions}
                            placeholder="Select a Customer"
                        />
                    </div>
                    <div className="col-md-3">
                        <label className="form-label">Start Date</label>
                        <CustomDatePicker
                            selected={startDate}
                            onChange={setStartDate}
                            placeholderText="Start Date"
                            isClearable
                        />
                    </div>
                    <div className="col-md-3">
                        <label className="form-label">End Date</label>
                        <CustomDatePicker
                            selected={endDate}
                            onChange={setEndDate}
                            placeholderText="End Date"
                            isClearable
                        />
                    </div>
                    <div className="col-md-3 d-flex flex-wrap gap-2 justify-content-center justify-content-md-end">
                        <button className="btn btn-primary" onClick={handleFetchLedger} disabled={loading}>
                            {loading ? 'Generating...' : 'Get Sales Ledger'}
                        </button>
                        {customerId && (
                            <>
                                <button 
                                    className="btn btn-outline-danger" 
                                    onClick={() => handleDownloadBill('unpaid')} 
                                    disabled={downloadingBill}
                                >
                                    {downloadingBill ? '...' : 'Unpaid Bill'}
                                </button>
                                <button 
                                    className="btn btn-outline-success" 
                                    onClick={() => handleDownloadBill('paid')} 
                                    disabled={downloadingBill}
                                >
                                    {downloadingBill ? '...' : 'Paid Bill'}
                                </button>
                            </>
                        )}
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
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ledgerData.entries.map((entry, index) => (
                                        <tr 
                                            key={index} 
                                            data-row-index={index}
                                            onClick={() => handleRowClick(entry, index)} 
                                            className={focusedRowIndex === index ? 'table-primary' : ''}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <td>{entry.date}</td>
                                            <td>{entry.customer_name}</td>
                                            <td>{entry.invoice_number}</td>
                                            <td>{entry.description}</td>
                                            <td>{entry.amount_str || entry.amount.toFixed(2)}</td>
                                            <td>{entry.amount_paid_str || entry.amount_paid.toFixed(2)}</td>
                                            <td>{entry.balance_amount_str || entry.balance_amount.toFixed(2)}</td>
                                            <td>{entry.payment_status}</td>
                                            <td>
                                                <button
                                                    className="btn btn-sm btn-outline-primary"
                                                    onClick={(e) => handleOpenPayment(e, entry.so_id)}
                                                >
                                                    Add Payment
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>Add Payment</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedSoId && (
                        <AddSalesPaymentForm
                            soId={selectedSoId}
                            onSuccess={() => {
                                setShowPaymentModal(false);
                                handleFetchLedger(); // Refresh ledger data
                            }}
                            onCancel={() => setShowPaymentModal(false)}
                        />
                    )}
                </Modal.Body>
            </Modal>
        </>
    );
};

export default SalesLedgerComponent;
