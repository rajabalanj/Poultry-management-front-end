import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { dailyBatchApi, compositionApi } from "../../../services/api";
import { DailyBatch } from "../../../types/daily_batch";
import { toast } from "react-toastify";
import PageHeader from "../../Layout/PageHeader";
import { Modal, Button } from "react-bootstrap";
import { CompositionResponse } from "../../../types/compositon";

interface UsageHistoryItem {
  id: number;
  composition_name: string;
  times: number;
}

const EditBatch: React.FC = () => {
  const navigate = useNavigate();
  const { batchId, batch_date } = useParams<{ batchId: string; batch_date: string }>();
  const [batch, setBatch] = useState<DailyBatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [batch_type, setBatchType] = useState<string>(); // Default to 'layer'
  const [compositions, setCompositions] = useState<CompositionResponse[]>([]);
  const [selectedCompositionId, setSelectedCompositionId] = useState<number | null>(null);
  const [timesToUse, setTimesToUse] = useState(1);
  const [usageHistory, setUsageHistory] = useState<UsageHistoryItem[]>([]);
  const [showRevertModal, setShowRevertModal] = useState(false);
  const [usageToRevert, setUsageToRevert] = useState<number | null>(null);

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

  const fetchUsageHistory = async () => {
    if (!batchId || !batch_date) return;
    try {
      const history = await compositionApi.getFilteredCompositionUsageHistory(
        batch_date,
        Number(batchId)
      );
      setUsageHistory(history);
    } catch (error) {
      toast.error("Failed to fetch feed usage history.");
    }
  };

  useEffect(() => { fetchUsageHistory(); }, [batchId, batch_date]);

  useEffect(() => {
    compositionApi.getCompositions().then((comps) => {
      setCompositions(comps);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batch || !batchId || !batch_date) return;
    try {
      const payload = {
        mortality: batch.mortality,
        culls: batch.culls,
        table_eggs: batch.table_eggs,
        jumbo: batch.jumbo,
        cr: batch.cr,
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

  const handleUseComposition = async () => {
    if (!selectedCompositionId || !batch) {
      toast.error("Please select a composition and ensure batch data is loaded.");
      return;
    }

    const selectedComposition = compositions.find(c => c.id === selectedCompositionId);
    if (!selectedComposition) {
      toast.error("Selected composition not found.");
      return;
    }

  // Use the batch's date so the composition usage is recorded for the batch day,
  // not necessarily today's date.
  const usedAt = batch.batch_date;
    try {
      await compositionApi.useComposition({
        compositionId: selectedComposition.id,
        times: timesToUse,
        usedAt,
        shedNo: batch.shed_no, // Pass batch.shed_no as shedNo
      });
      toast.success(`Used composition ${selectedComposition.name} ${timesToUse} time(s) for Batch ${batch?.batch_no}`);
      fetchUsageHistory(); // Refresh history
    } catch (err) {
      toast.error("Failed to use composition");
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
      />
      <div className="container-fluid">
        <div className="p-4">
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-primary text-white fw-bold d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Update Birds and Eggs</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="row">
                  {batch_type === 'Layer' && (
                    <>
                      <h4 className="mb-3 border-bottom pb-1 text-primary">
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
                  <h4 className="mb-3 border-bottom pb-1 text-primary">
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

          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white fw-bold d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Update Feed</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label htmlFor="compositionSelect" className="form-label">Select Composition:</label>
                <select
                  id="compositionSelect"
                  className="form-select form-select-sm"
                  value={selectedCompositionId || ""}
                  onChange={(e) => setSelectedCompositionId(Number(e.target.value))}
                >
                  <option value="">Select a Composition</option>
                  {compositions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="d-flex align-items-center gap-2 mb-2">
                <span>Times:</span>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => setTimesToUse((prev) => Math.max(1, prev - 1))}
                >
                  -
                </button>
                <span>{timesToUse}</span>
                <button
                  className="btn btn-success btn-sm"
                  onClick={() => setTimesToUse((prev) => prev + 1)}
                >
                  +
                </button>
              </div>

              <div className="d-flex gap-2">
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleUseComposition}
                >
                  Confirm
                </button>
              </div>

              {usageHistory.length > 0 && (
                <div className="mt-4">
                  <h6 className="mb-3">Feed Usage for this day</h6>
                  <div className="table-responsive">
                    <table className="table table-sm table-bordered">
                      <thead>
                        <tr>
                          <th>Composition</th>
                          <th>Times Used</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usageHistory.map((item) => (
                          <tr key={item.id}>
                            <td>{item.composition_name}</td>
                            <td>{item.times}</td>
                            <td>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => {
                                  setUsageToRevert(item.id);
                                  setShowRevertModal(true);
                                }}
                              >
                                Revert
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Modal show={showRevertModal} onHide={() => setShowRevertModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Revert</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to revert this composition usage? This action will restore the used feed quantities.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRevertModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={async () => {
            if (!usageToRevert) return;
            try {
              await compositionApi.revertCompositionUsage(usageToRevert);
              setUsageHistory(prev => prev.filter(h => h.id !== usageToRevert));
              toast.success("Reverted successfully");
            } catch (err: any) {
              toast.error(err.message || "Failed to revert");
            } finally {
              setShowRevertModal(false);
              setUsageToRevert(null);
            }
          }}>Revert</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default EditBatch;
