import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { medicineApi } from "../../../services/api";
import { toast } from "react-toastify";
import PageHeader from "../../Layout/PageHeader";
import { MedicineResponse } from "../../../types/Medicine"; // Adjust the import path as necessary

const EditMedicine: React.FC = () => {
  const { medicine_id } = useParams<{ medicine_id: string }>();
  const navigate = useNavigate();
  const [medicine, setMedicine] = useState<MedicineResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // New state for warning thresholds
  const [warningKGThreshold, setWarningKGThreshold] = useState<number | ''>('');
  const [warningGramThreshold, setWarningGramThreshold] = useState<number | ''>('');

  useEffect(() => {
    const fetchMedicine = async () => {
      try {
        if (!medicine_id) return;
        const data = await medicineApi.getMedicine(Number(medicine_id));
        setMedicine(data);
        // Initialize warning thresholds from fetched data
        setWarningKGThreshold(data.warningKGThreshold !== undefined ? data.warningKGThreshold : '');
        setWarningGramThreshold(data.warningGramThreshold !== undefined ? data.warningGramThreshold : '');
      } catch (err) {
        console.error("Error fetching medicine:", err);
        setError("Failed to load medicine");
        toast.error("Failed to load medicine details");
      } finally {
        setLoading(false);
      }
    };

    fetchMedicine();
  }, [medicine_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicine || !medicine_id) return;

    try {
      await medicineApi.updateMedicine(Number(medicine_id), {
        id: Number(medicine_id),
        title: medicine.title,
        quantity: medicine.quantity,
        unit: medicine.unit,
        createdDate: medicine.createdDate,
        warningKGThreshold: typeof warningKGThreshold === 'number' ? warningKGThreshold : undefined,
        warningGramThreshold: typeof warningGramThreshold === 'number' ? warningGramThreshold : undefined,
      });
      toast.success("Medicine updated successfully");
      navigate(-1);
    } catch (err) {
      console.error("Error updating medicine:", err);
      setError("Failed to update medicine");
      toast.error("Failed to update medicine");
    }
  };

  const handleInputChange = (value: string, field: keyof MedicineResponse) => {
    setMedicine((prev: MedicineResponse | null) => (prev ? { ...prev, [field]: value } : null));
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || (/^\d+(\.\d{0,2})?$/.test(value) && Number(value) >= 0)) {
        handleInputChange(value, "quantity");
    }
  };

  const handleWarningKgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || (/^\d+(\.\d{0,2})?$/.test(value) && Number(value) >= 0)) {
      setWarningKGThreshold(value === '' ? '' : Number(value));
      if (value !== '') {
        // Convert kg to gram (1 kg = 1000 grams)
        setWarningGramThreshold(Number(value) * 1000);
      } else {
        setWarningGramThreshold('');
      }
    }
  };

  const handleWarningGramChange = (e: React.ChangeEvent<HTMLInputElement>) => { // Renamed from handleWarningTonChange
    const value = e.target.value;
    if (value === '' || (/^\d+(\.\d{0,2})?$/.test(value) && Number(value) >= 0)) {
      setWarningGramThreshold(value === '' ? '' : Number(value));
      if (value !== '') {
        // Convert gram to kg (1 gram = 0.001 kg)
        setWarningKGThreshold(Number(value) / 1000);
      } else {
        setWarningKGThreshold('');
      }
    }
  };


  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!medicine) return <div>Medicine not found</div>;

  return (
    <>
    <PageHeader
        title={`Update Medicine ${medicine.title}`}
        buttonLabel="Back"
        buttonLink={`/medicine/${medicine_id}/details`}
      />
    <div className="container-fluid">
      <div className="p-4">
        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-12 col-md-6">
              <div className="mb-4">
                <label className="form-label">Medicine Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={medicine.title}
                  onChange={(e) => handleInputChange(e.target.value, "title")}
                />
              </div>

              <div className="mb-4">
                <label className="form-label">Quantity</label>
                <input
                  type="number"
                  className="form-control"
                  value={medicine.quantity}
                  onChange={handleQuantityChange}
                />
              </div>

              <div className="mb-4">
                <label className="form-label">Unit</label>
                <select
                  className="form-control"
                  value={medicine.unit}
                  onChange={(e) => handleInputChange(e.target.value, "unit")}
                >
                  <option value="kg">kg</option>
                  <option value="gram">gram</option>
                </select>
              </div>

              {/* New Warning Threshold Fields */}
              <div className="mb-4">
                <label className="form-label">Warning Threshold (kg)</label>
                <input
                  type="number"
                  className="form-control"
                  value={warningKGThreshold}
                  onChange={handleWarningKgChange}
                  placeholder="e.g., 2000"
                />
              </div>

              <div className="mb-4">
                <label className="form-label">Warning Threshold (gram)</label>
                <input
                  type="number"
                  className="form-control"
                  value={warningGramThreshold}
                  onChange={handleWarningGramChange}
                  placeholder="e.g., 2"
                />
              </div>

            </div>
          </div>

          <div className="mt-4 d-flex justify-content-center">
            <button type="submit" className="btn btn-primary me-2">
              Save Changes
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate(-1)}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  );
};

export default EditMedicine;