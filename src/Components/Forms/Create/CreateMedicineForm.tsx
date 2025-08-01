import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import PageHeader from '../../Layout/PageHeader';
import { Medicine } from '../../../types/Medicine';
import {medicineApi} from "../../../services/api"; 


const CreateMedicineForm: React.FC = () => {
    const [title, setTitle] = useState('');
    const [quantity, setQuantity] = useState('');
    const [unit, setUnit] = useState('kg'); // Default unit
    // New states for warning thresholds
    const [warningKGThreshold, setWarningKgThreshold] = useState<number | ''>('');
    const [warningGramThreshold, setWarningTonThreshold] = useState<number | ''>('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Basic validation
        if (!title.trim() || !quantity || !unit.trim()) {
            toast.error('Please fill in all fields.');
            setIsLoading(false);
            return;
        }

        const quantityNum = Number(quantity);

        if (isNaN(quantityNum) || quantityNum <= 0) {
            toast.error('Invalid quantity.');
            setIsLoading(false);
            return;
        }

        const medicineData: Medicine = {
            title: title,
            quantity: quantityNum,
            unit: unit,
            createdDate: new Date().toISOString().split('T')[0],
            // Include warning thresholds in medicineData
            warningKGThreshold: typeof warningKGThreshold === 'number' ? warningKGThreshold : undefined,
            warningGramThreshold: typeof warningGramThreshold === 'number' ? warningGramThreshold : undefined,
        };

        try {
            const createdMedicine = await medicineApi.createMedicine(medicineData);
            console.log("Created medicine:", createdMedicine);
            toast.success(`Medicine "${createdMedicine.title}" created!`);
            navigate('/medicine');
        } catch (error: any) {
            toast.error(error.message || 'Failed to create medicine.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (value === '' || (/^\d+(\.\d{0,2})?$/.test(value) && Number(value) >= 0)) {
          setQuantity(value);
      }
    };

    const handleWarningKGChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (value === '' || (/^\d+(\.\d{0,2})?$/.test(value) && Number(value) >= 0)) {
        setWarningKgThreshold(value === '' ? '' : Number(value));
        if (value !== '') {
          setWarningTonThreshold(Number(value) * 1000); // Convert kg to ton
        } else {
          setWarningTonThreshold('');
        }
      }
    };

    const handleWarningGramChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (value === '' || (/^\d+(\.\d{0,2})?$/.test(value) && Number(value) >= 0)) {
        setWarningTonThreshold(value === '' ? '' : Number(value));
        if (value !== '') {
          setWarningKgThreshold(Number(value) / 1000); // Convert ton to kg
        } else {
          setWarningKgThreshold('');
        }
      }
    };

    return (
        <div className="container-fluid">
            <PageHeader
                title="Add New Medicine"
                buttonLabel="Back to Medicines"
                buttonLink="/medicine"
            />
            <div className="p-4">
                <form onSubmit={handleSubmit}>
                    <div className="row g-3">
                        <div className="col-md-6">
                            <label className="form-label">Title</label>
                            <input
                                type="text"
                                className="form-control"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </div>

                        <div className="col-md-6">
                            <label className="form-label">Quantity</label>
                            <input
                                type="text"
                                className="form-control"
                                value={quantity}
                                onChange={handleQuantityChange}
                                required
                            />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label">Unit</label>
                            <select
                                className="form-select"
                                value={unit}
                                onChange={(e) => setUnit(e.target.value)}
                                required
                            >
                                <option value="kg">kg</option>
                                <option value="gram">gram</option>
                            </select>
                        </div>

                        {/* New Warning Threshold Fields */}
                        <div className="col-md-6">
                            <label className="form-label">Warning Threshold (kg)</label>
                            <input
                                type="number"
                                className="form-control"
                                value={warningKGThreshold}
                                onChange={handleWarningKGChange}
                                placeholder="e.g., 20"
                            />
                        </div>

                        <div className="col-md-6">
                            <label className="form-label">Warning Threshold (gram)</label>
                            <input
                                type="number"
                                className="form-control"
                                value={warningGramThreshold}
                                onChange={handleWarningGramChange}
                                placeholder="e.g., 2000"
                            />
                        </div>


                        <div className="col-12">
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={isLoading}
                                onClick={() => navigate('/medicine')}
                            >
                                {isLoading ? 'Adding...' : 'Add Medicine'}
                            </button>
                            <button
                                type="button"
                                className="btn btn-secondary ms-2"
                                onClick={() => navigate('/medicine')}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateMedicineForm;