import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { Modal, Button } from 'react-bootstrap';
import PageHeader from './Layout/PageHeader';
import { financialReportsApi, operationalExpenseApi } from '../services/api';
import CustomDatePicker from './Common/CustomDatePicker';
import { BalanceSheet, ProfitAndLoss } from '../types/financialReports';
import { FinancialSummary } from '../types/financialSummary';
import { OperationalExpense } from '../types/operationalExpense';
import Loading from './Common/Loading';
import GeneralLedgerComponent from './Ledgers/GeneralLedgerComponent';
import PurchaseLedgerComponent from './Ledgers/PurchaseLedgerComponent';
import SalesLedgerComponent from './Ledgers/SalesLedgerComponent';
import InventoryLedgerComponent from './Ledgers/InventoryLedgerComponent';
import StyledSelect from './Common/StyledSelect';

type ReportType = 'pnl' | 'balance-sheet' | 'general-ledger' | 'purchase-ledger' | 'sales-ledger' | 'inventory-ledger' | 'financial-summary';

const getReportLabel = (value: ReportType): string => {
  switch (value) {
    case 'pnl': return 'Profit & Loss';
    case 'balance-sheet': return 'Balance Sheet';
    case 'general-ledger': return 'General Ledger';
    case 'purchase-ledger': return 'Purchase Ledger';
    case 'sales-ledger': return 'Sales Ledger';
    case 'inventory-ledger': return 'Inventory Ledger';
    case 'financial-summary': return 'Financial Summary';
    default: return '';
  }
};

const FinancialReports: React.FC = () => {
  const today = new Date().toISOString().slice(0, 10);
  const [activeTab, setActiveTab] = useState<ReportType>(() => {
    return (sessionStorage.getItem('financial_active_tab') as ReportType) || 'pnl';
  });

  useEffect(() => {
    sessionStorage.setItem('financial_active_tab', activeTab);
  }, [activeTab]);

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
  const [opExDetails, setOpExDetails] = useState<OperationalExpense[]>([]);
  const [opExLoading, setOpExLoading] = useState(false);
  const [opExError, setOpExError] = useState<string | null>(null);

  const handleFetchPnl = useCallback(async () => {
    if (new Date(pnlStartDate) > new Date(pnlEndDate)) {
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
    if (new Date(fsStartDate) > new Date(fsEndDate)) {
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

  const handleShowOpExDetails = async () => {
    setShowOpExModal(true);
    setOpExLoading(true);
    setOpExError(null);
    try {
      const data = await operationalExpenseApi.getOperationalExpenses(pnlStartDate, pnlEndDate);
      setOpExDetails(data);
    } catch (error: any) {
      const message = error.message || 'Failed to fetch operational expense details.';
      setOpExError(message);
      toast.error(message);
    } finally {
      setOpExLoading(false);
    }
  };

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
                { value: 'inventory-ledger', label: 'Inventory Ledger' }
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
                      selected={fsStartDate ? new Date(fsStartDate) : null}
                      onChange={(date: Date | null) => date && setFsStartDate(date.toISOString().slice(0, 10))}
                      maxDate={fsEndDate ? new Date(fsEndDate) : undefined}
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
                      selected={fsEndDate ? new Date(fsEndDate) : null}
                      onChange={(date: Date | null) => date && setFsEndDate(date.toISOString().slice(0, 10))}
                      minDate={fsStartDate ? new Date(fsStartDate) : undefined}
                      maxDate={new Date(today)}
                      className="form-control"
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
                      dateFormat="dd-MM-yyyy"
                    />
                  </div>
                  <div className="col-md-4 d-flex justify-content-center justify-content-md-end">
                    <button className="btn btn-primary mb-2" onClick={handleFetchFs} disabled={fsLoading}>
                      {fsLoading ? 'Generating...' : 'Get Financial Summary'}
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
                      selected={pnlStartDate ? new Date(pnlStartDate) : null}
                      onChange={(date: Date | null) => date && setPnlStartDate(date.toISOString().slice(0, 10))}
                      maxDate={pnlEndDate ? new Date(pnlEndDate) : undefined}
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
                      selected={pnlEndDate ? new Date(pnlEndDate) : null}
                      onChange={(date: Date | null) => date && setPnlEndDate(date.toISOString().slice(0, 10))}
                      minDate={pnlStartDate ? new Date(pnlStartDate) : undefined}
                      maxDate={new Date(today)}
                      className="form-control"
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
                      dateFormat="dd-MM-yyyy"
                    />
                  </div>
                  <div className="col-md-4 d-flex justify-content-center justify-content-md-end">
                    <button className="btn btn-primary mb-2" onClick={handleFetchPnl} disabled={pnlLoading}>
                      {pnlLoading ? 'Generating...' : 'Get P&L Report'}
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
                      selected={bsAsOfDate ? new Date(bsAsOfDate) : null}
                      onChange={(date: Date | null) => date && setBsAsOfDate(date.toISOString().slice(0, 10))}
                      maxDate={new Date(today)}
                      className="form-control"
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
                      dateFormat="dd-MM-yyyy"
                    />
                  </div>
                  <div className="col-md-4 d-flex justify-content-center justify-content-md-end">
                    <button className="btn btn-primary mb-2" onClick={handleFetchBs} disabled={bsLoading}>
                      {bsLoading ? 'Generating...' : 'Get Balance Sheet'}
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
          </div>
        </div>

        <Modal show={showOpExModal} onHide={() => setShowOpExModal(false)} centered size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Operational Expense Details</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {opExLoading ? (
              <Loading message="Loading data..." />
            ) : opExError ? (
              <div className="alert alert-danger">{opExError}</div>
            ) : opExDetails.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Expense Type</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {opExDetails.map(expense => (
                      <tr key={expense.id}>
                        <td>{new Date(expense.date).toLocaleDateString()}</td>
                        <td>{expense.expense_type}</td>
                        <td>{expense.amount_str || Number(expense.amount).toFixed(2)}</td>
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
      </div>
    </>
  );
};

export default FinancialReports;
