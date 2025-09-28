 import React, { useState } from 'react';
 import { toast } from 'react-toastify';
 import PageHeader from './Layout/PageHeader';
 import { DateSelector } from './DateSelector';
 import { financialReportsApi } from '../services/api';
 import { ProfitAndLoss, BalanceSheet } from '../types/financialReports';
 
 type ReportType = 'pnl' | 'balance-sheet';
 
 const FinancialReports: React.FC = () => {
   const today = new Date().toISOString().slice(0, 10);
   const [activeTab, setActiveTab] = useState<ReportType>('pnl');
 
   // P&L State
   const [pnlStartDate, setPnlStartDate] = useState(today);
   const [pnlEndDate, setPnlEndDate] = useState(today);
   const [pnlData, setPnlData] = useState<ProfitAndLoss | null>(null);
   const [pnlLoading, setPnlLoading] = useState(false);
 
   // Balance Sheet State
   const [bsAsOfDate, setBsAsOfDate] = useState(today);
   const [bsData, setBsData] = useState<BalanceSheet | null>(null);
   const [bsLoading, setBsLoading] = useState(false);
 
   const handleFetchPnl = async () => {
     if (new Date(pnlStartDate) > new Date(pnlEndDate)) {
       toast.error('Start date cannot be after end date.');
       return;
     }
     setPnlLoading(true);
     setPnlData(null);
     try {
       const data = await financialReportsApi.getProfitAndLoss(pnlStartDate, pnlEndDate);
       setPnlData(data);
     } catch (error: any) {
       toast.error(error.message || 'Failed to fetch Profit & Loss report.');
     } finally {
       setPnlLoading(false);
     }
   };
 
   const handleFetchBs = async () => {
     setBsLoading(true);
     setBsData(null);
     try {
       const data = await financialReportsApi.getBalanceSheet(bsAsOfDate);
       setBsData(data);
     } catch (error: any) {
       toast.error(error.message || 'Failed to fetch Balance Sheet report.');
     } finally {
       setBsLoading(false);
     }
   };
 
   const renderPnlReport = () => {
     if (pnlLoading) return <div className="text-center p-4"><span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...</div>;
     if (!pnlData) return <p className="text-center text-muted p-4">Select a date range and click "Get Report" to view the Profit & Loss statement.</p>;
 
     return (
       <div className="p-3">
         <h4 className="mb-3">Profit & Loss Statement</h4>
         <p className="text-muted">For the period from {pnlStartDate} to {pnlEndDate}</p>
         <div className="list-group">
           <div className="list-group-item d-flex justify-content-between"><span>Revenue</span> <strong>Rs. {Number(pnlData.revenue || 0).toFixed(2)}</strong></div>
           <div className="list-group-item d-flex justify-content-between"><span>Cost of Goods Sold (COGS)</span> <strong>- Rs. {Number(pnlData.cogs || 0).toFixed(2)}</strong></div>
           <div className="list-group-item d-flex justify-content-between list-group-item-primary"><span>Gross Profit</span> <strong>Rs. {Number(pnlData.gross_profit || 0).toFixed(2)}</strong></div>
           <div className="list-group-item d-flex justify-content-between"><span>Operating Expenses</span> <strong>- Rs. {Number(pnlData.operating_expenses || 0).toFixed(2)}</strong></div>
           <div className="list-group-item d-flex justify-content-between list-group-item-success"><span>Net Income</span> <strong>Rs. {Number(pnlData.net_income || 0).toFixed(2)}</strong></div>
         </div>
       </div>
     );
   };
 
   const renderBsReport = () => {
     if (bsLoading) return <div className="text-center p-4"><span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...</div>;
     if (!bsData) return <p className="text-center text-muted p-4">Select a date and click "Get Report" to view the Balance Sheet.</p>;
 
     const totalCurrentAssets = Number(bsData.assets?.current_assets?.cash ?? 0) + Number(bsData.assets?.current_assets?.accounts_receivable ?? 0) + Number(bsData.assets?.current_assets?.inventory ?? 0);
     const totalAssets = totalCurrentAssets; // Assuming no non-current assets for now
     const totalLiabilities = Number(bsData.liabilities?.current_liabilities?.accounts_payable ?? 0);
 
     return (
       <div className="p-3">
         <h4 className="mb-3">Balance Sheet</h4>
         <p className="text-muted">As of {bsData.as_of_date || bsAsOfDate}</p>
         <div className="row">
           <div className="col-md-6">
             <h5>Assets</h5>
             <ul className="list-group">
               <li className="list-group-item d-flex justify-content-between"><span>Cash</span> <span>{Number(bsData.assets?.current_assets?.cash ?? 0).toFixed(2)}</span></li>
               <li className="list-group-item d-flex justify-content-between"><span>Accounts Receivable</span> <span>{Number(bsData.assets?.current_assets?.accounts_receivable ?? 0).toFixed(2)}</span></li>
               <li className="list-group-item d-flex justify-content-between"><span>Inventory</span> <span>{Number(bsData.assets?.current_assets?.inventory ?? 0).toFixed(2)}</span></li>
               <li className="list-group-item d-flex justify-content-between"><strong>Total Current Assets</strong> <strong>{totalCurrentAssets.toFixed(2)}</strong></li>
               <li className="list-group-item d-flex justify-content-between active"><strong>Total Assets</strong> <strong>Rs. {totalAssets.toFixed(2)}</strong></li>
             </ul>
           </div>
           <div className="col-md-6">
             <h5>Liabilities & Equity</h5>
             <ul className="list-group mb-3">
               <li className="list-group-item d-flex justify-content-between"><span>Accounts Payable</span> <span>{Number(bsData.liabilities?.current_liabilities?.accounts_payable ?? 0).toFixed(2)}</span></li>
               <li className="list-group-item d-flex justify-content-between"><strong>Total Current Liabilities</strong> <strong>{totalLiabilities.toFixed(2)}</strong></li>
               <li className="list-group-item d-flex justify-content-between active"><strong>Total Liabilities</strong> <strong>Rs. {totalLiabilities.toFixed(2)}</strong></li>
             </ul>
             <ul className="list-group">
               <li className="list-group-item d-flex justify-content-between active"><strong>Total Equity</strong> <strong>Rs. {Number(bsData.equity ?? 0).toFixed(2)}</strong></li>
             </ul>
           </div>
         </div>
       </div>
     );
   };
 
   return (
     <>
       <PageHeader title="Financial Reports" />
       <div className="container-fluid">
         <div className="card shadow-sm">
           <div className="card-header">
             <ul className="nav nav-tabs card-header-tabs">
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
             </ul>
           </div>
           <div className="card-body">
             {activeTab === 'pnl' && (
               <div>
                 <div className="row g-3 align-items-end p-3 border-bottom">
                   <div className="col-md-4">
                     <DateSelector label="Start Date" value={pnlStartDate} onChange={setPnlStartDate} maxDate={pnlEndDate} />
                   </div>
                   <div className="col-md-4">
                     <DateSelector label="End Date" value={pnlEndDate} onChange={setPnlEndDate} minDate={pnlStartDate} maxDate={today} />
                   </div>
                   <div className="col-md-4">
                     <button className="btn btn-primary w-100 mb-2" onClick={handleFetchPnl} disabled={pnlLoading}>
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
                   <div className="col-md-8">
                     <DateSelector label="As of Date" value={bsAsOfDate} onChange={setBsAsOfDate} maxDate={today} />
                   </div>
                   <div className="col-md-4">
                     <button className="btn btn-primary w-100 mb-2" onClick={handleFetchBs} disabled={bsLoading}>
                       {bsLoading ? 'Generating...' : 'Get Balance Sheet'}
                     </button>
                   </div>
                 </div>
                 {renderBsReport()}
               </div>
             )}
           </div>
         </div>
       </div>
     </>
   );
 };
 
 export default FinancialReports;