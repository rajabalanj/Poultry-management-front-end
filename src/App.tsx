import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles/global.css';
import Layout from './Components/Layout';
import PageHeader from "./Components/PageHeader";
import AddBatch from "./Components/AddBatch";
import BatchDetails from "./Components/BatchDetails";
import EditBatch from "./Components/EditBatch";
import Dashboard from "./Components/Dashboard";
import FeedMillStock from "./Components/FeedMillStock";
// import CreateFeedForm from './Components/CreateFeedForm';
// import { FeedItem, FeedItemList } from './Components/FeedItem';
// import FeedListPage from './Components/FeedIndex';
import PreviousDayReport from './Components/PreviousDayReport';
// import NewFeedComposition from './Components/NewFeedComposition';
// import EggRoomStock from './Components/EggRoomStock';

const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route
            path="/"
            element={
              <>
                <PageHeader
                  title="Batch Management"
                  buttonLabel="Add New Batch"
                  buttonLink="/add-batch"
                />
                <Dashboard />
              </>
            }
          />
          <Route path="/add-batch" element={<AddBatch />} />
          <Route path="/batch/:batchId/details" element={<BatchDetails />} />
          <Route path="/batch/:batchId/edit" element={<EditBatch />} />
          {/* <Route path="/batch/:batchId/report" element={<PreviousDayReport />} /> */}
          <Route path="/feed-mill-stock" element={
            <>
              <PageHeader
                title="Feed Compositions"
              />
            <FeedMillStock />
            </>} />
          {/* <Route path="/add-feed" element={<CreateFeedForm />} />
          <Route path="/feed-list" element={<FeedItemList />} />
          <Route path="/feed" element={<FeedListPage />} /> */}
          <Route path="/previous-day-report" element={<PreviousDayReport />} />
<Route path="/previous-day-report/:batchId" element={<PreviousDayReport />} />
          {/* <Route path="/new-feed-composition" element={<NewFeedComposition />} />
          <Route path="/egg-room-stock" element={<EggRoomStock />} /> */}
        </Routes>
      </Layout>
      <ToastContainer position="top-right" autoClose={3000} />
    </Router>
  );
};

export default App;
