import React, { useState } from 'react';
import { InventoryItemVariant } from '../../types/inventoryItemVariant';

interface VariantManagerProps {
    variants: InventoryItemVariant[];
    onVariantsChange: (variants: InventoryItemVariant[]) => void;
    onAdd?: (name: string) => Promise<void>;
    onEdit?: (id: number, name: string) => Promise<void>;
    onDelete?: (id: number) => Promise<void>;
    isEditing?: boolean;
}

const VariantManager: React.FC<VariantManagerProps> = ({ variants, onVariantsChange, onAdd, onEdit, onDelete, isEditing = false }) => {
    const [variantName, setVariantName] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editingName, setEditingName] = useState('');

    const handleAddVariant = async () => {
        if (variantName.trim() !== '') {
            if (isEditing && onAdd) {
                await onAdd(variantName.trim());
            } else {
                const newVariant: InventoryItemVariant = {
                    id: Date.now(), // Temp ID
                    name: variantName.trim(),
                    item_id: 0,
                };
                onVariantsChange([...variants, newVariant]);
            }
            setVariantName('');
        }
    };

    const handleRemoveVariant = async (id: number) => {
        if (isEditing && onDelete) {
            await onDelete(id);
        } else {
            onVariantsChange(variants.filter(variant => variant.id !== id));
        }
    };

    const startEditing = (variant: InventoryItemVariant) => {
        setEditingId(variant.id);
        setEditingName(variant.name);
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditingName('');
    };

    const handleSaveEdit = async () => {
        if (editingId && editingName.trim() !== '' && onEdit) {
            await onEdit(editingId, editingName.trim());
            cancelEditing();
        }
    };

    return (
        <div>
            <h5>Variants</h5>
            <div className="input-group mb-3">
                <input
                    type="text"
                    className="form-control"
                    placeholder="New variant name"
                    value={variantName}
                    onChange={(e) => setVariantName(e.target.value)}
                />
                <button className="btn btn-outline-secondary" type="button" onClick={handleAddVariant}>
                    Add Variant
                </button>
            </div>
            <ul className="list-group">
                {variants.map(variant => (
                    <li key={variant.id} className="list-group-item d-flex justify-content-between align-items-center">
                        {editingId === variant.id ? (
                            <input
                                type="text"
                                className="form-control"
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                            />
                        ) : (
                            <span>{variant.name}</span>
                        )}
                        <div>
                            {editingId === variant.id ? (
                                <>
                                    <button className="btn btn-success btn-sm me-2" onClick={handleSaveEdit}>Save</button>
                                    <button className="btn btn-secondary btn-sm" onClick={cancelEditing}>Cancel</button>
                                </>
                            ) : (
                                <>
                                    {isEditing && onEdit &&
                                        <button className="btn btn-primary btn-sm me-2" onClick={() => startEditing(variant)}>Edit</button>
                                    }
                                    <button className="btn btn-danger btn-sm" onClick={() => handleRemoveVariant(variant.id)}>
                                        Delete
                                    </button>
                                </>
                            )}
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default VariantManager;
