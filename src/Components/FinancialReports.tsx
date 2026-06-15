import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { Modal, Button } from 'react-bootstrap';
import PageHeader from './Layout/PageHeader';
import { financialReportsApi, financialSettingsApi } from '../services/api';
import { FinancialSettings } from '../types/financialSettings';
import CustomDatePicker from './Common/CustomDatePicker';
import { BalanceSheet, ProfitAndLoss, OperatingExpenseByAccount } from '../types/financialReports';
import { FinancialSummary } from '../types/financialSummary';
import Loading from './Common/Loading';
import GeneralLedgerComponent from './Ledgers/GeneralLedgerComponent';
import PurchaseLedgerComponent from './Ledgers/PurchaseLedgerComponent';
import SalesLedgerComponent from './Ledgers/SalesLedgerComponent';
import InventoryLedgerComponent from './Ledgers/InventoryLedgerComponent';
import StyledSelect from './Common/StyledSelect';
import { toYYYYMMDD } from '../utility/date-utils';
import { useShortcuts } from './context/KeyboardShortcutContext';
import { usePageShortcuts } from '../hooks/usePageShortcuts';
import KeyboardShortcutsIndicator from './Common/KeyboardShortcutsIndicator';

type ReportType = 'pnl' | 'balance-sheet' | 'general-ledger' | 'purchase-ledger' | 'sales-ledger' | 'inventory-ledger' | 'financial-summary' | 'year-closing';

const getReportLabel = (value: ReportType): string => {
  switch (value) {
    case 'pnl': return 'Profit & Loss';
    case 'balance-sheet': return 'Balance Sheet';
    case 'general-ledger': return 'General Ledger';
    case 'purchase-ledger': return 'Purchase Ledger';
    case 'sales-ledger': return 'Sales Ledger';
    case 'inventory-ledger': return 'Inventory Ledger';
    case 'financial-summary': return 'Financial Summary';
    case 'year-closing': return 'Year Closing';
    default: return '';
  }
};

const FinancialReports: React.FC = () => {
  const today = toYYYYMMDD(new Date());
  const [activeTab, setActiveTab] = useState<ReportType>(() => {
    return (sessionStorage.getItem('financial_active_tab') as ReportType) || 'pnl';
  });

  const { registerShortcuts } = useShortcuts();

  // Tab switching shortcuts
  useEffect(() => {
    const tabShortcuts = [
      { key: 'Alt+1', description: 'Financial Summary Tab', category: 'Tab Actions', action: () => setActiveTab('financial-summary') },
      { key: 'Alt+2', description: 'Profit & Loss Tab', category: 'Tab Actions', action: () => setActiveTab('pnl') },
      { key: 'Alt+3', description: 'Balance Sheet Tab', category: 'Tab Actions', action: () => setActiveTab('balance-sheet') },
      { key: 'Alt+4', description: 'General Ledger Tab', category: 'Tab Actions', action: () => setActiveTab('general-ledger') },
      { key: 'Alt+5', description: 'Purchase Ledger Tab', category: 'Tab Actions', action: () => setActiveTab('purchase-ledger') },
      { key: 'Alt+6', description: 'Sales Ledger Tab', category: 'Tab Actions', action: () => setActiveTab('sales-ledger') },
      { key: 'Alt+7', description: 'Inventory Ledger Tab', category: 'Tab Actions', action: () => setActiveTab('inventory-ledger') },
      { key: 'Alt+8', description: 'Year Closing Tab', category: 'Tab Actions', action: () => setActiveTab('year-closing') },
    ];
    return registerShortcuts(tabShortcuts);
  }, [registerShortcuts]);

  // Year Closing State
  const [financialSettings, setFinancialSettings] = useState<FinancialSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [closingDate, setClosingDate] = useState(() => today);
  const [closingLoading, setClosingLoading] = useState(false);
  const [reopeningLoading, setReopeningLoading] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showReopenConfirm, setShowReopenConfirm] = useState(false);
  const [closeResult, setCloseResult] = useState<{ message: string; net_income_transferred: number } | null>(null);

  useEffect(() => {
    sessionStorage.setItem('financial_active_tab', activeTab);
  }, [activeTab]);

  const fetchSettings = useCallback(async () => {
    setLoadingSettings(true);
    try {
      const settings = await financialSettingsApi.getFinancialSettings();
      setFinancialSettings(settings);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch financial settings.');
    } finally {
      setLoadingSettings(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'year-closing') {
      fetchSettings();
    }
  }, [activeTab, fetchSettings]);

  const handleCloseFinancialYear = async () => {
    setClosingLoading(true);
    setCloseResult(null);
    try {
      const result = await financialSettingsApi.closeFinancialYear(closingDate);
      setCloseResult(result);
      toast.success(result.message || 'Financial year closed successfully.');
      await fetchSettings(); // Refresh settings to show new closed date
      setShowCloseConfirm(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to close financial year.');
    } finally {
      setClosingLoading(false);
    }
  };

  const handleReopenFinancialYear = async () => {
    setReopeningLoading(true);
    try {
      const result = await financialSettingsApi.reopenFinancialYear();
      toast.success(result.message || 'Financial year reopened successfully.');
      await fetchSettings(); // Refresh settings to update closed date
      setShowReopenConfirm(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to reopen financial year.');
    } finally {
      setReopeningLoading(false);
    }
  };

  // P&L State
  const [pnlStartDate, setPnlStartDate] = useState(() => sessionStorage.getItem('financial_pnl_start') || today);
  const [pnlEndDate, setPnlEndDate] = useState(() => sessionStorage.getItem('financial_pnl_end') || today);
  const [pnlData, setPnlData] = useState<ProfitAndLoss | null>(null);
  const [pnlLoading, setPnlLoading] = useState(false);

  // Financial Summary State
  const [fsStartDate, setFsStartDate] = useState(() => sessionStorage.getItem('financial_fs_start') || today);
  const [fsEndDate, setFsEndDate] = useState(() => sessionStorage.getItem('financial_fs_end') || today);
  const [fsData, setFsData] = useState<FinancialSummary | null>(null);
  const [fsLoading, setFsLoading] = useState(false);

  useEffect(() => {
    sessionStorage.setItem('financial_pnl_start', pnlStartDate);
    sessionStorage.setItem('financial_pnl_end', pnlEndDate);
  }, [pnlStartDate, pnlEndDate]);

  useEffect(() => {
    sessionStorage.setItem('financial_fs_start', fsStartDate);
    sessionStorage.setItem('financial_fs_end', fsEndDate);
    }, [fsStartDate, fsEndDate]);

  // Balance Sheet State
  const [bsAsOfDate, setBsAsOfDate] = useState(() => sessionStorage.getItem('financial_bs_date') || today);
  useEffect(() => {
    sessionStorage.setItem('financial_bs_date', bsAsOfDate);
  }, [bsAsOfDate]);
  const [bsData, setBsData] = useState<BalanceSheet | null>(null);
  const [bsLoading, setBsLoading] = useState(false);

  // Operational Expenses Modal State
  const [showOpExModal, setShowOpExModal] = useState(false);
  const [opExDetails, setOpExDetails] = useState<OperatingExpenseByAccount[]>([]);

  const [isSharing, setIsSharing] = useState(false);

  const handleFetchPnl = useCallback(async () => {
    if (pnlStartDate > pnlEndDate) {
      toast.error('Start date cannot be after end date.');
      return;
    }
    setPnlLoading(true);
    setPnlData(null);
    try {
      const data = await financialReportsApi.getProfitAndLoss(pnlStartDate, pnlEndDate);
      setPnlData(data);
      sessionStorage.setItem('financial_pnl_loaded', 'true');
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch Profit & Loss report.');
    } finally {
      setPnlLoading(false);
    }
  }, [pnlStartDate, pnlEndDate]);

  const handleFetchFs = useCallback(async () => {
    if (fsStartDate > fsEndDate) {
        toast.error('Start date cannot be after end date.');
        return;
    }
    setFsLoading(true);
    setFsData(null);
    try {
        const data = await financialReportsApi.getFinancialSummary(fsStartDate, fsEndDate);
        setFsData(data);
        sessionStorage.setItem('financial_fs_loaded', 'true');
    } catch (error: any) {
        toast.error(error.message || 'Failed to fetch Financial Summary.');
    } finally {
        setFsLoading(false);
    }
  }, [fsStartDate, fsEndDate]);

  const handleFetchBs = useCallback(async () => {
    setBsLoading(true);
    setBsData(null);
    try {
      const data = await financialReportsApi.getBalanceSheet(bsAsOfDate);
      setBsData(data);
      sessionStorage.setItem('financial_bs_loaded', 'true');
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch Balance Sheet report.');
    } finally {
      setBsLoading(false);
    }
  }, [bsAsOfDate]);

  useEffect(() => {
    if (activeTab === 'pnl' && sessionStorage.getItem('financial_pnl_loaded') === 'true' && !pnlData && !pnlLoading) {
      handleFetchPnl();
    } else if (activeTab === 'balance-sheet' && sessionStorage.getItem('financial_bs_loaded') === 'true' && !bsData && !bsLoading) {
      handleFetchBs();
    } else if (activeTab === 'financial-summary' && sessionStorage.getItem('financial_fs_loaded') === 'true' && !fsData && !fsLoading) {
      handleFetchFs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, handleFetchPnl, handleFetchBs, handleFetchFs, pnlData, bsData, fsData, pnlLoading, bsLoading, fsLoading]);

  const handleShowOpExDetails = () => {
    setShowOpExModal(true);
    if (pnlData?.operating_expenses_by_account) {
      setOpExDetails(pnlData.operating_expenses_by_account);
    } else {
      setOpExDetails([]);
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

  const handleSharePnlPDF = () => handleShareOrDownload(() => financialReportsApi.exportProfitAndLoss(pnlStartDate, pnlEndDate, 'pdf'), `Profit_And_Loss_${pnlStartDate}_to_${pnlEndDate}.pdf`, 'Profit & Loss Report');

  const handleShareFsPDF = () => handleShareOrDownload(() => financialReportsApi.exportFinancialSummary(fsStartDate, fsEndDate, 'pdf'), `Financial_Summary_${fsStartDate}_to_${fsEndDate}.pdf`, 'Financial Summary Report');

  const handleShareBsPDF = () => handleShareOrDownload(() => financialReportsApi.exportBalanceSheet(bsAsOfDate, 'pdf'), `Balance_Sheet_${bsAsOfDate}.pdf`, 'Balance Sheet Report');

  const handleShareCurrentReport = useCallback(() => {
    if (activeTab === 'pnl' && pnlData) handleSharePnlPDF();
    else if (activeTab === 'financial-summary' && fsData) handleShareFsPDF();
    else if (activeTab === 'balance-sheet' && bsData) handleShareBsPDF();
  }, [activeTab, pnlData, fsData, bsData]);

  const handleFocusSearch = useCallback(() => {
    let input: HTMLInputElement | null = null;
    if (activeTab === 'pnl') input = document.getElementById('pnlStartDate') as HTMLInputElement;
    else if (activeTab === 'financial-summary') input = document.getElementById('fsStartDate') as HTMLInputElement;
    else if (activeTab === 'balance-sheet') input = document.getElementById('bsAsOfDate') as HTMLInputElement;
    if (input) input.focus();
  }, [activeTab]);

  usePageShortcuts({
    onShare: (activeTab === 'pnl' && pnlData) || (activeTab === 'financial-summary' && fsData) || (activeTab === 'balance-sheet' && bsData)
      ? handleShareCurrentReport
      : undefined,
    onSearchFocus: ['pnl', 'financial-summary', 'balance-sheet'].includes(activeTab)
      ? handleFocusSearch
      : undefined,
  });

  const renderPnlReport = () => {
    if (pnlLoading) return <Loading message="Loading data..." />;
    if (!pnlData) return <p className="text-center text-muted p-4">Select a date range and click "Get Report" to view the Profit & Loss statement.</p>;

    return (
      <div className="p-3">
        <h5 className="mb-3">Profit & Loss Statement</h5>
        <p className="text-muted">For the period from {pnlStartDate} to {pnlEndDate}</p>
        <div className="list-group">
          <div className="list-group-item d-flex justify-content-between"><span>Revenue</span> <strong>{pnlData.revenue_str || Number(pnlData.revenue || 0).toFixed(2)}</strong></div>
          <div className="list-group-item d-flex justify-content-between"><span>Cost of Goods Sold (COGS)</span> <strong>- {pnlData.cogs_str || Number(pnlData.cogs || 0).toFixed(2)}</strong></div>
          <div className="list-group-item d-flex justify-content-between list-group-item-primary"><span>Gross Profit</span> <strong>{pnlData.gross_profit_str || Number(pnlData.gross_profit || 0).toFixed(2)}</strong></div>
          <div className="list-group-item d-flex justify-content-between align-items-center">
            <div>
              <span>Operating Expenses</span>
              <a href="#" onClick={handleShowOpExDetails} className="ms-2 small">(View Details)</a>
            </div>
            <strong>- {pnlData.operating_expenses_str || Number(pnlData.operating_expenses || 0).toFixed(2)}</strong>
          </div>
          <div className="list-group-item d-flex justify-content-between list-group-item-success"><span>Net Income</span> <strong>{pnlData.net_income_str || Number(pnlData.net_income || 0).toFixed(2)}</strong></div>
        </div>
      </div>
    );
  };

  const renderFsReport = () => {
    if (fsLoading) return <Loading message="Loading data..." />;
    if (!fsData) return <p className="text-center text-muted p-4">Select a date range and click "Get Report" to view the Financial Summary.</p>;

    return (
        <div className="p-3">
            <h5 className="mb-3">Financial Summary</h5>
            <p className="text-muted">For the period from {fsStartDate} to {fsEndDate}</p>
            <div className="row">
                <div className="col-md-6 col-lg-4 mb-3">
                    <div className="card h-100">
                        <div className="card-body">
                            <h6 className="card-title">Egg Production</h6>
                            <p className="card-text fs-4">{fsData.eggs_produced}</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-6 col-lg-4 mb-3">
                    <div className="card h-100">
                        <div className="card-body">
                            <h6 className="card-title">Eggs Sold</h6>
                            <p className="card-text fs-4">{fsData.eggs_sold}</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-6 col-lg-4 mb-3">
                    <div className="card h-100">
                        <div className="card-body">
                            <h6 className="card-title">Cost Per Egg</h6>
                            <p className="card-text fs-4">{fsData.cost_per_egg_str}</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-6 col-lg-4 mb-3">
                    <div className="card h-100">
                        <div className="card-body">
                            <h6 className="card-title">Selling Price Per Egg</h6>
                            <p className="card-text fs-4">{fsData.selling_price_per_egg_str}</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-6 col-lg-4 mb-3">
                    <div className="card h-100">
                        <div className="card-body">
                            <h6 className="card-title">Net Margin Per Egg</h6>
                            <p className="card-text fs-4">{fsData.net_margin_per_egg_str}</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-6 col-lg-4 mb-3">
                    <div className="card h-100">
                        <div className="card-body">
                            <h6 className="card-title">Cash Balance</h6>
                            <p className="card-text fs-4">{fsData.cash_balance_str}</p>
                            <small className="text-muted">{fsData.cash_balance_words}</small>
                        </div>
                    </div>
                </div>
                <div className="col-md-6 col-lg-4 mb-3">
                    <div className="card h-100">
                        <div className="card-body">
                            <h6 className="card-title">Receivables</h6>
                            <p className="card-text fs-4">{fsData.receivables_str}</p>
                             <small className="text-muted">{fsData.receivables_words}</small>
                        </div>
                    </div>
                </div>
                <div className="col-md-6 col-lg-4 mb-3">
                    <div className="card h-100">
                        <div className="card-body">
                            <h6 className="card-title">Payables</h6>
                            <p className="card-text fs-4">{fsData.payables_str}</p>
                            <small className="text-muted">{fsData.payables_words}</small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
  };
  const renderBsReport = () => {
    if (bsLoading) return <Loading message="Loading data..." />;
    if (!bsData) return <p className="text-center text-muted p-4">Select a date and click "Get Report" to view the Balance Sheet.</p>;

    const totalCurrentAssets = Number(bsData.assets?.current_assets?.cash ?? 0) + Number(bsData.assets?.current_assets?.accounts_receivable ?? 0) + Number(bsData.assets?.current_assets?.inventory ?? 0);
    const totalAssets = totalCurrentAssets; // Assuming no non-current assets for now
    const totalLiabilities = Number(bsData.liabilities?.current_liabilities?.accounts_payable ?? 0);

    return (
      <div className="p-3">
        <h5 className="mb-3">Balance Sheet</h5>
        <p className="text-muted">As of {bsData.as_of_date || bsAsOfDate}</p>
        <div className="row">
          <div className="col-md-6">
            <h5>Assets</h5>
            <ul className="list-group">
              <li className="list-group-item d-flex justify-content-between"><span>Cash</span> <span>{bsData.assets?.current_assets?.cash_str || Number(bsData.assets?.current_assets?.cash ?? 0).toFixed(2)}</span></li>
              <li className="list-group-item d-flex justify-content-between"><span>Accounts Receivable</span> <span>{bsData.assets?.current_assets?.accounts_receivable_str || Number(bsData.assets?.current_assets?.accounts_receivable ?? 0).toFixed(2)}</span></li>
              <li className="list-group-item d-flex justify-content-between"><span>Inventory</span> <span>{bsData.assets?.current_assets?.inventory_str || Number(bsData.assets?.current_assets?.inventory ?? 0).toFixed(2)}</span></li>
              <li className="list-group-item d-flex justify-content-between"><strong>Total Current Assets</strong> <strong>{totalCurrentAssets.toFixed(2)}</strong></li>
              <li className="list-group-item d-flex justify-content-between active"><strong>Total Assets</strong> <strong>Rs. {totalAssets.toFixed(2)}</strong></li>
            </ul>
          </div>
          <div className="col-md-6 mt-4 mt-md-0">
            <h5>Liabilities & Equity</h5>
            <ul className="list-group mb-3">
              <li className="list-group-item d-flex justify-content-between"><span>Accounts Payable</span> <span>{bsData.liabilities?.current_liabilities?.accounts_payable_str || Number(bsData.liabilities?.current_liabilities?.accounts_payable ?? 0).toFixed(2)}</span></li>
              <li className="list-group-item d-flex justify-content-between"><strong>Total Current Liabilities</strong> <strong>{totalLiabilities.toFixed(2)}</strong></li>
              <li className="list-group-item d-flex justify-content-between active"><strong>Total Liabilities</strong> <strong>Rs. {totalLiabilities.toFixed(2)}</strong></li>
            </ul>
            <ul className="list-group">
              <li className="list-group-item d-flex justify-content-between active"><strong>Total Equity</strong> <strong>{bsData.equity_str || Number(bsData.equity ?? 0).toFixed(2)}</strong></li>
            </ul>
          </div>
        </div>
      </div>
    );
  };

  const renderYearClosing = () => {
    if (loadingSettings) return <Loading message="Loading financial settings..." />;

    const isClosed = !!financialSettings?.last_closed_date;
    const lastClosed = financialSettings?.last_closed_date;

    // Min date for closing can be one day after last closed date
    const minClosingDate = lastClosed 
      ? new Date(new Date(`${lastClosed}T00:00:00`).getTime() + 24 * 60 * 60 * 1000) 
      : undefined;

    return (
      <div className="p-3">
        <div className="row">
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-body">
                <h5 className="card-title mb-4 font-weight-bold">Financial Year Lock & Closing</h5>
                
                <div className="d-flex align-items-center mb-4 p-3 bg-light rounded">
                  <div className="me-3">
                    <span className={`badge p-3 rounded-circle ${isClosed ? 'bg-warning text-dark' : 'bg-success text-white'}`} style={{ fontSize: '1.2rem' }}>
                      <i className={`bi ${isClosed ? 'bi-lock-fill' : 'bi-unlock-fill'}`}></i>
                    </span>
                  </div>
                  <div>
                    <h6 className="mb-1">Financial Year Status</h6>
                    <p className="mb-0 text-muted">
                      {isClosed ? (
                        <span>Locked up to <strong>{lastClosed}</strong>. Period is closed for modifications.</span>
                      ) : (
                        <span>All periods are currently unlocked. No financial year has been closed.</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="row g-3">
                  <div className="col-md-6">
                    <label htmlFor="closingDate" className="form-label font-weight-bold">Select Year-End Closing Date</label>
                    <CustomDatePicker
                      id="closingDate"
                      selected={closingDate ? new Date(`${closingDate}T00:00:00`) : null}
                      onChange={(date: Date | null) => date && setClosingDate(toYYYYMMDD(date))}
                      minDate={minClosingDate}
                      maxDate={new Date(`${today}T00:00:00`)}
                      className="form-control"
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
                      dateFormat="dd-MM-yyyy"
                    />
                    <small className="text-muted d-block mt-1">
                      Closing date must be after the last closed date and in the past.
                    </small>
                  </div>

                  <div className="col-md-6 d-flex align-items-end gap-2">
                    <button 
                      className="btn btn-warning w-100" 
                      onClick={() => {
                        if (!closingDate) {
                          toast.error('Please select a closing date.');
                          return;
                        }
                        setCloseResult(null);
                        setShowCloseConfirm(true);
                      }}
                      disabled={closingLoading || reopeningLoading}
                    >
                      <i className="bi bi-lock me-1"></i> Close Financial Year
                    </button>

                    {isClosed && (
                      <button 
                        className="btn btn-outline-danger w-100" 
                        onClick={() => setShowReopenConfirm(true)}
                        disabled={closingLoading || reopeningLoading}
                      >
                        <i className="bi bi-unlock me-1"></i> Reopen Financial Year
                      </button>
                    )}
                  </div>
                </div>

                {closeResult && (
                  <div className="alert alert-success mt-4 mb-0" role="alert">
                    <h6 className="alert-heading font-weight-bold"><i className="bi bi-check-circle-fill me-2"></i>Year Closed Successfully!</h6>
                    <p className="mb-1">{closeResult.message}</p>
                    <p className="mb-0">
                      Net Income Transferred to Retained Earnings: <strong>{Number(closeResult.net_income_transferred).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card border-0 bg-info bg-opacity-10 text-dark shadow-sm">
              <div className="card-body">
                <h6 className="card-title font-weight-bold mb-3">
                  <i className="bi bi-info-circle-fill me-2 text-info"></i> About Year-End Closing
                </h6>
                <p className="small mb-2">
                  Closing the financial year is an automated procedure that:
                </p>
                <ul className="small ps-3 mb-3">
                  <li className="mb-2">Zeros out all **Revenue** and **Expense** (P&L) accounts up to the selected closing date.</li>
                  <li className="mb-2">Calculates the **Net Income** (Profit/Loss) for the period.</li>
                  <li className="mb-2">Automatically posts a balancing transaction to the **Retained Earnings** account.</li>
                  <li className="mb-2">Locks the period on or before the closing date. No new entries, modifications, or deletions can be made in the locked period.</li>
                </ul>
                <p className="small mb-0 text-muted">
                  <i className="bi bi-exclamation-triangle-fill text-warning me-1"></i> Ensure that all transactions and adjustments for the period have been entered before closing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <PageHeader title="Financial Reports" />
      <div className="container">
        <div className="card shadow-sm">
          <div className="card-header d-md-none p-3">
            <StyledSelect
              value={{ value: activeTab, label: getReportLabel(activeTab) }}
              onChange={(option) => setActiveTab(option?.value as ReportType || 'pnl')}
              options={[
                { value: 'financial-summary', label: 'Financial Summary' },
                { value: 'pnl', label: 'Profit & Loss' },
                { value: 'balance-sheet', label: 'Balance Sheet' },
                { value: 'general-ledger', label: 'General Ledger' },
                { value: 'purchase-ledger', label: 'Purchase Ledger' },
                { value: 'sales-ledger', label: 'Sales Ledger' },
                { value: 'inventory-ledger', label: 'Inventory Ledger' },
                { value: 'year-closing', label: 'Year Closing' }
              ]}
              placeholder="Select Report"
            />
          </div>
          <div className="card-header d-none d-md-block p-0">
            <ul className="nav nav-tabs card-header-tabs">
            <li className="nav-item">
                <button className={`nav-link ${activeTab === 'financial-summary' ? 'active' : ''}`} onClick={() => setActiveTab('financial-summary')}>
                  Financial Summary
                </button>
              </li>
              <li className="nav-item">
                <button className={`nav-link ${activeTab === 'pnl' ? 'active' : ''}`} onClick={() => setActiveTab('pnl')}>
                  Profit & Loss
                </button>
              </li>
              <li className="nav-item">
                <button className={`nav-link ${activeTab === 'balance-sheet' ? 'active' : ''}`} onClick={() => setActiveTab('balance-sheet')}>
                  Balance Sheet
                </button>
              </li>
               <li className="nav-item">
                   <button className={`nav-link ${activeTab === 'general-ledger' ? 'active' : ''}`} onClick={() => setActiveTab('general-ledger')}>
                       General Ledger
                   </button>
               </li>
               <li className="nav-item">
                   <button className={`nav-link ${activeTab === 'purchase-ledger' ? 'active' : ''}`} onClick={() => setActiveTab('purchase-ledger')}>
                       Purchase Ledger
                   </button>
               </li>
               <li className="nav-item">
                   <button className={`nav-link ${activeTab === 'sales-ledger' ? 'active' : ''}`} onClick={() => setActiveTab('sales-ledger')}>
                       Sales Ledger
                   </button>
               </li>
               <li className="nav-item">
                   <button className={`nav-link ${activeTab === 'inventory-ledger' ? 'active' : ''}`} onClick={() => setActiveTab('inventory-ledger')}>
                       Inventory Ledger
                   </button>
               </li>
               <li className="nav-item">
                   <button className={`nav-link ${activeTab === 'year-closing' ? 'active' : ''}`} onClick={() => setActiveTab('year-closing')}>
                       Year Closing
                   </button>
               </li>
            </ul>
          </div>
          <div className="card-body">
            {activeTab === 'financial-summary' && (
              <div>
                <div className="row g-3 align-items-end p-3 border-bottom">
                  <div className="col-md-4">
                    <label htmlFor="fsStartDate" className="form-label me-3 mb-0">Start Date</label>
                    <CustomDatePicker
                      id="fsStartDate"
                      selected={fsStartDate ? new Date(`${fsStartDate}T00:00:00`) : null}
                      onChange={(date: Date | null) => date && setFsStartDate(toYYYYMMDD(date))}
                      maxDate={fsEndDate ? new Date(`${fsEndDate}T00:00:00`) : undefined}
                      className="form-control"
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
                      dateFormat="dd-MM-yyyy"
                    />
                  </div>
                  <div className="col-md-4">
                    <label htmlFor="fsEndDate" className="form-label me-3 mb-0">End Date</label>
                    <CustomDatePicker
                      id="fsEndDate"
                      selected={fsEndDate ? new Date(`${fsEndDate}T00:00:00`) : null}
                      onChange={(date: Date | null) => date && setFsEndDate(toYYYYMMDD(date))}
                      minDate={fsStartDate ? new Date(`${fsStartDate}T00:00:00`) : undefined}
                      maxDate={new Date(`${today}T00:00:00`)}
                      className="form-control"
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
                      dateFormat="dd-MM-yyyy"
                    />
                  </div>
                  <div className="col-md-4 d-flex justify-content-center justify-content-md-end gap-2">
                    <button className="btn btn-primary mb-2" onClick={handleFetchFs} disabled={fsLoading || isSharing}>
                      {fsLoading ? 'Generating...' : 'Get Financial Summary'}
                    </button>
                    <button className="btn btn-secondary mb-2" onClick={handleShareFsPDF} disabled={!fsData || fsLoading || isSharing}>
                      <i className="bi bi-file-pdf me-1"></i>{isSharing ? 'Exporting...' : 'Share as PDF'}
                    </button>
                  </div>
                </div>
                {renderFsReport()}
              </div>
            )}
            {activeTab === 'pnl' && (
              <div>
                <div className="row g-3 align-items-end p-3 border-bottom">
                  <div className="col-md-4">
                    <label htmlFor="pnlStartDate" className="form-label me-3 mb-0">Start Date</label>
                    <CustomDatePicker
                      id="pnlStartDate"
                      selected={pnlStartDate ? new Date(`${pnlStartDate}T00:00:00`) : null}
                      onChange={(date: Date | null) => date && setPnlStartDate(toYYYYMMDD(date))}
                      maxDate={pnlEndDate ? new Date(`${pnlEndDate}T00:00:00`) : undefined}
                      className="form-control"
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
                      dateFormat="dd-MM-yyyy"
                    />
                  </div>
                  <div className="col-md-4">
                    <label htmlFor="pnlEndDate" className="form-label me-3 mb-0">End Date</label>
                    <CustomDatePicker
                      id="pnlEndDate"
                      selected={pnlEndDate ? new Date(`${pnlEndDate}T00:00:00`) : null}
                      onChange={(date: Date | null) => date && setPnlEndDate(toYYYYMMDD(date))}
                      minDate={pnlStartDate ? new Date(`${pnlStartDate}T00:00:00`) : undefined}
                      maxDate={new Date(`${today}T00:00:00`)}
                      className="form-control"
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
                      dateFormat="dd-MM-yyyy"
                    />
                  </div>
                  <div className="col-md-4 d-flex justify-content-center justify-content-md-end gap-2">
                    <button className="btn btn-primary mb-2" onClick={handleFetchPnl} disabled={pnlLoading || isSharing}>
                      {pnlLoading ? 'Generating...' : 'Get P&L Report'}
                    </button>
                    <button className="btn btn-secondary mb-2" onClick={handleSharePnlPDF} disabled={!pnlData || pnlLoading || isSharing}>
                      <i className="bi bi-file-pdf me-1"></i>{isSharing ? 'Exporting...' : 'Share as PDF'}
                    </button>
                  </div>
                </div>
                {renderPnlReport()}
              </div>
            )}
            {activeTab === 'balance-sheet' && (
              <div>
                <div className="row g-3 align-items-end p-3 border-bottom">
                  <div className="col-md-4">
                    <label htmlFor="bsAsOfDate" className="form-label me-3 mb-0">As of Date</label>
                    <CustomDatePicker
                      id="bsAsOfDate"
                      selected={bsAsOfDate ? new Date(`${bsAsOfDate}T00:00:00`) : null}
                      onChange={(date: Date | null) => date && setBsAsOfDate(toYYYYMMDD(date))}
                      maxDate={new Date(`${today}T00:00:00`)}
                      className="form-control"
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
                      dateFormat="dd-MM-yyyy"
                    />
                  </div>
                  <div className="col-md-4 d-flex justify-content-center justify-content-md-end gap-2">
                    <button className="btn btn-primary mb-2" onClick={handleFetchBs} disabled={bsLoading || isSharing}>
                      {bsLoading ? 'Generating...' : 'Get Balance Sheet'}
                    </button>
                    <button className="btn btn-secondary mb-2" onClick={handleShareBsPDF} disabled={!bsData || bsLoading || isSharing}>
                      <i className="bi bi-file-pdf me-1"></i>{isSharing ? 'Exporting...' : 'Share as PDF'}
                    </button>
                  </div>
                </div>
                {renderBsReport()}
              </div>
            )}
           {activeTab === 'general-ledger' && <GeneralLedgerComponent />}
           {activeTab === 'purchase-ledger' && <PurchaseLedgerComponent />}
           {activeTab === 'sales-ledger' && <SalesLedgerComponent />}
           {activeTab === 'inventory-ledger' && <InventoryLedgerComponent />}
           {activeTab === 'year-closing' && renderYearClosing()}
          </div>
        </div>

        <Modal show={showOpExModal} onHide={() => setShowOpExModal(false)} centered size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Operational Expense Details</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {opExDetails.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Account Code</th>
                      <th>Account Name</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {opExDetails.map((expense, index) => (
                      <tr key={index}>
                        <td>{expense.account_code}</td>
                        <td>{expense.account_name}</td>
                        <td>{expense.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No operational expenses found for the selected period.</p>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowOpExModal(false)}>Close</Button>
          </Modal.Footer>
        </Modal>

        {/* Close Year Confirmation Modal */}
        <Modal show={showCloseConfirm} onHide={() => setShowCloseConfirm(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title className="text-warning">Confirm Financial Year Closing</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>Are you sure you want to close the financial year up to <strong>{closingDate}</strong>?</p>
            <p className="text-danger small">
              <i className="bi bi-exclamation-triangle-fill me-1"></i> 
              This will lock the period on or before {closingDate}. You will not be able to add, modify, or delete journal entries in this locked period.
            </p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCloseConfirm(false)} disabled={closingLoading}>
              Cancel
            </Button>
            <Button variant="warning" onClick={handleCloseFinancialYear} disabled={closingLoading}>
              {closingLoading ? 'Closing...' : 'Confirm Close'}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Reopen Year Confirmation Modal */}
        <Modal show={showReopenConfirm} onHide={() => setShowReopenConfirm(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title className="text-danger">Confirm Reopening Financial Year</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>Are you sure you want to reopen the financial year?</p>
            <p className="text-muted small">
              This will unlock the posting period prior to <strong>{financialSettings?.last_closed_date}</strong> by deleting the automated closing journal entry.
            </p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowReopenConfirm(false)} disabled={reopeningLoading}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleReopenFinancialYear} disabled={reopeningLoading}>
              {reopeningLoading ? 'Reopening...' : 'Confirm Reopen'}
            </Button>
          </Modal.Footer>
        </Modal>
        <KeyboardShortcutsIndicator hasSearch hasShare={['pnl', 'financial-summary', 'balance-sheet'].includes(activeTab)} />
      </div>
    </>
  );
};

export default FinancialReports;
