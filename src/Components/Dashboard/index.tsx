import React from 'react';
import HeaderCardGroup from './HeaderCardGroup';
import GraphsSection from './GraphsSection';
import BatchTable from '../BatchTable';

const Dashboard: React.FC = () => {
  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col">
          <h4 className="mb-4">April 19, 2024</h4>
        </div>
      </div>
      
      <HeaderCardGroup />
      <div className="row mb-4">
        <div className="col">
          <div className="card shadow-sm">
            <div className="card-body">
              <h6 className="card-title mb-3">Batch Data</h6>
              <BatchTable />
            </div>
          </div>
        </div>
      </div>
      <GraphsSection />
    </div>
  );
};

export default Dashboard; 