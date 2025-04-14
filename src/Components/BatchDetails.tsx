import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { batchApi, Batch } from '../services/api';

const BatchDetails: React.FC = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('BatchDetails mounted with batchId:', batchId);

    const fetchBatchDetails = async () => {
      try {
        if (!batchId) {
          console.error('No batchId provided');
          setError('No batch ID provided');
          return;
        }

        console.log('Fetching batch details for ID:', batchId);
        const response = await batchApi.getBatch(batchId);
        console.log('Received batch data:', response.data);
        
        setBatch(response.data);
      } catch (err) {
        console.error('Error fetching batch details:', err);
        setError('Failed to load batch details');
      } finally {
        setLoading(false);
      }
    };

    fetchBatchDetails();
  }, [batchId]);

  if (loading) {
    console.log('Rendering loading state');
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    console.log('Rendering error state:', error);
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }

  if (!batch) {
    console.log('Rendering no batch found state');
    return (
      <div className="alert alert-warning" role="alert">
        Batch not found
      </div>
    );
  }

  console.log('Rendering batch details for:', batch);

  return (
    <div className="container mt-4">
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Batch Details</h4>
          <button
            className="btn btn-outline-secondary"
            onClick={() => navigate('/')}
          >
            Back to List
          </button>
        </div>
        <div className="card-body">
          {/* Basic Information */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Basic Information</h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <div className="d-flex justify-content-between border-bottom pb-2">
                    <span className="fw-bold">Batch Number:</span>
                    <span>{batch.batchNo}</span>
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="d-flex justify-content-between border-bottom pb-2">
                    <span className="fw-bold">Shed Number:</span>
                    <span>{batch.shedNo}</span>
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="d-flex justify-content-between border-bottom pb-2">
                    <span className="fw-bold">Age:</span>
                    <span>{batch.age}</span>
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="d-flex justify-content-between border-bottom pb-2">
                    <span className="fw-bold">Date:</span>
                    <span>{batch.date}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Count Information */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Count Information</h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <div className="d-flex justify-content-between border-bottom pb-2">
                    <span className="fw-bold">Opening Count:</span>
                    <span>{batch.openingCount}</span>
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="d-flex justify-content-between border-bottom pb-2">
                    <span className="fw-bold">Mortality:</span>
                    <span>{batch.mortality}</span>
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="d-flex justify-content-between border-bottom pb-2">
                    <span className="fw-bold">Culls:</span>
                    <span>{batch.culls}</span>
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="d-flex justify-content-between border-bottom pb-2">
                    <span className="fw-bold">Closing Count:</span>
                    <span>{batch.closingCount}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Egg Production */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Egg Production</h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <div className="d-flex justify-content-between border-bottom pb-2">
                    <span className="fw-bold">Table Eggs:</span>
                    <span>{batch.table}</span>
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="d-flex justify-content-between border-bottom pb-2">
                    <span className="fw-bold">Jumbo Eggs:</span>
                    <span>{batch.jumbo}</span>
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="d-flex justify-content-between border-bottom pb-2">
                    <span className="fw-bold">CR:</span>
                    <span>{batch.cr}</span>
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="d-flex justify-content-between border-bottom pb-2">
                    <span className="fw-bold">Total Eggs:</span>
                    <span>{batch.totalEggs}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="d-flex justify-content-end gap-2">
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/batch/${batchId}/edit`)}
            >
              Edit Batch
            </button>
            <button
              className="btn btn-danger"
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this batch?')) {
                  // Handle delete
                }
              }}
            >
              Delete Batch
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatchDetails; 