import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import PageHeader from '../../Layout/PageHeader';
import { Feed } from '../../../types/Feed';
import {feedApi} from "../../../services/api";


const CreateFeedForm: React.FC = () => {
    const [title, setTitle] = useState('');
    const [quantity, setQuantity] = useState('');
    const [unit, setUnit] = useState('kg'); // Default unit
    // New states for warning thresholds
    const [warningKgThreshold, setWarningKgThreshold] = useState<number | ''>('');
    const [warningTonThreshold, setWarningTonThreshold] = useState<number | ''>('');
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

        const feedData: Feed = {
            title: title,
            quantity: quantityNum,
            unit: unit,
            createdDate: new Date().toISOString().split('T')[0],
            // Include warning thresholds in feedData
            warningKgThreshold: typeof warningKgThreshold === 'number' ? warningKgThreshold : undefined,
            warningTonThreshold: typeof warningTonThreshold === 'number' ? warningTonThreshold : undefined,
        };

        try {
            const createdFeed = await feedApi.createFeed(feedData);
            console.log("Created feed:", createdFeed);
            toast.success(`Feed "${createdFeed.title}" created!`);
            navigate('/feed');
        } catch (error: any) {
            toast.error(error.message || 'Failed to create feed.');
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

    const handleWarningKgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (value === '' || (/^\d+(\.\d{0,2})?$/.test(value) && Number(value) >= 0)) {
        setWarningKgThreshold(value === '' ? '' : Number(value));
        if (value !== '') {
          setWarningTonThreshold(Number(value) / 1000); // Convert kg to ton
        } else {
          setWarningTonThreshold('');
        }
      }
    };

    const handleWarningTonChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (value === '' || (/^\d+(\.\d{0,2})?$/.test(value) && Number(value) >= 0)) {
        setWarningTonThreshold(value === '' ? '' : Number(value));
        if (value !== '') {
          setWarningKgThreshold(Number(value) * 1000); // Convert ton to kg
        } else {
          setWarningKgThreshold('');
        }
      }
    };

    return (
        <div className="container-fluid">
            <PageHeader
                title="Add New Feed"
                buttonLabel="Back to Feeds"
                buttonLink="/feed"
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
                                <option value="ton">ton</option>
                            </select>
                        </div>

                        {/* New Warning Threshold Fields */}
                        <div className="col-md-6">
                            <label className="form-label">Warning Threshold (kg)</label>
                            <input
                                type="number"
                                className="form-control"
                                value={warningKgThreshold}
                                onChange={handleWarningKgChange}
                                placeholder="e.g., 2000"
                            />
                        </div>

                        <div className="col-md-6">
                            <label className="form-label">Warning Threshold (ton)</label>
                            <input
                                type="number"
                                className="form-control"
                                value={warningTonThreshold}
                                onChange={handleWarningTonChange}
                                placeholder="e.g., 2"
                            />
                        </div>


                        <div className="col-12">
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={isLoading}
                                onClick={() => navigate('/feed')}
                            >
                                {isLoading ? 'Adding...' : 'Add Feed'}
                            </button>
                            <button
                                type="button"
                                className="btn btn-secondary ms-2"
                                onClick={() => navigate('/feed')}
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

export default CreateFeedForm;