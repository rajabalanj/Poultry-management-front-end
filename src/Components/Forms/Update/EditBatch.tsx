import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { dailyBatchApi } from "../../../services/api";
import { DailyBatch } from "../../../types/daily_batch";
import { toast } from "react-toastify";
import PageHeader from "../../Layout/PageHeader";

const EditBatch: React.FC = () => {
  const navigate = useNavigate();
  const { batchId, batch_date } = useParams<{ batchId: string; batch_date: string }>();
  const [batch, setBatch] = useState<DailyBatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [batch_type, setBatchType] = useState<string>(); // Default to 'layer'

  useEffect(() => {
    const fetchBatch = async () => {
      try {
        if (!batchId || !batch_date) return;
        const batches = await dailyBatchApi.getDailyBatches(batch_date);
        const found = batches.find(b => b.batch_id === Number(batchId));
        if (found) {
          setBatch(found);
          setBatchType(found.batch_type);
        } else {
          setBatch(null);
        }
      } catch (err) {
        console.error("Error fetching daily batch:", err);
        setError("Failed to load batch");
        toast.error("Failed to load batch details");
      } finally {
        setLoading(false);
      }
    };
    fetchBatch();
  }, [batchId, batch_date]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batch || !batchId || !batch_date) return;
    try {
      const payload = {
        mortality: batch.mortality,
        culls: batch.culls,
        table_eggs: batch.table_eggs,
        jumbo: batch.jumbo,
        cr:  batch.cr,
        notes: batch.notes || "",
        standard_hen_day_percentage: batch.standard_hen_day_percentage ?? 0,
      };
      await dailyBatchApi.updateDailyBatch(Number(batchId), batch_date, payload);
      toast.success("Batch updated successfully");
      navigate(-1);
    } catch (err) {
      console.error("Error updating daily batch:", err);
      setError("Failed to update batch");
      toast.error("Failed to update batch");
    }
  };

  const handleNumberInput = (value: string, field: keyof DailyBatch) => {
    if (value === "") {
      setBatch((prev) => (prev ? { ...prev, [field]: "" as any } : null));
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

  const totalEggs = (batch.table_eggs || 0) + (batch.jumbo || 0) + (batch.cr || 0);

  return (
    <>
    <PageHeader
        title={new Intl.DateTimeFormat('en-GB').format(new Date(batch.batch_date)).replace(/\//g, '-')}
        subtitle={`Update Data ${batch.batch_no}`}
        buttonLabel="Back"
        buttonLink={`/`}
      />
    <div className="container-fluid">
      <div className="p-4">
        <form onSubmit={handleSubmit}>
          <div className="row">
            {batch_type === 'Layer' && (
              <>
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
                        value={batch.table_eggs}
                        min="0"
                        onChange={(e) => handleNumberInput(e.target.value, "table_eggs")}
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
                  <div className="bg-light p-4 rounded mb-4">
                    <div className="d-flex justify-content-between align-items-center">
                      <h5 className="mb-0">Total Eggs</h5>
                      <span className="h4 text-primary mb-0">{totalEggs}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
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
                  onChange={(e) => handleNumberInput(e.target.value, "mortality")}
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
            <div className="mb-4">
              <label className="form-label">Notes</label>
              <textarea
                className="form-control"
                value={batch.notes}
                onChange={(e) => setBatch((prev) => (prev ? { ...prev, notes: e.target.value } : null))}
              />
            </div>
            
          </div>
          <div className="mt-4 d-flex justify-content-center">
            <button type="submit" className="btn btn-success me-2">
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

export default EditBatch;
