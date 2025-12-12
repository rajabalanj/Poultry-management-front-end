import { useEffect, useState } from "react";
import { compositionApi, batchApi, inventoryItemApi, getTenantId } from "../services/api";
import { InventoryItemResponse, InventoryItemCategory } from "../types/InventoryItem";
import { BatchResponse } from "../types/batch";
import CompositionForm from "./CompositionForm";
import Select, { StylesConfig, SingleValue } from 'react-select';
import { toast } from "react-toastify";
import { useNavigate } from 'react-router-dom';

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
  const [editItems, setEditItems] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [newCompName, setNewCompName] = useState("");
  const [timesToUse, setTimesToUse] = useState(1);
  const [editCompName, setEditCompName] = useState("");
  const [batches, setBatches] = useState<BatchResponse[]>([]);
  const [selectedBatchNo, setSelectedBatchNo] = useState<string>('');
  const [batchDate, setBatchDate] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    inventoryItemApi.getInventoryItems(0, 1000, InventoryItemCategory.FEED).then((items) => {
      setInventoryItems(items);
    });
    compositionApi.getCompositions().then((comps) => {
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
    });

    batchApi.getBatches().then((fetchedBatches: BatchResponse[]) => {
      setBatches(fetchedBatches);
      if (fetchedBatches.length > 0) {
        setSelectedBatchNo(fetchedBatches[0].batch_no);
      }
    });

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
    setEditItems(selectedComposition.inventory_items.map((i: any) => ({ ...i })));
    setEditCompName(selectedComposition.name);
    setViewState("edit");
  };

  const handleItemWeightChange = (item_id: number, weight: number) => {
    setEditItems(
      editItems.map((i: any) => (i.inventory_item_id === item_id ? { ...i, weight } : i))
    );
  };

  const handleItemSearch = (e: React.ChangeEvent<HTMLInputElement>) =>
    setSearch(e.target.value);

  const handleAddItem = (item: { id?: number; name?: string }) => {
    if (!item.id) return;
    if (!editItems.some((i: any) => i.inventory_item_id === item.id)) {
      setEditItems([...editItems, { inventory_item_id: item.id, weight: 0 }]);
    }
  };

  const handleRemoveItem = (item_id: number) => {
    setEditItems(editItems.filter((i: any) => i.inventory_item_id !== item_id));
  };

  const handleSave = async () => {
    if (!selectedComposition) return;
    const tenantId = getTenantId();
    if (!tenantId) {
      toast.error("Tenant ID not found. Please log in again.");
      return;
    }
    await compositionApi.updateComposition(
      selectedComposition.id,
      {
        name: editCompName,
        inventory_items: editItems.map(item => ({ ...item, tenant_id: tenantId })),
        tenant_id: tenantId,
      }
    );
    const updated = await compositionApi.getCompositions();
    setCompositions(updated);
    setViewState("view");
  };

  const handleAddComposition = async () => {
    setViewState("add");
    setEditItems([]);
    setNewCompName("");
  };

  const handleOpenCreateItem = () => {
    navigate('/inventory/create');
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
    await compositionApi.createComposition({
      name: newCompName,
      inventory_items: editItems.map(item => ({ ...item, tenant_id: tenantId })),
      tenant_id: tenantId,
    });
    const updated = await compositionApi.getCompositions();
    setCompositions(updated);
    setSelectedCompositionId(updated[updated.length - 1]?.id || null);
    setNewCompName("");
    setEditItems([]);
    setViewState("view");
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

  return (
    <div className="container py-3">
      <div className="row mb-3">
        <div className="col-12 col-md-4 mb-2 mb-md-0">
          {viewState !== "add" && (
            <Select
              className="text-center"
              value={selectedCompositionOption}
              onChange={handleCompositionSelectChange}
              options={compositionOptions}
              styles={customStyles}
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
            >
              <i className="bi bi-pencil me-1"></i>Edit
            </button>
          )}

          {viewState !== "add" && (
            <button
              onClick={handleAddComposition}
              className="btn btn-primary"
            >
              <i className="bi bi-plus-lg me-1"></i>Create
            </button>
          )}
          <button
            onClick={() => navigate('/compositions/usage-history')}
            className="btn btn-info"
          >
            All Usages
          </button>
        </div>
      </div>
      {selectedComposition && viewState !== "edit" && viewState !== "add" && (
        <div className="card shadow-sm mb-4">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">Items in Composition</h5>
          </div>
          <div className="card-body">
            <ul className="list-group">
            {selectedComposition.inventory_items.map((i: any) => {
              const item = inventoryItems.find((id) => id.id === i.inventory_item_id);
              if (!item) return null;
              return (
                <li
                  key={i.inventory_item_id}
                  className="list-group-item d-flex justify-content-between align-items-center"
                >
                  <span>{item.name}</span>
                  <span className="badge bg-secondary rounded-pill">
                    {i.weight} kg
                  </span>
                </li>
              );
            })}
            <li className="list-group-item d-flex justify-content-between align-items-center">
              <strong>Total Weight</strong>
              <span className="badge bg-primary rounded-pill">
                {selectedComposition.inventory_items.reduce((sum: number, i: any) => sum + i.weight, 0)} kg
              </span>
            </li>
          </ul>
          <div className="mt-3 d-flex align-items-center gap-2">
            <button
              className="btn btn-primary"
              onClick={() => setViewState("use-composition")}
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
          <div className="mb-3">
            <label htmlFor="batchNoSelect" className="form-label">Select Batch Number:</label>
            <Select
              id="batchNoSelect"
              value={selectedBatchOption}
              onChange={handleBatchSelectChange}
              options={batchOptions}
              styles={customStyles}
              placeholder="Select a Batch"
              isClearable
            />
          </div>
          <div className="mb-3">
            <label htmlFor="batchDate" className="form-label">Batch Date:</label>
            <input
              id="batchDate"
              type="date"
              className="form-control form-control-sm"
              value={batchDate}
              onChange={(e) => setBatchDate(e.target.value)}
            />
          </div>

          <div className="d-flex gap-2">
            <button
              className="btn btn-primary"
              onClick={async () => {
                if (!selectedBatchNo) {
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
                    times: timesToUse,
                    usedAt: `${batchDate}T00:00:00`,
                    batch_no: selectedBatchNo,
                  });
                  toast.success(`Used composition ${selectedComposition.name} ${timesToUse} time(s) for Batch ${selectedBatchNo}`);
                  const updated = await compositionApi.getCompositions();
                  setCompositions(updated);
                  setViewState("view");
                } catch (err) {
                  toast.error("Failed to use composition");
                }
              }}
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
          search={search}
          handleItemSearch={handleItemSearch}
          filteredItems={filteredItems}
          editItems={editItems}
          items={inventoryItems}
          handleAddItem={handleAddItem}
          handleRemoveItem={handleRemoveItem}
          handleItemWeightChange={handleItemWeightChange}
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
          search={search}
          handleItemSearch={handleItemSearch}
          filteredItems={filteredItems}
          editItems={editItems}
          items={inventoryItems}
          handleAddItem={handleAddItem}
          handleRemoveItem={handleRemoveItem}
          handleItemWeightChange={handleItemWeightChange}
          onSave={handleSave}
          saveButtonLabel="Save Changes"
          onCancel={() => setViewState("view")}
          onOpenCreateItem={handleOpenCreateItem}
        />
      )}
    </div>
  );
}

export default FeedMillStock;