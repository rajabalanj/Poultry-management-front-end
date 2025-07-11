import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Layout from './Components/Layout/Layout';
import PageHeader from "./Components/Layout/PageHeader";
import AddBatch from "./Components/Forms/Create/AddBatch";
import BatchDetails from "./Components/Forms/Read/BatchDetails";
import EditBatch from "./Components/Forms/Update/EditBatch";
import Dashboard from "./Components/Dashboard";
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


const App: React.FC = () => {
  return (
      <Router>
        <Layout>
          <Routes>
            <Route
              path="/"
              element={
                <>
                  <PageHeader title="Batch Management" />
                  <Dashboard />
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
          </Routes>
        </Layout>
        <ToastContainer position="top-right" autoClose={3000} />
      </Router>
  );
};

export default App;
