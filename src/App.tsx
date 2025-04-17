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
        </Routes>
      </Layout>
      <ToastContainer position="top-right" autoClose={3000} />
    </Router>
  );
};

export default App;
