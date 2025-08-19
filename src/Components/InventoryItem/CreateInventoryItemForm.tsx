// src/components/InventoryItem/CreateInventoryItemForm.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import PageHeader from '../Layout/PageHeader';
import { inventoryItemApi } from '../../services/api';
import { InventoryItemCreate, InventoryItemUnit, InventoryItemCategory, InventoryItemResponse } from '../../types/InventoryItem';

interface CreateInventoryItemFormProps {
    onCreated?: (item: InventoryItemResponse) => void;
    onCancel?: () => void;
    hideHeader?: boolean;
}

const CreateInventoryItemForm: React.FC<CreateInventoryItemFormProps> = ({ onCreated, onCancel, hideHeader }) => {
    const [name, setName] = useState('');
    const [unit, setUnit] = useState<InventoryItemUnit>(InventoryItemUnit.KG);
    const [category, setCategory] = useState<InventoryItemCategory>(InventoryItemCategory.FEED);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Basic validation
        if (!name.trim()) {
            toast.error('Item Name is required.');
            setIsLoading(false);
            return;
        }

        const newItem: InventoryItemCreate = {
            name,
            unit,
            category,
        };

        try {
            const created = await inventoryItemApi.createInventoryItem(newItem);
            toast.success('Inventory Item created successfully!');
            if (onCreated) {
                onCreated(created);
            } else {
                navigate('/inventory-items'); // Navigate back to the list
            }
        } catch (error: any) {
            toast.error(error?.message || 'Failed to create inventory item.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {!hideHeader && (
              <PageHeader title="Create New Inventory Item" buttonVariant="secondary" buttonLabel="Back to List" buttonLink="/inventory-items" />
            )}
            <div className={hideHeader ? undefined : 'container mt-4'}>
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
                                        placeholder="e.g., Poultry Feed Starter"
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

                                <div className="col-12 mt-4">
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? 'Creating...' : 'Create Item'}
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-secondary ms-2"
                                        onClick={() => {
                                            if (onCancel) onCancel();
                                            else navigate('/inventory-items');
                                        }}
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

export default CreateInventoryItemForm;