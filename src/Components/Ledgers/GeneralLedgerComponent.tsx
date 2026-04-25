
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { ledgerApi } from '../../services/api';
import { GeneralLedger } from '../../types/ledgers';
import Loading from '../Common/Loading';
import CustomDatePicker from '../Common/CustomDatePicker';
import StyledSelect from '../Common/StyledSelect';
import { financialReportsApi } from '../../services/api';

const GeneralLedgerComponent: React.FC = () => {
    const today = new Date().toISOString().slice(0, 10);
    const [startDate, setStartDate] = useState(() => sessionStorage.getItem('gl_start_date') || today);
    const [endDate, setEndDate] = useState(() => sessionStorage.getItem('gl_end_date') || today);
    const [transactionType, setTransactionType] = useState(() => sessionStorage.getItem('gl_transaction_type') || '');
    const [ledgerData, setLedgerData] = useState<GeneralLedger | null>(null);
    const [loading, setLoading] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const navigate = useNavigate();

    const handleRowClick = (entry: GeneralLedger['entries'][0]) => {
        const details = entry.details.toLowerCase();
        if (details.includes('purchase order')) {
            navigate(`/purchase-orders/${entry.reference_id}/details`);
        } else if (details.includes('sales order')) {
            navigate(`/sales-orders/${entry.reference_id}/details`);
        } else if (entry.transaction_type.toLowerCase() === 'expense' || details.includes('operational expense')) {
            navigate(`/operational-expenses/${entry.reference_id}/details`);
        }
    };

    const handlePaymentClick = (e: React.MouseEvent, entry: GeneralLedger['entries'][0]) => {
        e.stopPropagation();
        const details = entry.details.toLowerCase();
        if (details.includes('purchase order')) {
            navigate(`/purchase-orders/${entry.reference_id}/add-payment`);
        } else if (details.includes('sales order')) {
            navigate(`/sales-orders/${entry.reference_id}/add-payment`);
        }
    };

    const handleShareOrDownload = async (fetchBlob: () => Promise<Blob>, filename: string, title: string) => {
        setIsSharing(true);
        try {
          const blob = await fetchBlob();
          const file = new File([blob], filename, { type: 'application/pdf' });
    
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
              await navigator.share({ title, files: [file] });
              toast.success(`${title} shared successfully!`);
              return;
            } catch (shareError: any) {
              if (shareError.name === 'AbortError') return;
              console.error('Share error:', shareError);
            }
          }
          
          // Fallback: direct download
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          toast.success(`${title} downloaded successfully!`);
        } catch (error: any) {
          console.error('Failed to export PDF:', error);
          toast.error(error.message || `Failed to export ${title}.`);
        } finally {
          setIsSharing(false);
        }
      };

    const handleShareGeneralLedgerPDF = () => handleShareOrDownload(
  () => financialReportsApi.exportGeneralLedger(startDate, endDate, 'pdf'),
  `General_Ledger_${startDate}_to_${endDate}.pdf`,
  'General Ledger Report'
);


    useEffect(() => {
        sessionStorage.setItem('gl_start_date', startDate);
        sessionStorage.setItem('gl_end_date', endDate);
        sessionStorage.setItem('gl_transaction_type', transactionType);
    }, [startDate, endDate, transactionType]);

    useEffect(() => {
        if (sessionStorage.getItem('gl_loaded') === 'true') {
            handleFetchLedger();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleFetchLedger = async () => {
        if (new Date(startDate) > new Date(endDate)) {
            toast.error('Start date cannot be after end date.');
            return;
        }
        setLoading(true);
        setLedgerData(null);
        try {
            const data = await ledgerApi.getGeneralLedger(startDate, endDate, transactionType);
            setLedgerData(data);
            sessionStorage.setItem('gl_loaded', 'true');
        } catch (error: any) {
            toast.error(error.message || 'Failed to fetch General Ledger.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="row g-3 align-items-end p-3 border-bottom">
                <div className="col-md-3">
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
                <div className="col-md-3">
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
                <div className="col-md-3">
                    <label htmlFor="transactionType" className="form-label me-3 mb-0">Transaction Type</label>
                    <StyledSelect
                        inputId="transactionType"
                        value={transactionType ? { value: transactionType, label: transactionType === 'purchase' ? 'Purchase' : 'Sales' } : { value: "", label: "All Types" }}
                        onChange={(option) => setTransactionType(option ? String(option.value) : "")}
                        options={[
                            { value: "", label: "All Types" },
                            { value: "purchase", label: "Purchase" },
                            { value: "sales", label: "Sales" }
                        ]}
                        placeholder="Select Transaction Type"
                    />
                </div>
                <div className="col-md-4 d-flex justify-content-center justify-content-md-end gap-2">
                    <button className="btn btn-primary mb-2" onClick={handleFetchLedger} disabled={loading || isSharing}>
                        {loading ? 'Generating...' : 'Get General Ledger'}
                    </button>
                    <button className="btn btn-secondary mb-2" onClick={handleShareGeneralLedgerPDF} disabled={loading || isSharing}>
                        <i className="bi bi-file-pdf me-1"></i>{isSharing ? 'Exporting...' : 'Share as PDF'}
                    </button>
                </div>
            </div>
            {loading && <Loading message="Loading data..." />}
            {ledgerData && (
                <div className="p-3">
                    <h5 className="mb-3">{ledgerData.title}</h5>
                    <p className="text-muted">Opening Balance: {ledgerData.opening_balance_str || ledgerData.opening_balance.toFixed(2)}</p>
                    <div className="table-responsive">
                        <table className="table table-striped table-hover">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Transaction Type</th>
                                    <th>Details</th>
                                    <th>Account</th>
                                    <th>Debit</th>
                                    <th>Credit</th>
                                    <th>Balance</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ledgerData.entries.map((entry, index) => (
                                    <tr key={index} onClick={() => handleRowClick(entry)} style={{ cursor: 'pointer' }}>
                                        <td>{entry.date}</td>
                                        <td>{entry.transaction_type}</td>
                                        <td>{entry.details}</td>
                                        <td>{entry.account_name}</td>
                                        <td>{entry.debit_str || entry.debit.toFixed(2)}</td>
                                        <td>{entry.credit_str || entry.credit.toFixed(2)}</td>
                                        <td>{entry.balance_str || entry.balance.toFixed(2)}</td>
                                        <td>
                                            {(entry.details.toLowerCase().includes('purchase order') || entry.details.toLowerCase().includes('sales order')) && (
                                                <button
                                                    className="btn btn-sm btn-warning"
                                                    onClick={(e) => handlePaymentClick(e, entry)}
                                                >
                                                    <i className="bi bi-credit-card me-1"></i>
                                                    Payment
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p className="text-muted">Closing Balance: {ledgerData.closing_balance_str || ledgerData.closing_balance.toFixed(2)}</p>
                </div>
            )}
        </div>
    );
};

export default GeneralLedgerComponent;
