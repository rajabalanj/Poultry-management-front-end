import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.css";
import { mockBatches } from "../mocks/batchData";
import '../styles/global.css';

const BatchTable: React.FC = () => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleViewDetails = (batchNo: string) => {
    try {
      console.log('Attempting to view details for batch:', batchNo);
      
      if (!batchNo) {
        console.error('Batch number is required');
        return;
      }

      const detailsUrl = `/batch/${batchNo}/details`;
      console.log('Navigating to:', detailsUrl);
      navigate(detailsUrl);
      
      console.log('Navigation successful');
    } catch (error) {
      console.error('Error in handleViewDetails:', error);
    }
  };

  const handleEdit = (batchNo: string) => {
    try {
      if (!batchNo) {
        console.error('Batch number is required');
        return;
      }

      navigate(`/batch/${batchNo}/edit`);
    } catch (error) {
      console.error('Error in handleEdit:', error);
    }
  };

  if (isMobile) {
    return (
      <div className="px-2">
        {mockBatches.map((batch) => (
          <div key={batch.id} className="card mb-2 border shadow-sm">
            <div className="card-body p-2">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-1 text-sm">Batch {batch.batchNo}</h6>
                  <div className="text-muted text-xs">
                    <span className="me-2">Shed: {batch.shedNo}</span>
                    <span>Age: {batch.age}</span>
                  </div>
                </div>
                <div className="d-flex gap-3">
                  <button
                    className="btn btn-link p-0 text-primary"
                    onClick={() => batch.id && handleViewDetails(batch.id)}
                    title="View Details"
                    aria-label={`View Details for Batch ${batch.batchNo}`}
                  >
                    <i className="bi bi-eye icon-sm"></i>
                  </button>
                  <button
                    className="btn btn-link p-0 text-success"
                    onClick={() => batch.id && handleEdit(batch.id)}
                    title="Edit Batch"
                    aria-label={`Edit Batch ${batch.batchNo}`}
                  >
                    <i className="bi bi-pencil-square icon-sm"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="table table-hover table-bordered align-middle text-sm">
        <thead className="table-light">
          <tr>
            <th className="text-sm">Batch No.</th>
            <th className="text-sm">Shed No.</th>
            <th className="text-sm">Age</th>
          </tr>
        </thead>
        <tbody>
          {mockBatches.map((batch) => (
            <tr key={batch.id} className="position-relative">
              <td className="text-sm">{batch.batchNo}</td>
              <td className="text-sm">{batch.shedNo}</td>
              <td className="text-sm">{batch.age}</td>
              <td className="action-buttons position-absolute end-0 top-50 translate-middle-y pe-3 d-none">
                <div className="d-flex gap-3">
                  <button
                    className="btn btn-link p-0 text-primary"
                    onClick={() => batch.id && handleViewDetails(batch.id)}
                    title="View Details"
                    aria-label={`View Details for Batch ${batch.batchNo}`}
                  >
                    <i className="bi bi-eye icon-sm"></i>
                  </button>
                  <button
                    className="btn btn-link p-0 text-success"
                    onClick={() => batch.id && handleEdit(batch.id)}
                    title="Edit Batch"
                    aria-label={`Edit Batch ${batch.batchNo}`}
                  >
                    <i className="bi bi-pencil-square icon-sm"></i>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <style>
        {`
          .table tr {
            position: relative;
          }
          .table tr:hover .action-buttons {
            display: flex !important;
          }
          .action-buttons {
            background: white;
            padding: 4px 8px;
            border-radius: 4px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            z-index: 1;
          }
          .btn-link:hover {
            opacity: 0.8;
            transform: scale(1.1);
            transition: all 0.2s;
          }
          .icon-sm {
            font-size: 1.1rem;
          }
          .text-xs {
            font-size: 0.75rem;
          }
        `}
      </style>
    </div>
  );
};

export default BatchTable;
