import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Sidebar from "./Components/Slidebar";
import PageHeader from "./Components/PageHeader";
import BatchTable from "./Components/BatchTable";
import AddBatch from "./Components/AddBatch";
import batchesData from './data/batches.json';

const Layout: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="d-flex flex-column flex-md-row vh-100">
      <Sidebar />
      <div className="flex-grow-1 p-3">
        <Routes>
          <Route
            path="/"
            element={
              <>
                <PageHeader
                  title="Batch Management"
                  buttonLabel="Add New Batch"
                  onButtonClick={() => navigate("/add-batch")}
                />
                <BatchTable />
              </>
            }
          />
          <Route path="/add-batch" element={<AddBatch />} />
        </Routes>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <Layout />
      <ToastContainer position="top-right" autoClose={3000} />
    </Router>
  );
};

export default App;
