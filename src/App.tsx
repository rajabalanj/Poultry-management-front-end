import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Layout from './Components/Layout/Layout';
import PageHeader from "./Components/Layout/PageHeader";
import AddBatch from "./Components/Forms/Create/AddBatch";
import BatchDetails from "./Components/Forms/Read/BatchDetails";
import EditBatch from "./Components/Forms/Update/EditBatch";
import DashboardIndex from "./Components/Dashboard";
import FeedMillStock from "./Components/FeedMillStock";
import PreviousDayReport from './Components/PreviousDayReport';
import CompositionUsageHistory from "./Components/CompositionUsageHistory";
import UploadBatch from './Components/UploadBatch'
import EditBatchSimple from './Components/Forms/Update/EditBatchSimple';
import Configurations from './Components/Configurations';
import ViewBatchSimple from './Components/Forms/Read/ViewBatchSimple';
import EggRoomStock from './Components/EggRoomStock'
import EggRoomStockReport from './Components/EggRoomStockReport';
import InventoryItemIndexPage from './Components/InventoryItem/InventoryItemIndex';
import CreateInventoryItemForm from './Components/InventoryItem/CreateInventoryItemForm';
import InventoryItemDetails from './Components/InventoryItem/InventoryItemDetails';
import EditInventoryItem from './Components/InventoryItem/EditInventoryItem';
import PurchaseOrderIndexPage from './Components/PurchaseOrder/PurchaseOrderIndex';
import CreatePurchaseOrderForm from './Components/PurchaseOrder/CreatePurchaseOrderForm';
import PurchaseOrderDetails from './Components/PurchaseOrder/PurchaseOrderDetails';
import EditPurchaseOrder from './Components/PurchaseOrder/EditPurchaseOrder';
import AddPaymentForm from './Components/PurchaseOrder/AddPaymentForm';
import Dashboard from './Components/Dashboard/Dashboard';
import SalesOrderIndexPage from './Components/SalesOrder/SalesOrderIndex';
import CreateSalesOrderForm from './Components/SalesOrder/CreateSalesOrderForm';
import SalesOrderDetails from './Components/SalesOrder/SalesOrderDetails';
import EditSalesOrder from './Components/SalesOrder/EditSalesOrder';
import AddSalesPaymentForm from './Components/SalesOrder/AddSalesPaymentForm';
import BusinessPartnerIndexPage from './Components/BusinessPartner/BusinessPartnerIndex';
import BusinessPartnerDetails from './Components/BusinessPartner/BusinessPartnerDetails';
import CreateBusinessPartnerForm from './Components/BusinessPartner/CreateBusinessPartnerForm';
import EditBusinessPartner from './Components/BusinessPartner/EditBusinessPartner';
import Callback from './Components/Auth/Callback';
import ProtectedRoute from './Components/Auth/ProtectedRoute';
import LogoutPage from './Components/Auth/LogoutPage';
import FinancialReports from './Components/FinancialReports';
import ErrorBoundary from './Components/ErrorBoundary';

const ProtectedRoutes = () => (
  <ProtectedRoute>
    <Outlet />
  </ProtectedRoute>
);

const App: React.FC = () => {
  return (
      <Router>
        <Layout>
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
                element={<PreviousDayReport />}
              />
              <Route
                path="/compositions/:compositionId/usage-history"
                element={<CompositionUsageHistory />}
              />
              <Route path="/egg-room-stock" element={<EggRoomStock />} />
              <Route
                path="/egg-room-stock/report"
                element={<EggRoomStockReport />}
              />
              <Route path="/inventory-items" element={<InventoryItemIndexPage />} />
              <Route path="/inventory-items/create" element={<CreateInventoryItemForm />} />
              <Route path="/inventory-items/:item_id/details" element={<InventoryItemDetails />} />
              <Route path="/inventory-items/:item_id/edit" element={<EditInventoryItem />} />
              <Route path="/purchase-orders" element={<PurchaseOrderIndexPage />} />
              <Route path="/purchase-orders/create" element={<CreatePurchaseOrderForm />} />
              <Route path="/purchase-orders/:po_id/details" element={<PurchaseOrderDetails />} />
              <Route path="/purchase-orders/:po_id/edit" element={<EditPurchaseOrder />} />
              <Route path="/purchase-orders/:po_id/add-payment" element={<AddPaymentForm />} />
              <Route path="/sales-orders" element={<SalesOrderIndexPage />} />
              <Route path="/sales-orders/create" element={<CreateSalesOrderForm />} />
              <Route path="/sales-orders/:so_id/details" element={<SalesOrderDetails />} />
              <Route path="/sales-orders/:so_id/edit" element={<EditSalesOrder />} />
              <Route path="/sales-orders/:so_id/add-payment" element={<AddSalesPaymentForm />} />
              <Route path="/business-partners" element={<BusinessPartnerIndexPage />} />
              <Route path="/business-partners/create" element={<CreateBusinessPartnerForm />} />
              <Route path="/business-partners/:partner_id/details" element={<BusinessPartnerDetails />} />
              <Route path="/business-partners/:partner_id/edit" element={<EditBusinessPartner />} />
              <Route path="/financial-reports" element={<ErrorBoundary><FinancialReports /></ErrorBoundary>} />
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
        </Layout>
        <ToastContainer position="top-right" autoClose={3000} />
      </Router>
  );
};


export default App;
