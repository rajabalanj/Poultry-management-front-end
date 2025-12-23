// src/components/InventoryItem/CreateInventoryItemForm.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import PageHeader from '../Layout/PageHeader';
import { inventoryItemApi } from '../../services/api';
import { InventoryItemCreate, InventoryItemUnit, InventoryItemCategory, InventoryItemResponse } from '../../types/InventoryItem';
import StyledSelect from '../Common/StyledSelect';

interface CreateInventoryItemFormProps {
    onCreated?: (item: InventoryItemResponse) => void;
    onCancel?: () => void;
    hideHeader?: boolean;
}

const CreateInventoryItemForm: React.FC<CreateInventoryItemFormProps> = ({ onCreated, onCancel, hideHeader }) => {
    const [name, setName] = useState('');
    const [unit, setUnit] = useState<InventoryItemUnit>(InventoryItemUnit.KG);
    const [category, setCategory] = useState<InventoryItemCategory>(InventoryItemCategory.FEED);
    const [defaultWastagePercentage, setDefaultWastagePercentage] = useState<number | undefined>();
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
            default_wastage_percentage: defaultWastagePercentage
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
              <PageHeader title="Create New Inventory Item" buttonVariant="secondary" buttonLabel="Back" buttonLink="/inventory-items" buttonIcon='bi-arrow-left'/>
            )}
            <div className={hideHeader ? undefined : 'container mt-4'}>
                <div className="card shadow-sm">
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
                                        placeholder="e.g., Poultry Feed Starter"
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