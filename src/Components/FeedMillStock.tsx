import { useEffect, useState, useRef } from "react";
import { compositionApi, batchApi, inventoryItemApi, getTenantId, tenantFeatureApi } from "../services/api";
import { format } from 'date-fns';
import { InventoryItemResponse, InventoryItemCategory } from "../types/InventoryItem";
import { BatchResponse } from "../types/batch";
import CompositionForm from "./CompositionForm";
import { StylesConfig, SingleValue } from 'react-select';
import { InventoryItemInComposition } from "../types/compositon";
import StyledSelect from './Common/StyledSelect';
import { toast } from "react-toastify";
import { useNavigate } from 'react-router-dom';
import CustomDatePicker from "./Common/CustomDatePicker";
import { useSubscription } from "./context/SubscriptionContext";
import SubscriptionWarning from "./Common/SubscriptionWarning";
import { useShortcuts } from './context/KeyboardShortcutContext';
import KeyboardShortcutsIndicator from './Common/KeyboardShortcutsIndicator';

function FeedMillStock() {
  type ViewState = "view" | "edit" | "add" | "use-composition";
  const [viewState, setViewState] = useState<ViewState>("view");
  const [inventoryItems, setInventoryItems] = useState<InventoryItemResponse[]>([]);
  const [compositions, setCompositions] = useState<any[]>([]);
  const SELECTED_COMPOSITION_KEY = 'feedmill_selected_composition_id';
  const [selectedCompositionId, setSelectedCompositionId] = useState<number | null>(() => {
    const stored = sessionStorage.getItem(SELECTED_COMPOSITION_KEY);
    return stored ? Number(stored) : null;
  });
  const [editItems, setEditItems] = useState<InventoryItemInComposition[]>([]);
  const [search, setSearch] = useState("");
  const [newCompName, setNewCompName] = useState("");
  const [timesToUse, setTimesToUse] = useState(1);
  const [usageWastagePercentage, setUsageWastagePercentage] = useState<number | string>(0);
  const [editCompName, setEditCompName] = useState("");
  const [wastagePercentage, setWastagePercentage] = useState<number | string>(0);
  const [batches, setBatches] = useState<BatchResponse[]>([]);
  const [selectedBatchNo, setSelectedBatchNo] = useState<string>('');
  const [batchDate, setBatchDate] = useState<string>('');
  const navigate = useNavigate();
  const { isSubscriptionPaid } = useSubscription();
  const [isBatchRestricted, setIsBatchRestricted] = useState(false);

  const { registerShortcuts } = useShortcuts();
  const selectRef = useRef<any>(null);
  const mixesInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      let restricted = false;
      try {
        const tenantId = getTenantId();
        if (tenantId) {
          const features = await tenantFeatureApi.getTenantFeaturesByTenantId(tenantId);
          restricted = features.some(f => f.feature_name === 'BATCH_MANAGEMENT' && f.is_restricted);
          setIsBatchRestricted(restricted);
        }
      } catch (e) {}

      const [itemsResult, compsResult, batchesResult] = await Promise.allSettled([
        inventoryItemApi.getInventoryItems(0, 1000, InventoryItemCategory.FEED),
        compositionApi.getCompositions(),
        restricted ? Promise.resolve([]) : batchApi.getBatches()
      ]);

      if (itemsResult.status === 'fulfilled') {
        setInventoryItems(itemsResult.value);
      } else {
        console.error("Error loading feed mill inventory items:", itemsResult.reason);
        toast.error("Failed to load inventory items.");
      }

      if (compsResult.status === 'fulfilled') {
        const comps = compsResult.value;
        if (Array.isArray(comps)) {
          const mappedComps = comps.map((comp) => ({
            ...comp,
            inventory_items: (comp.inventory_items || []).map((f: any) => ({
              ...f,
              inventory_item_id: f.inventory_item_id ?? f.inventory_item_id,
            })),
          }));
          setCompositions(mappedComps);
        } else {
          setCompositions([]);
        }
      } else {
        console.error("Error loading feed mill compositions:", compsResult.reason);
        toast.error("Failed to load compositions.");
      }

      if (batchesResult.status === 'fulfilled') {
        const fetchedBatches = batchesResult.value;
        setBatches(fetchedBatches);
        if (fetchedBatches.length > 0) {
          setSelectedBatchNo(fetchedBatches[0].batch_no);
        }
      } else {
        console.error("Error loading batches:", batchesResult.reason);
        // Note: No toast error here so restricted tenants don't get annoyed with "Forbidden" popups
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedCompositionId !== null) {
      sessionStorage.setItem(SELECTED_COMPOSITION_KEY, String(selectedCompositionId));
    }
  }, [selectedCompositionId]);

  const filteredItems = inventoryItems.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedComposition = compositions.find(
    (c) => c.id === selectedCompositionId
  );

  const handleEdit = () => {
    if (!selectedComposition) return;
    setEditItems(selectedComposition.inventory_items.map((i: any) => ({ ...i, wastage_percentage: i.wastage_percentage || 0 })));
    setEditCompName(selectedComposition.name);
    setWastagePercentage(selectedComposition.wastage_percentage || 0);
    setViewState("edit");
  };

  const handleItemWeightChange = (item_id: number, weight: number | string) => {
    const processedValue = weight === '' ? null : Number(weight);
    setEditItems(
      editItems.map((i) => (i.inventory_item_id === item_id ? { ...i, weight: processedValue as number } : i))
    );
  };

  const handleItemWastageChange = (item_id: number, wastage: number | string) => {
    const processedValue = wastage === '' ? undefined : Number(wastage);
    setEditItems(
      editItems.map((i) =>
        i.inventory_item_id === item_id ? { ...i, wastage_percentage: processedValue } : i
      )
    );
  };

  const handleItemSearch = (e: React.ChangeEvent<HTMLInputElement>) =>
    setSearch(e.target.value);

  const handleAddItem = (item: { id?: number; name?: string }) => {
    if (!item.id) return;
    if (!editItems.some((i) => i.inventory_item_id === item.id)) {
      setEditItems([...editItems, { inventory_item_id: item.id, weight: 0, wastage_percentage: 0 }]);
    }
  };

  const handleRemoveItem = (item_id: number) => {
    setEditItems(editItems.filter((i) => i.inventory_item_id !== item_id));
  };

  const handleSave = async () => {
    if (!selectedComposition) return;
    const tenantId = getTenantId();
    if (!tenantId) {
      toast.error("Tenant ID not found. Please log in again.");
      return;
    }
    try {
      await compositionApi.updateComposition(
        selectedComposition.id,
        {
          name: editCompName,
          wastage_percentage: Number(wastagePercentage),
          inventory_items: editItems.map(item => ({
            ...item,
            wastage_percentage: item.wastage_percentage || 0,
            tenant_id: tenantId,
          })),
          tenant_id: tenantId,
        }
      );
      const updated = await compositionApi.getCompositions();
      setCompositions(updated);
      setViewState("view");
    } catch (err: any) {
      toast.error(err.message || "Failed to update composition");
    }
  };

  const handleAddComposition = async () => {
    setViewState("add");
    setEditItems([]);
    setNewCompName("");
    setWastagePercentage(0);
  };

  const handleOpenCreateItem = () => {
    navigate('/inventory-items/create');
  };

  const handleConfirmAddComposition = async () => {
    if (!newCompName.trim()) {
      toast.error("Composition name cannot be empty");
      return;
    }
    const tenantId = getTenantId();
    if (!tenantId) {
      toast.error("Tenant ID not found. Please log in again.");
      return;
    }
    try {
      await compositionApi.createComposition({
        name: newCompName,
        wastage_percentage: Number(wastagePercentage),
        inventory_items: editItems.map(item => ({
          ...item,
          wastage_percentage: item.wastage_percentage || 0,
          tenant_id: tenantId,
        })),
        tenant_id: tenantId,
      });
      const updated = await compositionApi.getCompositions();
      setCompositions(updated);
      setSelectedCompositionId(updated[updated.length - 1]?.id || null);
      setNewCompName("");
      setEditItems([]);
      setViewState("view");
      setWastagePercentage(0);
    } catch (err: any) {
      toast.error(err.message || "Failed to create composition");
    }
  };

  type OptionType = { value: number | string; label: string };

  const customStyles: StylesConfig<OptionType, false> = {
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isFocused
        ? 'var(--bs-primary)'
        : 'var(--bs-white)',
      color: state.isFocused ? 'var(--bs-white)' : 'var(--bs-body-color)',
      ':active': {
        ...provided[':active'],
        backgroundColor: 'rgba(13, 110, 253, 0.2)',
      },
    }),
    control: (provided) => ({
      ...provided,
      textAlign: 'center',
    }),
  };

  const compositionOptions: OptionType[] = compositions.map(c => ({ value: c.id, label: c.name }));
  const selectedCompositionOption = compositionOptions.find(option => option.value === selectedCompositionId);

  const handleCompositionSelectChange = (selectedOption: SingleValue<OptionType>) => {
    if (selectedOption) {
      setSelectedCompositionId(selectedOption.value as number);
    } else {
      setSelectedCompositionId(null);
    }
  };

  const batchOptions: OptionType[] = batches.map(b => ({ value: b.batch_no, label: b.batch_no }));
  const selectedBatchOption = batchOptions.find(option => option.value === selectedBatchNo);

  const handleBatchSelectChange = (selectedOption: SingleValue<OptionType>) => {
    if (selectedOption) {
      setSelectedBatchNo(selectedOption.value as string);
    } else {
      setSelectedBatchNo('');
    }
  };

  const handleConfirmUseComposition = async () => {
    if (!selectedComposition) return;
    if (!isBatchRestricted && !selectedBatchNo) {
      toast.error("Please select a Batch Number");
      return;
    }
    if (!batchDate) {
      toast.error("Please select a Batch Date");
      return;
    }
    try {
      await compositionApi.useComposition({
        compositionId: selectedComposition.id,
        times: Number(timesToUse) || 1,
        usedAt: `${batchDate}T00:00:00`,
        batch_no: isBatchRestricted ? undefined : selectedBatchNo,
        wastage_percentage: Number(usageWastagePercentage) || 0,
      });
      toast.success(`Used composition ${selectedComposition.name} ${timesToUse} time(s)`);
      const updated = await compositionApi.getCompositions();
      setCompositions(updated);
      setViewState("view");
    } catch (err: any) {
      toast.error(err.message || "Failed to use composition");
    }
  };

  useEffect(() => {
    const shortcuts: any[] = [];

    if (viewState === 'view') {
      shortcuts.push({
        key: '/',
        description: 'Focus Composition Select',
        category: 'Page Actions',
        action: () => {
          selectRef.current?.focus();
        }
      });

      if (isSubscriptionPaid !== false) {
        shortcuts.push({
          key: 'Alt+n',
          description: 'Create Composition',
          category: 'Composition Actions',
          action: () => handleAddComposition()
        });
      }

      if (selectedComposition) {
        if (isSubscriptionPaid !== false) {
          shortcuts.push({
            key: 'Alt+e',
            description: 'Edit Composition',
            category: 'Composition Actions',
            action: () => handleEdit()
          });
          
          shortcuts.push({
            key: 'Alt+u',
            description: 'Use Composition',
            category: 'Composition Actions',
            action: () => {
              setUsageWastagePercentage(selectedComposition.wastage_percentage || 0);
              setViewState('use-composition');
            }
          });
        }

        shortcuts.push({
          key: 'Alt+y',
          description: 'Composition Usage History',
          category: 'Navigation',
          action: () => {
            window.location.href = `/compositions/${selectedCompositionId}/usage-history`;
          }
        });
      }

      shortcuts.push({
        key: 'Alt+h',
        description: 'All Composition History',
        category: 'Navigation',
        action: () => navigate('/compositions/usage-history')
      });

      shortcuts.push({
        key: 'Alt+i',
        description: 'Inventory History',
        category: 'Navigation',
        action: () => navigate('/inventory/usage-history')
      });
    } else if (viewState === 'use-composition') {
      shortcuts.push({
        key: '/',
        description: 'Focus Mixes Input',
        category: 'Form Actions',
        action: () => {
          mixesInputRef.current?.focus();
        }
      });

      shortcuts.push({
        key: 'Alt+s',
        description: 'Confirm Use',
        category: 'Form Actions',
        action: () => {
          handleConfirmUseComposition();
        }
      });

      shortcuts.push({
        key: 'Escape',
        description: 'Cancel',
        category: 'Form Actions',
        action: () => setViewState('view')
      });
    }

    return registerShortcuts(shortcuts);
  }, [
    viewState,
    selectedCompositionId,
    isSubscriptionPaid,
    selectedComposition,
    registerShortcuts,
    navigate,
    timesToUse,
    batchDate,
    selectedBatchNo,
    isBatchRestricted,
    usageWastagePercentage,
  ]);

  return (
    <div className="container">
      <SubscriptionWarning />
      <div className="row mb-3">
        <div className="col-12 col-md-4 mb-2 mb-md-0">
          {viewState !== "add" && (
            <StyledSelect
              ref={selectRef}
              value={selectedCompositionOption}
              onChange={handleCompositionSelectChange}
              options={compositionOptions}
              placeholder="Select Composition"
              isClearable
            />
          )}
        </div>
        <div className="col-12 col-md-8 d-flex gap-2 flex-wrap">
          {selectedComposition && viewState !== "edit" && viewState !== "add" && (
            <button
              onClick={handleEdit}
              className="btn btn-success"
              disabled={isSubscriptionPaid === false}
            >
              <i className="bi bi-pencil me-1"></i>Edit
            </button>
          )}

          {viewState !== "add" && (
            <button
              onClick={handleAddComposition}
              className="btn btn-primary"
              disabled={isSubscriptionPaid === false}
            >
              <i className="bi bi-plus-lg me-1"></i>Create
            </button>
          )}
          <button
            onClick={() => navigate('/compositions/usage-history')}
            className="btn btn-info"
          >
            Composition History
          </button>
          <button
            onClick={() => navigate('/inventory/usage-history')}
            className="btn btn-outline-info"
          >
            Inventory History
          </button>
        </div>
      </div>
      {selectedComposition && viewState !== "edit" && viewState !== "add" && (
        <div className="card shadow-sm mb-4">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">Items in Composition (Wastage: {selectedComposition.wastage_percentage || 0}%)</h5>
          </div>
          <div className="card-body">
            <ul className="list-group">
            {selectedComposition.inventory_items.map((i: any) => {
              const item = inventoryItems.find((inv) => inv.id === i.inventory_item_id);
              if (!item) return null;
              return (
                <li
                  key={i.inventory_item_id}
                  className="list-group-item d-flex justify-content-between align-items-center"
                >
                  <span>{item.name}</span>
                  <div className="d-flex flex-column flex-sm-row align-items-end align-items-sm-center">
                    <span className="badge bg-secondary rounded-pill mb-1 mb-sm-0 me-sm-2">
                      {i.weight} kg
                    </span>
                    <span className="badge bg-warning rounded-pill">
                      {i.wastage_percentage || 0}% wastage
                    </span>
                  </div>
                </li>
              );
            })}
            <li className="list-group-item d-flex justify-content-between align-items-center">
              <strong>Total Weight</strong>
              <span className="badge bg-primary rounded-pill">
                {selectedComposition.inventory_items.reduce((sum: number, i: any) => sum + Number(i.weight || 0), 0)} kg
              </span>
            </li>
          </ul>
          <div className="mt-3 d-flex align-items-center gap-2">
            <button
              className="btn btn-primary"
              onClick={() => {
                setUsageWastagePercentage(selectedComposition.wastage_percentage || 0);
                setViewState("use-composition");
              }}
              disabled={isSubscriptionPaid === false}
            >
              Use Composition
            </button>
            <button
              className="btn btn-info"
              onClick={() => {
                if (selectedCompositionId) {
                  window.location.href = `/compositions/${selectedCompositionId}/usage-history`;
                }
              }}
            >
              Usage History
            </button>
            </div>
          </div>
        </div>
      )}

      {viewState === "use-composition" && selectedComposition && (
        <div className="card shadow-sm mb-4">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">Use Composition</h5>
          </div>
          <div className="card-body">
          <div className="d-flex align-items-center gap-2 mb-2">
            <span title="Number of mixes for this composition">Mixes:</span>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => setTimesToUse((prev) => Math.max(1, Number(prev) - 1))}
            >
              -
            </button>
            <input 
              ref={mixesInputRef}
              type="number" 
              className="form-control form-control-sm text-center" 
              style={{ width: '80px' }}
              value={timesToUse}
              onChange={(e) => setTimesToUse(e.target.value === "" ? "" as any : parseInt(e.target.value, 10))}
              min="1"
              step="1"
            />
            <button
              className="btn btn-success btn-sm"
              onClick={() => setTimesToUse((prev) => Number(prev) + 1)}
            >
              +
            </button>
            <span className="ms-2 text-muted fw-bold">
              Total Feed: {(
                selectedComposition.inventory_items.reduce((sum: number, i: any) => sum + Number(i.weight || 0), 0) * timesToUse
              ).toFixed(2)} kg
            </span>
          </div>
          {!isBatchRestricted && (
          <div className="mb-3">
            <label htmlFor="batchNoSelect" className="form-label">Select Batch Number:</label>
            <StyledSelect
              id="batchNoSelect"
              value={selectedBatchOption}
              onChange={handleBatchSelectChange}
              options={batchOptions}
              styles={customStyles}
              placeholder="Select a Batch"
              isClearable
            />
          </div>
          )}
          <div className="mb-3">
            <label htmlFor="batchDate" className="form-label">Usage Date:</label>
            <CustomDatePicker
              id="batchDate"
              selected={batchDate ? new Date(batchDate) : null}
              onChange={(date) => setBatchDate(date ? format(date, 'yyyy-MM-dd') : '')}
              className="form-control-sm"
              placeholderText="Select Batch Date"
            />
          </div>

          <div className="mb-3">
            <label htmlFor="usageWastage" className="form-label">Wastage Percentage (%):</label>
            <input
              id="usageWastage"
              type="number"
              className="form-control form-control-sm"
              value={usageWastagePercentage}
              onChange={(e) => setUsageWastagePercentage(e.target.value)}
              min="0"
              step="any"
            />
          </div>

          <div className="d-flex gap-2">
            <button
              id="confirm-use-btn"
              className="btn btn-primary"
              onClick={handleConfirmUseComposition}
              disabled={isSubscriptionPaid === false}
            >
              Confirm
            </button>
            <button className="btn btn-secondary" onClick={() => setViewState("view")}>Cancel</button>
          </div>
          </div>
        </div>
      )}

      {viewState === "add" && (
        <CompositionForm
          title="Create Composition"
          initialCompName={newCompName}
          onCompNameChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCompName(e.target.value)}
          wastagePercentage={wastagePercentage}
          onWastagePercentageChange={(e: React.ChangeEvent<HTMLInputElement>) => setWastagePercentage(e.target.value)}
          search={search}
          handleItemSearch={handleItemSearch}
          filteredItems={filteredItems}
          editItems={editItems}
          items={inventoryItems}
          handleAddItem={handleAddItem}
          handleRemoveItem={handleRemoveItem}
          handleItemWeightChange={handleItemWeightChange}
          handleItemWastageChange={handleItemWastageChange}
          onSave={handleConfirmAddComposition}
          saveButtonLabel="Save Composition"
          onCancel={() => setViewState("view")}
          onOpenCreateItem={handleOpenCreateItem}
        />
      )}

      {viewState === "edit" && (
        <CompositionForm
          title="Edit Composition"
          initialCompName={editCompName}
          onCompNameChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditCompName(e.target.value)}
          wastagePercentage={wastagePercentage}
          onWastagePercentageChange={(e: React.ChangeEvent<HTMLInputElement>) => setWastagePercentage(e.target.value)}
          search={search}
          handleItemSearch={handleItemSearch}
          filteredItems={filteredItems}
          editItems={editItems}
          items={inventoryItems}
          handleAddItem={handleAddItem}
          handleRemoveItem={handleRemoveItem}
          handleItemWeightChange={handleItemWeightChange}
          handleItemWastageChange={handleItemWastageChange}
          onSave={handleSave}
          saveButtonLabel="Save Changes"
          onCancel={() => setViewState("view")}
          onOpenCreateItem={handleOpenCreateItem}
        />
      )}
      <KeyboardShortcutsIndicator
        hasSearch={viewState === "add" || viewState === "edit"}
        hasNew={viewState === "view"}
      />
    </div>
  );
}

export default FeedMillStock;