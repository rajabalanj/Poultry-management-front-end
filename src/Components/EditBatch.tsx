import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { batchApi, Batch } from "../services/api";
import { toast } from "react-toastify";
import PageHeader from "./PageHeader";

const EditBatch: React.FC = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBatch = async () => {
      try {
        if (!batchId) return;
        const data = await batchApi.getBatch(Number(batchId));
        setBatch(data);
      } catch (err) {
        console.error("Error fetching batch:", err);
        setError("Failed to load batch");
        toast.error("Failed to load batch details");
      } finally {
        setLoading(false);
      }
    };

    fetchBatch();
  }, [batchId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batch || !batchId) return;

    try {
      await batchApi.updateBatch(Number(batchId), {
        mortality: batch.mortality,
        culls: batch.culls,
        table: batch.table,
        jumbo: batch.jumbo,
        cr: batch.cr,
        date: new Date().toISOString().split('T')[0],
        //date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
      toast.success("Batch updated successfully");
      navigate(-1);
    } catch (err) {
      console.error("Error updating batch:", err);
      setError("Failed to update batch");
      toast.error("Failed to update batch");
    }
  };

  const handleNumberInput = (value: string, field: keyof Batch) => {
    if (value === "") {
      setBatch((prev) => (prev ? { ...prev, [field]: "" } : null));
      return;
    }

    const num = parseInt(value);
    if (isNaN(num)) {
      return;
    }

    if (num < 0) {
      toast.error(
        `${field.charAt(0).toUpperCase() + field.slice(1)} cannot be negative`
      );
      return;
    }

    setBatch((prev) => (prev ? { ...prev, [field]: num } : null));
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!batch) return <div>Batch not found</div>;

  const totalEggs = (batch.table || 0) + (batch.jumbo || 0) + (batch.cr || 0);

  return (
    <div className="container-fluid">
      <PageHeader
        title={`Update Data ${batch.batch_no}`}
        buttonLabel="Back"
        buttonLink={`/batch/${batchId}/details`}
      />

      <div className="p-4">
        <form onSubmit={handleSubmit}>
          <div className="row">
            <h4 className="fw-semibold mb-3 border-bottom pb-1 text-primary">
              Birds
            </h4>
            <div className="col-12 col-md-6">
              <div className="mb-4">
                <label className="form-label">Mortality</label>
                <input
                  type="number"
                  className="form-control"
                  value={batch.mortality}
                  min="0"
                  onChange={(e) =>
                    handleNumberInput(e.target.value, "mortality")
                  }
                />
              </div>

              <div className="mb-4">
                <label className="form-label">Culls</label>
                <input
                  type="number"
                  className="form-control"
                  value={batch.culls}
                  min="0"
                  onChange={(e) => handleNumberInput(e.target.value, "culls")}
                />
              </div>
            </div>
            <h4 className="fw-semibold mb-3 border-bottom pb-1 text-primary">
              Eggs
            </h4>

            <div className="col-12 col-md-6">
              <div className="row g-3 mb-4">
                <div className="col-6">
                  <label className="form-label">Table</label>
                  <input
                    type="number"
                    className="form-control"
                    value={batch.table}
                    min="0"
                    onChange={(e) => handleNumberInput(e.target.value, "table")}
                  />
                </div>
                <div className="col-6">
                  <label className="form-label">Jumbo</label>
                  <input
                    type="number"
                    className="form-control"
                    value={batch.jumbo}
                    min="0"
                    onChange={(e) => handleNumberInput(e.target.value, "jumbo")}
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label">CR</label>
                <input
                  type="number"
                  className="form-control"
                  value={batch.cr}
                  min="0"
                  onChange={(e) => handleNumberInput(e.target.value, "cr")}
                />
              </div>

              <div className="bg-light p-4 rounded">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Total Eggs</h5>
                  <span className="h4 text-primary mb-0">{totalEggs}</span>
                </div>
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
  );
};

export default EditBatch;
