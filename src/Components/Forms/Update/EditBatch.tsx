import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { dailyBatchApi, compositionApi } from "../../../services/api";
import { DailyBatch } from "../../../types/daily_batch";
import { toast } from "react-toastify";
import PageHeader from "../../Layout/PageHeader";
import { Modal, Button } from "react-bootstrap";
import { CompositionResponse } from "../../../types/compositon";
import Loading from '../../Common/Loading';
import { useEscapeKey } from '../../../hooks/useEscapeKey';
import CustomDatePicker from "../../Common/CustomDatePicker";
import StyledSelect from "../../Common/StyledSelect";

interface UsageHistoryItem {
  id: number;
  composition_name: string;
  times: number;
}

const EditBatch: React.FC = () => {
  const navigate = useNavigate();
  const { batchId, batch_date } = useParams<{ batchId: string; batch_date: string }>();
  useEscapeKey();
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
    const fetchData = async () => {
      if (!batchId || !batch_date) return;
      setLoading(true);
      try {
        const [batches, history] = await Promise.all([
          dailyBatchApi.getDailyBatches(batch_date),
          compositionApi.getFilteredCompositionUsageHistory(batch_date, Number(batchId))
        ]);

        const found = batches.find(b => b.batch_id === Number(batchId));
        if (found) {
          setBatch(found);
          setBatchType(found.batch_type);
        } else {
          setBatch(null);
        }
        setUsageHistory(history);
      } catch (err) {
        console.error("Error fetching batch data:", err);
        setError("Failed to load batch data");
        toast.error("Failed to load batch details");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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

  useEffect(() => {
    compositionApi.getCompositions().then((comps) => {
      setCompositions(comps);
    });
  }, []);

  const handleDateChange = (newDate: Date | null) => {
    if (batchId && newDate) {
      const formattedDate = newDate.toISOString().split('T')[0];
      navigate(`/batch/${batchId}/${formattedDate}/edit`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batch || !batchId || !batch_date) return;
    try {
      const payload: Partial<DailyBatch> = {
        mortality: batch.mortality,
        culls: batch.culls,
        table_eggs: batch.table_eggs,
        jumbo: batch.jumbo,
        cr: batch.cr,
        notes: batch.notes || "",
        standard_hen_day_percentage: batch.standard_hen_day_percentage ?? 0,
        birds_added: batch.birds_added,
      };
      await dailyBatchApi.updateDailyBatch(Number(batchId), batch_date, payload);
      toast.success("Batch updated successfully");
      navigate(-1);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update batch";
      console.error("Error updating daily batch:", err);
      setError(message);
      toast.error(message);
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
  const usedAtDate = batch.batch_date.split('T')[0];
  const usedAt = `${usedAtDate}T00:00:00`;
    try {
      await compositionApi.useComposition({
        compositionId: selectedComposition.id,
        times: timesToUse,
        usedAt,
        batch_no: batch.batch_no, // Pass batch.batch_no as batch_no
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

  if (loading) return <Loading message="Loading data..." />;
  if (error) return <div>{error}</div>;
  if (!batch) return <div>Batch not found</div>;

  const totalEggs = (batch.table_eggs || 0) + (batch.jumbo || 0) + (batch.cr || 0);

  return (
    <>
      <PageHeader
        subtitle={`Update ${batch.batch_no}`}
        buttonLabel="Back"
        buttonIcon="bi-arrow-left"
      />
      <div className="container mt-4">
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <div className="mb-4">
              <div className="d-flex align-items-center">
                <label className="form-label me-3 mb-0">Batch Date</label>
                <div style={{ maxWidth: "200px" }}>
                  <CustomDatePicker
                    selected={batch_date ? new Date(batch_date) : null}
                    onChange={(date: Date | null) => handleDateChange(date)}
                    maxDate={new Date()}
                    placeholderText="Select a date"
                    className="w-100"
                  />
                </div>
              </div>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="row">
                {/* Birds Section */}
                <div className="col-lg-6">
                  <div className="card shadow-sm mb-4">
                    <div className="card-header bg-primary text-white">
                      <h5 className="mb-0">Birds</h5>
                    </div>
                    <div className="card-body">
                      <div className="mb-3">
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
                      <div className="mb-3">
                        <label className="form-label">Culls</label>
                        <input
                          type="number"
                          className="form-control"
                          value={batch.culls}
                          min="0"
                          onChange={(e) =>
                            handleNumberInput(e.target.value, "culls")
                          }
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Birds Added</label>
                        <input
                          type="number"
                          className="form-control"
                          value={batch.birds_added || ""}
                          min="0"
                          onChange={(e) =>
                            handleNumberInput(e.target.value, "birds_added")
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Eggs Section */}
                {batch_type === "Layer" && (
                  <div className="col-lg-6">
                    <div className="card shadow-sm mb-4">
                      <div className="card-header bg-primary text-white">
                        <h5 className="mb-0">Eggs</h5>
                      </div>
                      <div className="card-body">
                        <div className="row g-3">
                          <div className="col-md-4">
                            <label className="form-label">Table</label>
                            <input
                              type="number"
                              className="form-control"
                              value={batch.table_eggs}
                              min="0"
                              onChange={(e) =>
                                handleNumberInput(e.target.value, "table_eggs")
                              }
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">Jumbo</label>
                            <input
                              type="number"
                              className="form-control"
                              value={batch.jumbo}
                              min="0"
                              onChange={(e) =>
                                handleNumberInput(e.target.value, "jumbo")
                              }
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">CR</label>
                            <input
                              type="number"
                              className="form-control"
                              value={batch.cr}
                              min="0"
                              onChange={(e) =>
                                handleNumberInput(e.target.value, "cr")
                              }
                            />
                          </div>
                        </div>
                        <div className="bg-light p-3 rounded mt-3">
                          <div className="d-flex justify-content-between align-items-center">
                            <h6 className="mb-0">Total Eggs</h6>
                            <span className="h5 mb-0">{totalEggs}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes Section */}
                <div className="col-12">
                  <div className="card shadow-sm mb-4">
                    <div className="card-header bg-primary text-white">
                      <h5 className="mb-0">Notes</h5>
                    </div>
                    <div className="card-body">
                      <textarea
                        className="form-control"
                        value={batch.notes || ""}
                        placeholder="Optional daily notes, details, or observations..."
                        onChange={(e) =>
                          setBatch((prev) =>
                            prev ? { ...prev, notes: e.target.value } : null,
                          )
                        }
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 d-flex justify-content-center">
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

        {/* Update Feed Section */}
        <div className="card shadow-sm mb-4">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">Update Feed</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <label htmlFor="compositionSelect" className="form-label">
                    Select Composition:
                  </label>
                  <StyledSelect
                    id="compositionSelect"
                    value={
                      selectedCompositionId
                        ? compositions.find(
                            (c) => c.id === selectedCompositionId,
                          )
                          ? {
                              value: selectedCompositionId,
                              label:
                                compositions.find(
                                  (c) => c.id === selectedCompositionId,
                                )?.name || "",
                            }
                          : null
                        : null
                    }
                    onChange={(option) =>
                      setSelectedCompositionId(
                        option ? Number(option.value) : null,
                      )
                    }
                    options={compositions.map((c) => ({
                      value: c.id,
                      label: c.name,
                    }))}
                    placeholder="Select a Composition"
                    isClearable
                  />
                </div>
                <div className="d-flex align-items-center gap-2 mb-3">
                  <span>Times:</span>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() =>
                      setTimesToUse((prev) => Math.max(1, prev - 1))
                    }
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
                <button
                  className="btn btn-primary"
                  onClick={handleUseComposition}
                >
                  Confirm
                </button>
              </div>
              <div className="col-md-6">
                {usageHistory.length > 0 && (
                  <div className="mt-3 mt-md-0">
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
      </div>
      <Modal show={showRevertModal} onHide={() => setShowRevertModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Revert</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to revert this composition usage? This action
          will restore the used feed quantities.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRevertModal(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={async () => {
              if (!usageToRevert) return;
              try {
                await compositionApi.revertCompositionUsage(usageToRevert);
                setUsageHistory((prev) =>
                  prev.filter((h) => h.id !== usageToRevert),
                );
                toast.success("Reverted successfully");
              } catch (err: any) {
                toast.error(err.message || "Failed to revert");
              } finally {
                setShowRevertModal(false);
                setUsageToRevert(null);
              }
            }}
          >
            Revert
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default EditBatch;
