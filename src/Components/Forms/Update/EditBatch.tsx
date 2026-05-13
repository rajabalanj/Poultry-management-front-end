﻿import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { dailyBatchApi, compositionApi, inventoryItemApi } from "../../../services/api";
import { DailyBatch } from "../../../types/daily_batch";
import { toast } from "react-toastify";
import PageHeader from "../../Layout/PageHeader";
import { Modal, Button } from "react-bootstrap";
import { CompositionResponse } from "../../../types/compositon";
import Loading from '../../Common/Loading';
import { useEscapeKey } from '../../../hooks/useEscapeKey';
import CustomDatePicker from "../../Common/CustomDatePicker";
import StyledSelect from "../../Common/StyledSelect";
import { InventoryItemUsageResponse } from "../../../types/InventoryItemUsage";
import { InventoryItemResponse } from "../../../types/InventoryItem";
import { useSubscription } from '../../context/SubscriptionContext';
import SubscriptionWarning from "../../Common/SubscriptionWarning";

interface UsageHistoryItem {
  id: number;
  composition_name: string;
  times: number;
}

const EditBatch: React.FC = () => {
  const navigate = useNavigate();
  const { batchId, batch_date } = useParams<{ batchId: string; batch_date: string }>();
  useEscapeKey(() => navigate(-1));
  const [batch, setBatch] = useState<DailyBatch | null>(null);
  const [initialBatch, setInitialBatch] = useState<DailyBatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [batch_type, setBatchType] = useState<string>(); // Default to 'layer'
  const [compositions, setCompositions] = useState<CompositionResponse[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItemResponse[]>([]);
  const [selectedCompositionId, setSelectedCompositionId] = useState<number | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [selectedItemUnit, setSelectedItemUnit] = useState<string>("");
  const [itemQuantityToUse, setItemQuantityToUse] = useState<number | "">("");
  const [timesToUse, setTimesToUse] = useState(1);
  const [usageHistory, setUsageHistory] = useState<UsageHistoryItem[]>([]);
  const [itemUsageHistory, setItemUsageHistory] = useState<InventoryItemUsageResponse[]>([]);
  const [showRevertModal, setShowRevertModal] = useState(false);
  const [usageToRevert, setUsageToRevert] = useState<number | null>(null);
  const [revertType, setRevertType] = useState<'composition' | 'item' | null>(null);
  const { isSubscriptionPaid } = useSubscription();
  const [showUsageHistoryModal, setShowUsageHistoryModal] = useState(false);
  
  useEffect(() => {
    const fetchData = async () => {
      if (!batchId || !batch_date) return;
      setLoading(true);
      try {
        const [batches, history, itemHistory] = await Promise.all([
          dailyBatchApi.getDailyBatches(batch_date),
          compositionApi.getFilteredCompositionUsageHistory(batch_date, Number(batchId))
            .catch(err => { console.warn("Composition history failed:", err); return []; }),
          inventoryItemApi.getFilteredInventoryUsageHistory(batch_date, Number(batchId))
            .catch(err => { console.warn("Inventory history failed:", err); return []; })
        ]);

        const found = batches.find(b => b.batch_id === Number(batchId));
        if (found) {
          setBatch(found);
          setInitialBatch(found);
          setBatchType(found.batch_type);
        } else {
          setBatch(null);
        }
        setUsageHistory(history);
        setItemUsageHistory(itemHistory);
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

  useEffect(() => {
    compositionApi.getCompositions().then((comps) => {
      setCompositions(comps);
    });
    inventoryItemApi.getInventoryItems(0, 100).then((res) => {
      setInventoryItems(res.filter((item) => item.category.toString() !== "Supplies"));
    }).catch(err => console.warn("Inventory items fetch failed:", err));
  }, []);

  const handleDateChange = (newDate: Date | null) => {
    if (batchId && newDate) {
      const formattedDate = newDate.toISOString().split('T')[0];
      navigate(`/batch/${batchId}/${formattedDate}/edit`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batch || !initialBatch || !batchId || !batch_date) return;

    let hasErrors = false;
    let madeChanges = false;

    const hasBatchChanges = 
      batch.mortality !== initialBatch.mortality ||
      batch.culls !== initialBatch.culls ||
      batch.birds_added !== initialBatch.birds_added ||
      batch.table_eggs !== initialBatch.table_eggs ||
      batch.jumbo !== initialBatch.jumbo ||
      batch.cr !== initialBatch.cr ||
      (batch.notes || "") !== (initialBatch.notes || "");

    // Handle Use Composition
    if (selectedCompositionId) {
      const selectedComposition = compositions.find(c => c.id === selectedCompositionId);
      if (selectedComposition) {
        try {
          const usedAtDate = batch.batch_date.split('T')[0];
          const usedAt = `${usedAtDate}T00:00:00`;
          await compositionApi.useComposition({
            compositionId: selectedComposition.id,
            times: timesToUse,
            usedAt,
            batch_no: batch.batch_no,
          });
          toast.success("Composition used successfully");
          madeChanges = true;
        } catch (err: any) {
          toast.error(err.message || "Failed to use composition");
          hasErrors = true;
        }
      }
    }

    // Handle Use Item
    if (selectedItemId && itemQuantityToUse) {
      const selectedItem = inventoryItems.find(i => i.id === selectedItemId);
      if (selectedItem) {
        try {
          const usedAtDate = batch.batch_date.split('T')[0];
          const usedAt = `${usedAtDate}T00:00:00`;
          await inventoryItemApi.useInventoryItem({
            inventory_item_id: selectedItem.id,
            batch_no: batch.batch_no,
            used_quantity: Number(itemQuantityToUse),
            usedAt,
            unit: (selectedItemUnit || selectedItem.unit) as any,
          });
          toast.success("Inventory item used successfully");
          madeChanges = true;
        } catch (err: any) {
          toast.error(err.message || "Failed to use inventory item");
          hasErrors = true;
        }
      }
    }

    if (hasBatchChanges) {
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
        toast.success("Batch details updated successfully");
        madeChanges = true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update batch";
        console.error("Error updating daily batch:", err);
        setError(message);
        toast.error(message);
        hasErrors = true;
      }
    }

    if (!hasBatchChanges && !selectedCompositionId && (!selectedItemId || !itemQuantityToUse)) {
      toast.info("No changes to update.");
      return;
    }

    if (!hasErrors && madeChanges) {
      navigate(-1);
    } else if (hasErrors) {
      if (batchId && batch_date) {
        compositionApi.getFilteredCompositionUsageHistory(batch_date, Number(batchId))
          .then(setUsageHistory)
          .catch(console.warn);
        inventoryItemApi.getFilteredInventoryUsageHistory(batch_date, Number(batchId))
          .then(setItemUsageHistory)
          .catch(console.warn);
      }
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
      <div className="container">
        <SubscriptionWarning />
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
                            <label className="form-label">Crack</label>
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
              </div>
              
              {/* Record Feed & Items Usage Section */}
              <div className="row">
                <div className="col-12">
              <div className="card shadow-sm mb-4">
                    <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                      <h5 className="mb-0">Record Feed & Items Usage</h5>
                      <Button variant="light" size="sm" onClick={() => setShowUsageHistoryModal(true)}>
                        <i className="bi bi-clock-history me-1"></i>
                        Usage History
                      </Button>
                    </div>
                    <div className="card-body">
                      <div className="row">
                        <div className="col-md-6 border-end">
                          <h6>Use Composition</h6>
                          <div className="mb-3">
                            <label htmlFor="compositionSelect" className="form-label">
                              Select Composition:
                            </label>
                            <StyledSelect
                              id="compositionSelect"
                              value={
                                selectedCompositionId
                                  ? compositions.find((c) => c.id === selectedCompositionId)
                                    ? {
                                        value: selectedCompositionId,
                                        label: compositions.find((c) => c.id === selectedCompositionId)?.name || "",
                                      }
                                    : null
                                  : null
                              }
                              onChange={(option) => setSelectedCompositionId(option ? Number(option.value) : null)}
                              options={compositions.map((c) => ({ value: c.id, label: c.name }))}
                              placeholder="Select a Composition"
                              isClearable
                            />
                          </div>
                          <div className="d-flex align-items-center gap-2 mb-4">
                            <span>Times:</span>
                            <button type="button" className="btn btn-danger btn-sm" onClick={() => setTimesToUse((prev) => Math.max(1, prev - 1))}>
                              -
                            </button>
                            <span>{timesToUse}</span>
                            <button type="button" className="btn btn-success btn-sm" onClick={() => setTimesToUse((prev) => prev + 1)}>
                              +
                            </button>
                          </div>
                        </div>
                        
                        <div className="col-md-6">
                          <h6>Use Inventory Item</h6>
                          <div className="mb-3">
                            <label htmlFor="itemSelect" className="form-label">
                              Select Inventory Item:
                            </label>
                            <StyledSelect
                              id="itemSelect"
                              value={
                                selectedItemId
                                  ? inventoryItems.find((i) => i.id === selectedItemId)
                                    ? {
                                        value: selectedItemId,
                                        label: `${inventoryItems.find((i) => i.id === selectedItemId)?.name} (${inventoryItems.find((i) => i.id === selectedItemId)?.unit})`,
                                      }
                                    : null
                                  : null
                              }
                              onChange={(option) => {
                                const id = option ? Number(option.value) : null;
                                setSelectedItemId(id);
                                if (id) {
                                  setSelectedItemUnit(inventoryItems.find((i) => i.id === id)?.unit || "");
                                } else {
                                  setSelectedItemUnit("");
                                }
                              }}
                              options={inventoryItems.map((i) => ({ value: i.id, label: `${i.name} (${i.unit})` }))}
                              placeholder="Select an Item"
                              isClearable
                            />
                          </div>
                          <div className="d-flex align-items-center gap-2 mb-4">
                            <input
                              type="number"
                              className="form-control"
                              placeholder="Quantity"
                              value={itemQuantityToUse}
                              onChange={(e) => setItemQuantityToUse(e.target.value ? Number(e.target.value) : "")}
                              min="0"
                              step="any"
                            />
                            <div style={{ minWidth: '100px' }}>
                              <StyledSelect
                                value={
                                  selectedItemUnit
                                    ? { value: selectedItemUnit, label: selectedItemUnit }
                                    : null
                                }
                                onChange={(option) => setSelectedItemUnit(option ? String(option.value) : "")}
                                options={[
                                  { value: "gram", label: "gram" },
                                  { value: "kg", label: "kg" },
                                  { value: "ton", label: "ton" },
                                ]}
                                isClearable={false}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes Section (Moved to Bottom) */}
              <div className="row">
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

              <div className="mt-3 mb-5 d-flex justify-content-center">
                <button type="submit" className="btn btn-primary me-2" disabled={isSubscriptionPaid === false}>
                  Save All Changes
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
      </div>

      <Modal show={showUsageHistoryModal} onHide={() => setShowUsageHistoryModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Usage History for {batch_date}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {usageHistory.length > 0 && (
            <div className="mb-4">
              <h6 className="mb-3">Feed Usage</h6>
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
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => {
                              setUsageToRevert(item.id);
                              setRevertType('composition');
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
          {usageHistory.length === 0 && <p className="text-muted">No composition usage recorded.</p>}

          {itemUsageHistory.length > 0 && (
            <div className="mt-4">
              <h6 className="mb-3">Individual Item Usage</h6>
              <div className="table-responsive">
                <table className="table table-sm table-bordered">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Quantity</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemUsageHistory.map((item) => (
                      <tr key={item.id}>
                        <td>{item.inventory_item_name || `Item ID: ${item.inventory_item_id}`}</td>
                        <td>{item.used_quantity} {item.unit}</td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => {
                              setUsageToRevert(item.id);
                              setRevertType('item');
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
          {itemUsageHistory.length === 0 && <p className="text-muted">No individual item usage recorded.</p>}
        </Modal.Body>
      </Modal>

      <Modal show={showRevertModal} onHide={() => setShowRevertModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Revert</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to revert this {revertType} usage? This action
          will restore the used feed quantities.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRevertModal(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={async () => {
              if (!usageToRevert || !revertType) return;
              try {
                if (revertType === 'composition') {
                  await compositionApi.revertCompositionUsage(usageToRevert);
                  setUsageHistory((prev) =>
                    prev.filter((h) => h.id !== usageToRevert),
                  );
                } else {
                  await inventoryItemApi.revertInventoryItemUsage(usageToRevert);
                  setItemUsageHistory((prev) =>
                    prev.filter((h) => h.id !== usageToRevert),
                  );
                }
                toast.success("Reverted successfully");
              } catch (err: any) {
                toast.error(err.message || "Failed to revert");
              } finally {
                setShowRevertModal(false);
                setUsageToRevert(null);
                setRevertType(null);
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
