// src/components/InventoryItem/EditInventoryItem.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import PageHeader from "../Layout/PageHeader";
import { inventoryItemApi } from "../../services/api";
import { InventoryItemResponse, InventoryItemUpdate, InventoryItemUnit, InventoryItemCategory } from "../../types/InventoryItem";

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

  useEffect(() => {
    const fetchItem = async () => {
      try {
        if (!item_id) {
            setError("Inventory Item ID is missing.");
            setLoading(false);
            return;
        }
        const data = await inventoryItemApi.getInventoryItem(Number(item_id));
        setItem(data);
        // Initialize form states with fetched data
        setName(data.name);
        setUnit(data.unit);
        setCategory(data.category);
        setReorderLevel(data.reorder_level);
      } catch (err: any) {
        console.error("Error fetching inventory item:", err);
        setError(err?.message || "Failed to load inventory item for editing.");
        toast.error(err?.message || "Failed to load inventory item for editing.");
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [item_id]);

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
      <PageHeader title={`Edit Item: ${item.name}`} buttonVariant="secondary" buttonLabel="Back to List" buttonLink="/inventory-items" />
      <div className="container mt-4">
        <div className="card shadow-sm">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label htmlFor="itemName" className="form-label">Item Name <span className="text-danger">*</span></label>
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
                  <label htmlFor="itemUnit" className="form-label">Unit <span className="text-danger">*</span></label>
                  <select
                    className="form-select"
                    id="itemUnit"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as InventoryItemUnit)}
                    required
                  >
                    {Object.values(InventoryItemUnit).map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label htmlFor="itemCategory" className="form-label">Category <span className="text-danger">*</span></label>
                  <select
                    className="form-select"
                    id="itemCategory"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as InventoryItemCategory)}
                    required
                  >
                    {Object.values(InventoryItemCategory).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
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
      </div>
    </>
  );
};

export default EditInventoryItem;