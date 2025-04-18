import React, { useState, useEffect } from 'react';
import HeaderCardGroup from './HeaderCardGroup';
import GraphsSection from './GraphsSection';
import BatchTable from '../BatchTable';
import { batchApi, Batch } from '../../services/api';

const Dashboard: React.FC = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const data = await batchApi.getBatches();
        setBatches(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching batches:', err);
        setError('Failed to load batches');
      } finally {
        setLoading(false);
      }
    };

    fetchBatches();
  }, []);

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col">
          <h4 className="mb-4">April 19, 2024</h4>
        </div>
      </div>
      
      <HeaderCardGroup batches={batches} loading={loading} error={error} />
      <div className="row mb-4">
        <div className="col">
          <div className="card shadow-sm">
            <div className="card-body">
              <h6 className="card-title mb-3">Batch Data</h6>
              <BatchTable batches={batches} loading={loading} error={error} />
            </div>
          </div>
        </div>
      </div>
      <GraphsSection />
    </div>
  );
};

export default Dashboard;