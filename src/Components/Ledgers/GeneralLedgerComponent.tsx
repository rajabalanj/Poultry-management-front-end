
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { ledgerApi } from '../../services/api';
import { GeneralLedger } from '../../types/ledgers';
import Loading from '../Common/Loading';
import CustomDatePicker from '../Common/CustomDatePicker';

const GeneralLedgerComponent: React.FC = () => {
    const today = new Date().toISOString().slice(0, 10);
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);
    const [ledgerData, setLedgerData] = useState<GeneralLedger | null>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleRowClick = (entry: GeneralLedger['entries'][0]) => {
        if (entry.transaction_type.toLowerCase().includes('purchase')) {
            navigate(`/purchase-orders/${entry.reference_id}/details`);
        } else if (entry.transaction_type.toLowerCase().includes('sales')) {
            navigate(`/sales-orders/${entry.reference_id}/details`);
        }
    };
    const handleFetchLedger = async () => {
        if (new Date(startDate) > new Date(endDate)) {
            toast.error('Start date cannot be after end date.');
            return;
        }
        setLoading(true);
        setLedgerData(null);
        try {
            const data = await ledgerApi.getGeneralLedger(startDate, endDate);
            setLedgerData(data);
        } catch (error: any) {
            toast.error(error.message || 'Failed to fetch General Ledger.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="row g-3 align-items-end p-3 border-bottom">
                <div className="col-md-4">
                    <label htmlFor="glStartDate" className="form-label me-3 mb-0">Start Date</label>
                    <CustomDatePicker
                        id="glStartDate"
                        selected={startDate ? new Date(startDate) : null}
                        onChange={(date: Date | null) => date && setStartDate(date.toISOString().slice(0, 10))}
                        maxDate={endDate ? new Date(endDate) : undefined}
                        className="form-control"
                        showMonthDropdown
                        showYearDropdown
                        dropdownMode="select"
                        dateFormat="dd-MM-yyyy"
                    />
                </div>
                <div className="col-md-4">
                    <label htmlFor="glEndDate" className="form-label me-3 mb-0">End Date</label>
                    <CustomDatePicker
                        id="glEndDate"
                        selected={endDate ? new Date(endDate) : null}
                        onChange={(date: Date | null) => date && setEndDate(date.toISOString().slice(0, 10))}
                        minDate={startDate ? new Date(startDate) : undefined}
                        maxDate={new Date(today)}
                        className="form-control"
                        showMonthDropdown
                        showYearDropdown
                        dropdownMode="select"
                        dateFormat="dd-MM-yyyy"
                    />
                </div>
                <div className="col-md-4 d-flex justify-content-center justify-content-md-end">
                    <button className="btn btn-primary mb-2" onClick={handleFetchLedger} disabled={loading}>
                        {loading ? 'Generating...' : 'Get General Ledger'}
                    </button>
                </div>
            </div>
            {loading && <Loading message="Loading data..." />}
            {ledgerData && (
                <div className="p-3">
                    <h5 className="mb-3">{ledgerData.title}</h5>
                    <p className="text-muted">Opening Balance: {ledgerData.opening_balance.toFixed(2)}</p>
                    <div className="table-responsive">
                        <table className="table table-striped table-hover">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Transaction Type</th>
                                    <th>Party</th>
                                    <th>Reference Document</th>
                                    <th>Details</th>
                                    <th>Debit</th>
                                    <th>Credit</th>
                                    <th>Balance</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ledgerData.entries.map((entry, index) => (
                                    <tr key={index} onClick={() => handleRowClick(entry)} style={{ cursor: 'pointer' }}>
                                        <td>{entry.date}</td>
                                        <td>{entry.transaction_type}</td>
                                        <td>{entry.party}</td>
                                        <td>
                                            {entry.reference_document}
                                        </td>
                                        <td>{entry.details}</td>
                                        <td>{entry.debit.toFixed(2)}</td>
                                        <td>{entry.credit.toFixed(2)}</td>
                                        <td>{entry.balance.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p className="text-muted">Closing Balance: {ledgerData.closing_balance.toFixed(2)}</p>
                </div>
            )}
        </div>
    );
};

export default GeneralLedgerComponent;
