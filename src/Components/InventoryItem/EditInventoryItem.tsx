// src/components/InventoryItem/EditInventoryItem.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import PageHeader from "../Layout/PageHeader";
import { inventoryItemApi, inventoryItemVariantApi } from "../../services/api";
import { InventoryItemResponse, InventoryItemUpdate, InventoryItemUnit, InventoryItemCategory } from "../../types/InventoryItem";
import { InventoryItemVariant } from "../../types/inventoryItemVariant";
import StyledSelect from "../Common/StyledSelect";
import VariantManager from "./VariantManager";

const EditInventoryItem: React.FC = () => {
  const { item_id } = useParams<{ item_id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<InventoryItemResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // States for form fields
  const [name, setName] = useState('');
  const [unit, setUnit] = useState<InventoryItemUnit>(InventoryItemUnit.KG);
  const [category, setCategory] = useState<InventoryItemCategory>(InventoryItemCategory.FEED);
  const [reorderLevel, setReorderLevel] = useState<number | undefined>(undefined);
  const [defaultWastagePercentage, setDefaultWastagePercentage] = useState<number | undefined>();
  const [variants, setVariants] = useState<InventoryItemVariant[]>([]);

  useEffect(() => {
    const fetchItemAndVariants = async () => {
      try {
        if (!item_id) {
            setError("Inventory Item ID is missing.");
            setLoading(false);
            return;
        }
        const numericItemId = Number(item_id);
        const itemData = await inventoryItemApi.getInventoryItem(numericItemId);
        setItem(itemData);
        
        // Initialize form states
        setName(itemData.name);
        setUnit(itemData.unit);
        setCategory(itemData.category);
        setReorderLevel(itemData.reorder_level);
        setDefaultWastagePercentage(itemData.default_wastage_percentage);

        // Fetch variants
        const variantsData = await inventoryItemVariantApi.getInventoryItemVariants(numericItemId);
        setVariants(variantsData);

      } catch (err: any) {
        console.error("Error fetching inventory item or variants:", err);
        const errorMessage = err?.message || "Failed to load item data.";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchItemAndVariants();
  }, [item_id]);

  const handleAddVariant = async (variantName: string) => {
    if (!item_id) return;
    try {
        const newVariant = await inventoryItemVariantApi.createInventoryItemVariant({ name: variantName, item_id: Number(item_id) });
        setVariants(prev => [...prev, newVariant]);
        toast.success("Variant added successfully!");
    } catch (error: any) {
        toast.error(error?.message || "Failed to add variant.");
    }
  };

  const handleUpdateVariant = async (id: number, variantName: string) => {
    try {
        const updatedVariant = await inventoryItemVariantApi.updateInventoryItemVariant(id, { name: variantName });
        setVariants(prev => prev.map(v => v.id === id ? updatedVariant : v));
        toast.success("Variant updated successfully!");
    } catch (error: any) {
        toast.error(error?.message || "Failed to update variant.");
    }
  };

  const handleDeleteVariant = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this variant?")) {
        try {
            await inventoryItemVariantApi.deleteInventoryItemVariant(id);
            setVariants(prev => prev.filter(v => v.id !== id));
            toast.success("Variant deleted successfully!");
        } catch (error: any) {
            toast.error(error?.message || "Failed to delete variant.");
        }
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Basic validation
    if (!name.trim()) {
        toast.error('Item Name is required.');
        setLoading(false);
        return;
    }

    if (!item_id) {
        toast.error('Inventory Item ID is missing for update operation.');
        setLoading(false);
        return;
    }

    const updatedItem: InventoryItemUpdate = {
        name,
        unit,
        category,
        reorder_level: reorderLevel,
        default_wastage_percentage: defaultWastagePercentage
    };

    try {
        await inventoryItemApi.updateInventoryItem(Number(item_id), updatedItem);
        toast.success('Inventory Item updated successfully!');
        navigate('/inventory-items'); // Navigate back to the list
    } catch (error: any) {
        toast.error(error?.message || 'Failed to update inventory item.');
    } finally {
        setLoading(false);
    }
  };

  if (loading && !item) return <div className="text-center mt-5">Loading inventory item data...</div>;
  if (error) return <div className="text-center text-danger mt-5">{error}</div>;
  if (!item) return <div className="text-center mt-5">Inventory item not found.</div>;

  return (
    <>
      <PageHeader title={`Edit Item: ${item.name}`} buttonVariant="secondary" buttonLabel="Back to List" buttonLink="/inventory-items" buttonIcon="bi-arrow-left"/>
      <div className="container mt-4">
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label htmlFor="itemName" className="form-label">Item Name <span className="form-field-required">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    id="itemName"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="itemUnit" className="form-label">Unit <span className="form-field-required">*</span></label>
                  <StyledSelect
                    id="itemUnit"
                    value={{ value: unit, label: unit }}
                    onChange={(option) => setUnit(option ? option.value as InventoryItemUnit : InventoryItemUnit.KG)}
                    options={Object.values(InventoryItemUnit).map((u) => ({
                      value: u,
                      label: u
                    }))}
                    placeholder="Select a Unit"
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="itemCategory" className="form-label">Category <span className="form-field-required">*</span></label>
                  <StyledSelect
                    id="itemCategory"
                    value={{ value: category, label: category }}
                    onChange={(option) => setCategory(option ? option.value as InventoryItemCategory : InventoryItemCategory.FEED)}
                    options={Object.values(InventoryItemCategory).map((c) => ({
                      value: c,
                      label: c
                    }))}
                    placeholder="Select a Category"
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="reorderLevel" className="form-label">Reorder Level ({unit})</label>
                  <input
                    type="number"
                    className="form-control"
                    id="reorderLevel"
                    value={reorderLevel || ''}
                    onChange={(e) => setReorderLevel(Number(e.target.value))}
                  />
                </div>
                <div className="col-md-6">
                    <label htmlFor="defaultWastagePercentage" className="form-label">Default Wastage %</label>
                    <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        id="defaultWastagePercentage"
                        value={defaultWastagePercentage ?? ''}
                        onChange={(e) => setDefaultWastagePercentage(e.target.value ? parseFloat(e.target.value) : undefined)}
                        placeholder="e.g., 1.5"
                    />
                </div>

                <div className="col-12 mt-4">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary ms-2"
                    onClick={() => navigate('/inventory-items')}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
        <div className="card shadow-sm">
            <div className="card-body">
                <VariantManager
                    variants={variants}
                    onVariantsChange={setVariants}
                    onAdd={handleAddVariant}
                    onEdit={handleUpdateVariant}
                    onDelete={handleDeleteVariant}
                    isEditing={true}
                />
            </div>
        </div>
      </div>
    </>
  );
};

export default EditInventoryItem;