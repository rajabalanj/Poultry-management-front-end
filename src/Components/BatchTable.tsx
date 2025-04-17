import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.css";
import { batchApi, Batch } from "../services/api";
import '../styles/global.css';

// Separate components for better performance
const BatchTableRow: React.FC<{
  batch: Batch;
  onView: (id: number) => void;
  onEdit: (id: number) => void;
}> = React.memo(({ batch, onView, onEdit }) => (
  <tr>
    <td>{batch.batch_no}</td>
    <td>{batch.shed_no}</td>
    <td>{batch.age}</td>
    <td>{batch.opening_count}</td>
    <td>{batch.mortality}</td>
    <td>{batch.culls}</td>
    <td>
      <div className="d-flex gap-2">
        <button
          className="btn btn-link p-0 text-primary"
          onClick={() => onView(batch.id)}
          title="View Details"
          aria-label={`View Details for Batch ${batch.batch_no}`}
        >
          <i className="bi bi-eye"></i>
        </button>
        <button
          className="btn btn-link p-0 text-success"
          onClick={() => onEdit(batch.id)}
          title="Edit Batch"
          aria-label={`Edit Batch ${batch.batch_no}`}
        >
          <i className="bi bi-pencil-square"></i>
        </button>
      </div>
    </td>
  </tr>
));

const BatchCard: React.FC<{
  batch: Batch;
  onView: (id: number) => void;
  onEdit: (id: number) => void;
}> = React.memo(({ batch, onView, onEdit }) => (
  <div className="card mb-2 border shadow-sm">
    <div className="card-body p-2">
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <h6 className="mb-1 text-sm">Batch {batch.batch_no}</h6>
          <div className="text-muted text-xs">
            <span className="me-2">Shed: {batch.shed_no}</span>
            <span>Age: {batch.age}</span>
          </div>
        </div>
        <div className="d-flex gap-3">
          <button
            className="btn btn-link p-0 text-primary"
            onClick={() => onView(batch.id)}
            title="View Details"
            aria-label={`View Details for Batch ${batch.batch_no}`}
          >
            <i className="bi bi-eye icon-sm"></i>
          </button>
          <button
            className="btn btn-link p-0 text-success"
            onClick={() => onEdit(batch.id)}
            title="Edit Batch"
            aria-label={`Edit Batch ${batch.batch_no}`}
          >
            <i className="bi bi-pencil-square icon-sm"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
));

const BatchTable: React.FC = () => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize handlers
  const handleViewDetails = useCallback((id: number) => {
    if (!id) {
      console.error('Batch ID is required');
      return;
    }
    navigate(`/batch/${id}/details`);
  }, [navigate]);

  const handleEdit = useCallback((id: number) => {
    if (!id) {
      console.error('Batch ID is required');
      return;
    }
    navigate(`/batch/${id}/edit`);
  }, [navigate]);

  // Debounced resize handler
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsMobile(window.innerWidth < 768);
      }, 150);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  // Data fetching
  useEffect(() => {
    let mounted = true;
    
    const fetchBatches = async () => {
      try {
        const data = await batchApi.getBatches();
        if (mounted) {
          setBatches(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (mounted) {
          console.error('Error fetching batches:', err);
          setError('Failed to load batches');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchBatches();
    return () => { mounted = false; };
  }, []);

  // Memoize table headers
  const tableHeaders = useMemo(() => (
    <tr>
      <th>Batch No</th>
      <th>Shed No</th>
      <th>Age</th>
      <th>Opening Count</th>
      <th>Mortality</th>
      <th>Culls</th>
      <th>Actions</th>
    </tr>
  ), []);

  if (loading) return <div className="text-center">Loading...</div>;
  if (error) return <div className="text-center text-danger">{error}</div>;
  if (batches.length === 0) return <div className="text-center">No batches found</div>;

  if (isMobile) {
    return (
      <div className="px-2">
        {batches.map((batch) => (
          <BatchCard
            key={batch.id}
            batch={batch}
            onView={handleViewDetails}
            onEdit={handleEdit}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="table">
        <thead>{tableHeaders}</thead>
        <tbody>
          {batches.map((batch) => (
            <BatchTableRow
              key={batch.id}
              batch={batch}
              onView={handleViewDetails}
              onEdit={handleEdit}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BatchTable;
