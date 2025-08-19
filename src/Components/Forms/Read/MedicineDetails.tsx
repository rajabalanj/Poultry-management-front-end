import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { medicineApi } from "../../../services/api";
import { Medicine } from "../../../types/Medicine";
import { toast } from "react-toastify";
import PageHeader from "../../Layout/PageHeader";

const MedicineDetails: React.FC = () => {
  const { medicine_id } = useParams<{ medicine_id: string }>();
  const navigate = useNavigate();
  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMedicine = async () => {
      try {
        if (!medicine_id) return;
        const data = await medicineApi.getMedicine(Number(medicine_id));
        setMedicine(data);
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

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!medicine) return <div>Medicine not found</div>;

  // Add this console log before the return statement
  console.log("Medicine object in MedicineDetails:", medicine);
  console.log("medicine.id in MedicineDetails:", medicine?.id); // Use optional chaining for safety

  return (
    <>
    <PageHeader
        title={`Medicine Details - ${medicine.title}`}
        buttonLabel="Back"
        buttonLink="/medicine"
      />
    <div className="container-fluid">

      <div className="p-4">
        <div className="row justify-content-center">
          <div className="col-12 col-md-6">
            <div className="mb-4">
              <label className="form-label">Medicine Name</label>
              <input
                type="text"
                className="form-control"
                value={medicine.title}
                readOnly
              />
            </div>

            <div className="mb-4">
              <label className="form-label">Quantity</label>
              <input
                type="number"
                className="form-control"
                value={medicine.quantity}
                readOnly
              />
            </div>

            <div className="mb-4">
              <label className="form-label">Unit</label>
              <select className="form-control" value={medicine.unit} disabled>
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
                value={medicine.warningKGThreshold !== undefined ? medicine.warningKGThreshold : ''}
                readOnly
              />
            </div>

            <div className="mb-4">
              <label className="form-label">Warning Threshold (gram)</label>
              <input
                type="number"
                className="form-control"
                value={medicine.warningGramThreshold !== undefined ? medicine.warningGramThreshold : ''}
                readOnly
              />
            </div>

          </div>
        </div>

        <div className="mt-4 d-flex justify-content-center gap-3">
          <button
    type="button"
    className="btn btn-primary"
    onClick={() => navigate(`/medicine/${medicine.id}/audit`)}
  >
    View Report
  </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate(-1)}
          >
            Back
          </button>
        </div>
      </div>
    </div>
    </>
  );
};

export default MedicineDetails;