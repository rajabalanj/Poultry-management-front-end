import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.css";
import PageHeader from "./Layout/PageHeader";
import { Modal, Button } from "react-bootstrap";
import { medicineApi, configApi } from "../services/api"; // Ensure configApi is imported
import { MedicineResponse } from '../types/Medicine';
import { toast } from 'react-toastify';

const MedicineCard: React.FC<{
  medicine: MedicineResponse;
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  lowKGThreshold: number; // Prop for global threshold
  lowGramThreshold: number; // Prop for global threshold
}> = React.memo(({ medicine, onView, onEdit, onDelete, lowKGThreshold, lowGramThreshold }) => {
  // Use medicine-specific thresholds if available, otherwise fall back to global ones
   const effectiveLowKGThreshold = medicine.warningKGThreshold ?? lowKGThreshold;
  const effectiveLowGramThreshold = medicine.warningGramThreshold ?? lowGramThreshold;

  const isLow = (medicine.unit === 'kg' && effectiveLowKGThreshold !== undefined && Number(medicine.quantity) < effectiveLowKGThreshold) ||
                (medicine.unit === 'gram' && effectiveLowGramThreshold !== undefined && Number(medicine.quantity) < effectiveLowGramThreshold);

  return (
    <div className={`card mb-2 border shadow-sm ${isLow ? 'border-warning' : ''}`} style={isLow ? { background: '#fff0f0' } : {}}>
      <div className="card-body p-2">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h6 className="mb-1 text-sm">Title {medicine.title}</h6>
            <div className="text-xs">
              <span className={`me-2 ${isLow ? 'text-warning fw-bold' : ''}`}>Quantity: {medicine.quantity}{' '}
              <span>{medicine.unit}</span></span>
              {/* Display per-medicine warning thresholds if they exist */}
              {medicine.warningKGThreshold !== undefined && (
                <p className="mb-0 text-xs">Per-medicine Warning (kg): {medicine.warningKGThreshold}</p>
              )}
              {medicine.warningGramThreshold !== undefined && (
                <p className="mb-0 text-xs">Per-medicine Warning (gram): {medicine.warningGramThreshold}</p>
              )}
              {/* Optionally, display the effective global thresholds if no per-medicine is set, for debugging */}
              {medicine.warningKGThreshold === undefined && lowKGThreshold !== undefined && (
                <p className="mb-0 text-xs">(Global fallback Warning (kg): {lowKGThreshold})</p>
              )}
              {medicine.warningGramThreshold === undefined && lowGramThreshold !== undefined && (
                <p className="mb-0 text-xs">(Global fallback Warning (ton): {lowGramThreshold})</p>
              )}
            </div>
          </div>
          <div className="d-flex flex-column flex-md-row gap-2">
            <button
              className="btn btn-primary btn-sm d-flex align-items-center justify-content-center"
              onClick={() => onView(medicine.id)}
              title="View Details"
              aria-label={`View Details for Medicine ${medicine.title}`}
            >
              <i className="bi bi-eye me-1"></i>
              <span className="text-xs">Medicine Details</span>
            </button>
            <button
              className="btn btn-success btn-sm d-flex align-items-center justify-content-center"
              onClick={() => onEdit(medicine.id)}
              title="Edit Medicine"
              aria-label={`Edit Medicine ${medicine.title}`}
            >
              <i className="bi bi-pencil-square me-1"></i>
              <span className="text-xs">Edit Medicine</span>
            </button>
            <button
              className="btn btn-danger btn-sm d-flex align-items-center justify-content-center"
              onClick={() => onDelete(medicine.id)}
              title="Delete Medicine"
              aria-label={`Delete Medicine ${medicine.title}`}
            >
              <i className="bi bi-trash me-1"></i>
              <span className="text-xs">Delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

interface MedicineTableProps {
  medicines: MedicineResponse[];
  loading: boolean;
  error: string | null;
  onDelete: (id: number) => void;
  lowKGThreshold: number; // Prop from MedicineListPage
  lowGramThreshold: number; // Prop from MedicineListPage
}

const MedicineTable: React.FC<MedicineTableProps> = ({ medicines, loading, error, onDelete, lowKGThreshold, lowGramThreshold }) => {
  const navigate = useNavigate();

  const handleViewDetails = useCallback(
    (id: number) => {
      if (!id) {
        console.error("Medicine ID is required");
        return;
      }
      navigate(`/medicine/${id}/details`);
    },
    [navigate]
  );

  const handleEdit = useCallback(
    (id: number) => {
      if (!id) {
        console.error("Medicine ID is required");
        return;
      }
      navigate(`/medicine/${id}/edit`);
    },
    [navigate]
  );

  const medicineCards = useMemo(() => {
    return medicines.map((medicine) => (
      <MedicineCard
        key={medicine.id}
        medicine={medicine}
        onView={handleViewDetails}
        onEdit={handleEdit}
        onDelete={onDelete}
        lowKGThreshold={lowKGThreshold} // Pass global threshold to MedicineCard
        lowGramThreshold={lowGramThreshold} // Pass global threshold to MedicineCard
      />
    ));
  }, [medicines, handleViewDetails, handleEdit, onDelete, lowKGThreshold, lowGramThreshold]);

  if (loading) return <div className="text-center">Loading...</div>;
  if (error) return <div className="text-center text-danger">{error}</div>;
  if (medicines.length === 0) return <div className="text-center">No medicines found</div>;

  return <div className="px-2">{medicineCards}</div>;
};

const MedicineListPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [medicines, setMedicines] = useState<MedicineResponse[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [medicineToDelete, setMedicineToDelete] = useState<number | null>(null);
  // States for global thresholds, initialized with defaults
  const [lowKGThreshold, setLowKgThreshold] = useState(3000);
  const [lowGramThreshold, setLowTonThreshold] = useState(3);

  // Effect to fetch global configuration for thresholds
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const configs = await configApi.getAllConfigs();
        const kgConfig = configs.find(c => c.name === 'lowKgThreshold');
        const tonConfig = configs.find(c => c.name === 'lowTonThreshold');
        // Update states with fetched values or keep defaults
        setLowKgThreshold(kgConfig ? Number(kgConfig.value) : 3000);
        setLowTonThreshold(tonConfig ? Number(tonConfig.value) : 3);
      } catch (err: any) {
        toast.error(err.message || 'Failed to load configuration');
      }
    };
    fetchConfig();
  }, []); // Run once on component mount

  // Effect to fetch medicine list
  useEffect(() => {
    const fetchMedicineList = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await medicineApi.getMedicines();
        const medicines = response.map((medicine) => ({
          id: medicine.id,
          title: medicine.title,
          quantity: medicine.quantity,
          unit: medicine.unit,
          createdDate: medicine.createdDate,
          warningKGThreshold: medicine.warningKGThreshold,
          warningGramThreshold: medicine.warningGramThreshold,
        }));
        setMedicines(medicines);
      } catch (error: any) {
        setError(error?.message || 'Failed to fetch medicine list');
        toast.error(error?.message || 'Failed to fetch medicine list');
      } finally {
        setLoading(false);
      }
    };
    fetchMedicineList();
  }, []); // Run once on component mount

  const handleDelete = useCallback((id: number) => {
    setMedicineToDelete(id);
    setShowDeleteModal(true);
  }, []);

  const confirmDelete = async () => {
    if (medicineToDelete !== null) {
      try {
        await medicineApi.deleteMedicine(medicineToDelete);
        setMedicines((prevMedicines) => prevMedicines.filter((medicine) => medicine.id !== medicineToDelete));
        toast.success("Medicine deleted successfully!");
      } catch (error: any) {
        setError(error?.message || 'Failed to delete medicine');
        toast.error(error?.message || 'Failed to delete medicine');
      } finally {
        setMedicineToDelete(null);
        setShowDeleteModal(false);
      }
    }
  };

  const cancelDelete = () => {
    setMedicineToDelete(null);
    setShowDeleteModal(false);
  };

  return (
    <div>
      <PageHeader title="Medicine List" buttonLabel="Create Medicine" buttonLink="/create-medicine" />
      <MedicineTable
        medicines={medicines}
        loading={loading}
        error={error}
        onDelete={handleDelete}
        lowKGThreshold={lowKGThreshold} // Pass global threshold to MedicineTable
        lowGramThreshold={lowGramThreshold} // Pass global threshold to MedicineTable
      />
      <Modal show={showDeleteModal} onHide={cancelDelete}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to delete this medicine?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={cancelDelete}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default MedicineListPage;