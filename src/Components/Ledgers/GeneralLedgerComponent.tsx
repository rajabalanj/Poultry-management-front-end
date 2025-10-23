
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { ledgerApi } from '../../services/api';
import { GeneralLedger } from '../../types/ledgers';
import Loading from '../Common/Loading';
import { DateSelector } from '../DateSelector';

const GeneralLedgerComponent: React.FC = () => {
    const today = new Date().toISOString().slice(0, 10);
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);
    const [ledgerData, setLedgerData] = useState<GeneralLedger | null>(null);
    const [loading, setLoading] = useState(false);

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
                    <DateSelector label="Start Date" value={startDate} onChange={setStartDate} maxDate={endDate} />
                </div>
                <div className="col-md-4">
                    <DateSelector label="End Date" value={endDate} onChange={setEndDate} minDate={startDate} maxDate={today} />
                </div>
                <div className="col-md-4">
                    <button className="btn btn-primary w-100 mb-2" onClick={handleFetchLedger} disabled={loading}>
                        {loading ? 'Generating...' : 'Get General Ledger'}
                    </button>
                </div>
            </div>
            {loading && <Loading message="Loading data..." />}
            {ledgerData && (
                <div className="p-3">
                    <h4 className="mb-3">{ledgerData.title}</h4>
                    <p className="text-muted">Opening Balance: {ledgerData.opening_balance.toFixed(2)}</p>
                    <div className="table-responsive">
                        <table className="table table-striped">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Description</th>
                                    <th>Journal Ref ID</th>
                                    <th>Debit</th>
                                    <th>Credit</th>
                                    <th>Balance</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ledgerData.entries.map((entry, index) => (
                                    <tr key={index}>
                                        <td>{entry.date}</td>
                                        <td>{entry.description}</td>
                                        <td>{entry.journal_ref_id}</td>
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
