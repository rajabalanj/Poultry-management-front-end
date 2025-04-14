import React from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.css";
import { mockBatches } from "../mocks/batchData";


const BatchTable: React.FC = () => {
  const navigate = useNavigate();

  const handleViewDetails = (batchNo: string) => {
    try {
      console.log('Attempting to view details for batch:', batchNo);
      
      // Validate batch number
      if (!batchNo) {
        console.error('Batch number is required');
        return;
      }

      // Construct the URL
      const detailsUrl = `/batch/${batchNo}/details`;
      console.log('Navigating to:', detailsUrl);

      // Navigate to the details page
      navigate(detailsUrl);
      
      console.log('Navigation successful');
    } catch (error) {
      console.error('Error in handleViewDetails:', error);
      // You could add a toast notification here
    }
  };

  return (
    <div className="table-responsive">
      <table className="table table-striped table-bordered align-middle">
        <thead className="table-light">
          <tr>
            <th>Batch No.</th>
            <th>Shed No.</th>
            <th>Age</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {mockBatches.map((batch) => (
            <tr key={batch.id}>
              <td>{batch.batchNo}</td>
              <td>{batch.shedNo}</td>
              <td>{batch.age}</td>
              <td>
                <button
                  className="btn btn-link p-0"
                  onClick={() => batch.id && handleViewDetails(batch.id)}
                  title="View Details"
                  aria-label={`View Details for Batch ${batch.batchNo}`}
                >
                  <i className="bi bi-eye"></i>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BatchTable;
