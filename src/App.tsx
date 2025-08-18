import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Layout from './Components/Layout/Layout';
import PageHeader from "./Components/Layout/PageHeader";
import AddBatch from "./Components/Forms/Create/AddBatch";
import BatchDetails from "./Components/Forms/Read/BatchDetails";
import EditBatch from "./Components/Forms/Update/EditBatch";
import DashboardIndex from "./Components/Dashboard";
import FeedMillStock from "./Components/FeedMillStock";
import CreateFeedForm from './Components/Forms/Create/CreateFeedForm';
import FeedListPage from './Components/FeedIndex';
import PreviousDayReport from './Components/PreviousDayReport';
import FeedDetails from './Components/Forms/Read/FeedDetails';
import EditFeed from './Components/Forms/Update/EditFeed';
import CompositionUsageHistory from "./Components/CompositionUsageHistory";
import UploadBatch from './Components/UploadBatch'
import EditBatchSimple from './Components/Forms/Update/EditBatchSimple';
import Configurations from './Components/Configurations';
import ViewBatchSimple from './Components/Forms/Read/ViewBatchSimple';
import EggRoomStock from './Components/EggRoomStock'
import EggRoomStockReport from './Components/EggRoomStockReport';
// Add this import
import FeedAuditReport from "./Components/FeedAuditReport";
import CreateMedicineForm from './Components/Forms/Create/CreateMedicineForm';
import MedicineDetails from './Components/Forms/Read/MedicineDetails';
import EditMedicine from './Components/Forms/Update/EditMedicine';
import MedicineListPage from './Components/MedicineIndex';
import MedicineAuditReport from './Components/MedicineAuditReport';
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


const App: React.FC = () => {
  return (
      <Router>
        <Layout>
          <Routes>
            <Route
              path="/"
              element={
                  <Dashboard />
              }
            />
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
            {/* <Route path="/batch/:batchId/report" element={<PreviousDayReport />} /> */}
            <Route
              path="/feed-mill-stock"
              element={
                <>
                  <PageHeader title="Feed Compositions" />
                  <FeedMillStock />
                </>
              }
            />
            <Route path="/create-feed" element={<CreateFeedForm />} />
            <Route path="/feed/:feed_id/details" element={<FeedDetails />} />
            <Route path="/feed/:feed_id/edit" element={<EditFeed />} />
            {/* <Route path="/feed-list" element={<FeedItemList />} /> */}
            <Route path="/feed" element={<FeedListPage />} />
            <Route path="/create-medicine" element={<CreateMedicineForm />} />
            <Route path="/medicine/:medicine_id/details" element={<MedicineDetails />} />
            <Route path="/medicine/:medicine_id/edit" element={<EditMedicine />} />
            {/* <Route path="/feed-list" element={<FeedItemList />} /> */}
            <Route path="/medicine" element={<MedicineListPage />} />
            <Route
              path="/previous-day-report/:batchId?"
              element={<PreviousDayReport />}
            />
            {/* <Route path="/new-feed-composition" element={<NewFeedComposition />} />
            <Route path="/egg-room-stock" element={<EggRoomStock />} /> */}
            <Route
              path="/compositions/:compositionId/usage-history"
              element={<CompositionUsageHistory />}
            />
            <Route path="/configurations" element={<Configurations />} />
            <Route path="/egg-room-stock" element={<EggRoomStock />} />
            <Route
              path="/egg-room-stock/report"
              element={<EggRoomStockReport />}
            />
            <Route path="/feed/:feed_id/audit" element={<FeedAuditReport />} />
            <Route path="/medicine/:medicine_id/audit" element={<MedicineAuditReport />} />
           {/* NEW: Inventory Item Routes */}
          <Route path="/inventory-items" element={<InventoryItemIndexPage />} />
          <Route path="/inventory-items/create" element={<CreateInventoryItemForm />} />
          <Route path="/inventory-items/:item_id/details" element={<InventoryItemDetails />} />
          <Route path="/inventory-items/:item_id/edit" element={<EditInventoryItem />} />
          <Route path="/purchase-orders" element={<PurchaseOrderIndexPage />} />
          <Route path="/purchase-orders/create" element={<CreatePurchaseOrderForm />} /> {/* NEW ROUTE */}
          <Route path="/purchase-orders/:po_id/details" element={<PurchaseOrderDetails />} /> {/* NEW ROUTE */}
          <Route path="/purchase-orders/:po_id/edit" element={<EditPurchaseOrder />} /> {/* NEW ROUTE */}
          <Route path="/purchase-orders/:po_id/add-payment" element={<AddPaymentForm />} />
          <Route path="/sales-orders" element={<SalesOrderIndexPage />} />
          <Route path="/sales-orders/create" element={<CreateSalesOrderForm />} />
          <Route path="/sales-orders/:so_id/details" element={<SalesOrderDetails />} />
          <Route path="/sales-orders/:so_id/edit" element={<EditSalesOrder />} />
          <Route path="/sales-orders/:so_id/add-payment" element={<AddSalesPaymentForm />} />
            {/* Business Partner Routes */}
            <Route path="/business-partners" element={<BusinessPartnerIndexPage />} />
            <Route path="/business-partners/create" element={<CreateBusinessPartnerForm />} />
            <Route path="/business-partners/:partner_id/details" element={<BusinessPartnerDetails />} />
            <Route path="/business-partners/:partner_id/edit" element={<EditBusinessPartner />} />
          </Routes>
        </Layout>
        <ToastContainer position="top-right" autoClose={3000} />
      </Router>
  );
};

export default App;