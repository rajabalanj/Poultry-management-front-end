import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Container } from 'react-bootstrap';
import Layout from './Components/Layout/Layout';
import PageHeader from "./Components/Layout/PageHeader";
import ProtectedRoute from './Components/Auth/ProtectedRoute';
import ScrollToTop from './Components/Common/ScrollToTop';
import ErrorBoundary from './Components/ErrorBoundary';

const AddBatch = lazy(() => import('./Components/Forms/Create/AddBatch'));
const BatchDetails = lazy(() => import('./Components/Forms/Read/BatchDetails'));
const EditBatch = lazy(() => import('./Components/Forms/Update/EditBatch'));
const DashboardIndex = lazy(() => import('./Components/Dashboard'));
const FeedMillStock = lazy(() => import('./Components/FeedMillStock'));
const PreviousDayReport = lazy(() => import('./Components/PreviousDayReport'));
const CompositionUsageHistory = lazy(() => import('./Components/CompositionUsageHistory'));
const UploadBatch = lazy(() => import('./Components/UploadBatch'));
const EditBatchSimple = lazy(() => import('./Components/Forms/Update/EditBatchSimple'));
const Configurations = lazy(() => import('./Components/Configurations'));
const ViewBatchSimple = lazy(() => import('./Components/Forms/Read/ViewBatchSimple'));
const EggRoomStock = lazy(() => import('./Components/EggRoomStock'));
const InventoryItemResponsive = lazy(() => import('./Components/InventoryItem/InventoryItemResponsive'));
const CreateInventoryItemForm = lazy(() => import('./Components/InventoryItem/CreateInventoryItemForm'));
const InventoryItemDetails = lazy(() => import('./Components/InventoryItem/InventoryItemDetails'));
const EditInventoryItem = lazy(() => import('./Components/InventoryItem/EditInventoryItem'));
const InventoryStockLevelReport = lazy(() => import('./Components/InventoryStockLevelReport'));
const LowStockReport = lazy(() => import('./Components/LowStockReport'));
const TopSellingItems = lazy(() => import('./Components/Dashboard/TopSellingItems'));
const PurchaseResponsive = lazy(() => import('./Components/Purchase/PurchaseResponsive'));
const CreatePurchaseOrderForm = lazy(() => import('./Components/PurchaseOrder/CreatePurchaseOrderForm'));
const PurchaseOrderDetails = lazy(() => import('./Components/PurchaseOrder/PurchaseOrderDetails'));
const EditPurchaseOrder = lazy(() => import('./Components/PurchaseOrder/EditPurchaseOrder'));
const AddPaymentForm = lazy(() => import('./Components/PurchaseOrder/AddPaymentForm'));
const Dashboard = lazy(() => import('./Components/Dashboard/Dashboard'));
const SalesResponsive = lazy(() => import('./Components/Sales/SalesResponsive'));
const CreateSalesOrderForm = lazy(() => import('./Components/SalesOrder/CreateSalesOrderForm'));
const SalesOrderDetails = lazy(() => import('./Components/SalesOrder/SalesOrderDetails'));
const EditSalesOrder = lazy(() => import('./Components/SalesOrder/EditSalesOrder'));
const AddSalesPaymentForm = lazy(() => import('./Components/SalesOrder/AddSalesPaymentForm'));
const BusinessPartnerIndexPage = lazy(() => import('./Components/BusinessPartner/BusinessPartnerIndex'));
const BusinessPartnerDetails = lazy(() => import('./Components/BusinessPartner/BusinessPartnerDetails'));
const CreateBusinessPartnerForm = lazy(() => import('./Components/BusinessPartner/CreateBusinessPartnerForm'));
const EditBusinessPartner = lazy(() => import('./Components/BusinessPartner/EditBusinessPartner'));
const Callback = lazy(() => import('./Components/Auth/Callback'));
const LogoutPage = lazy(() => import('./Components/Auth/LogoutPage'));
const FinancialReports = lazy(() => import('./Components/FinancialReports'));
const OperationalExpensesIndexPage = lazy(() => import('./Components/OperationalExpenses/OperationalExpensesIndex'));
const CreateOperationalExpenseForm = lazy(() => import('./Components/OperationalExpenses/CreateOperationalExpenseForm'));
const EditOperationalExpense = lazy(() => import('./Components/OperationalExpenses/EditOperationalExpense'));
const ShedIndexPage = lazy(() => import('./Components/Shed/ShedIndex'));
const CreateShedForm = lazy(() => import('./Components/Shed/CreateShedForm'));
const ShedDetails = lazy(() => import('./Components/Shed/ShedDetails'));
const EditShed = lazy(() => import('./Components/Shed/EditShed'));
const MoveShed = lazy(() => import('./Components/Batch/MoveShed'));
const SwapSheds = lazy(() => import('./Components/Batch/SwapSheds'));


const ProtectedRoutes = () => (
  <ProtectedRoute>
    <Outlet />
  </ProtectedRoute>
);

const App: React.FC = () => {
  return (
    <Container fluid>
      <Router>
        <ScrollToTop />
        <Layout>
          <Suspense fallback={<div className="text-center p-5">Loading...</div>}>
            <Routes>
              <Route element={<ProtectedRoutes />}>
                <Route path="/" element={<Dashboard />} />
                <Route
                  path="/production"
                  element={
                    <>
                      <PageHeader title="Batch Management" />
                      <DashboardIndex />
                    </>
                  }
                />
                <Route path="/add-batch" element={<AddBatch />} />
                <Route
                  path="/batch/:batch_id/:batch_date/details"
                  element={<BatchDetails />}
                />
                <Route
                  path="/batch/:batch_id/move-shed"
                  element={<MoveShed />}
                />
                <Route path="/swap-sheds" element={<SwapSheds />} />
                <Route
                  path="/batch/:batchId/:batch_date/edit"
                  element={<EditBatch />}
                />
                <Route path="/batch/:batchId/view-simple" element={<ViewBatchSimple />} />
                <Route
                  path="/batch/:batchId/edit-simple"
                  element={<EditBatchSimple />}
                />
                <Route path="/upload-batch" element={<UploadBatch />} />
                <Route
                  path="/feed-mill-stock"
                  element={
                    <>
                      <PageHeader title="Feed Compositions" />
                      <FeedMillStock />
                    </>
                  }
                />
                <Route
                  path="/previous-day-report/:batchId?"
                  element={<ErrorBoundary><PreviousDayReport /></ErrorBoundary>}
                />
                <Route
                  path="/compositions/usage-history"
                  element={<CompositionUsageHistory />}
                />
                <Route
                  path="/compositions/:compositionId/usage-history"
                  element={<CompositionUsageHistory />}
                />
                <Route path="/egg-room-stock" element={<EggRoomStock />} />
                <Route path="/inventory-items" element={<InventoryItemResponsive />} />
                <Route path="/inventory-items/create" element={<CreateInventoryItemForm />} />
                <Route path="/inventory-items/:item_id/details" element={<InventoryItemDetails />} />
                <Route path="/inventory-items/:item_id/edit" element={<EditInventoryItem />} />
                <Route path="/inventory-items/stock-level-report" element={<InventoryStockLevelReport />} />
                <Route path="/inventory-items/low-stock-report" element={<LowStockReport />} />
                <Route path="/inventory-items/top-selling-items-report" element={<TopSellingItems />} />
                <Route path="/purchase-orders" element={<PurchaseResponsive />} />
                <Route path="/purchase-orders/create" element={<CreatePurchaseOrderForm />} />
                <Route path="/purchase-orders/:po_id/details" element={<PurchaseOrderDetails />} />
                <Route path="/purchase-orders/:po_id/edit" element={<EditPurchaseOrder />} />
                <Route path="/purchase-orders/:po_id/add-payment" element={<AddPaymentForm />} />
                <Route path="/sales-orders" element={<SalesResponsive />} />
                <Route path="/sales-orders/create" element={<CreateSalesOrderForm />} />
                <Route path="/sales-orders/:so_id/details" element={<SalesOrderDetails />} />
                <Route path="/sales-orders/:so_id/edit" element={<EditSalesOrder />} />
                <Route path="/sales-orders/:so_id/add-payment" element={<AddSalesPaymentForm />} />
                <Route path="/business-partners" element={<BusinessPartnerIndexPage />} />
                <Route path="/business-partners/create" element={<CreateBusinessPartnerForm />} />
                <Route path="/business-partners/:partner_id/details" element={<BusinessPartnerDetails />} />
                <Route path="/business-partners/:partner_id/edit" element={<EditBusinessPartner />} />
                <Route path="/financial-reports" element={<ErrorBoundary><FinancialReports /></ErrorBoundary>} />
                <Route path="/operational-expenses" element={<OperationalExpensesIndexPage />} />
                <Route path="/operational-expenses/create" element={<CreateOperationalExpenseForm />} />
                <Route path="/operational-expenses/:expense_id/edit" element={<EditOperationalExpense />} />
                <Route path="/sheds" element={<ShedIndexPage />} />
                <Route path="/sheds/create" element={<CreateShedForm />} />
                <Route path="/sheds/:shed_id/details" element={<ShedDetails />} />
                <Route path="/sheds/:shed_id/edit" element={<EditShed />} />
                <Route path="/reports/purchases" element={<PurchaseResponsive />} />
                <Route path="/reports/sales" element={<SalesResponsive />} />
              </Route>
              <Route
                path="/configurations"
                element={
                  <ProtectedRoute roles={['admin']}>
                    <Configurations />
                  </ProtectedRoute>
                }
              />
              <Route path="/logout" element={<LogoutPage />} />
              <Route path="/callback" element={<Callback />} />
            </Routes>
          </Suspense>
        </Layout>
        <ToastContainer position="top-right" autoClose={3000} />
      </Router>
    </Container>
  );
};

export default App;
