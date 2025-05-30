import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
// import { apiService } from '../services/apiService'; //  Use your actual apiService
import PageHeader from '../../Layout/PageHeader';
import { Feed } from '../../../types/Feed';
import {feedApi} from "../../../services/api";


const CreateFeedForm: React.FC = () => {
    const [title, setTitle] = useState('');
    const [quantity, setQuantity] = useState('');
    const [unit, setUnit] = useState('kg'); // Default unit
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
        createdDate: new Date().toISOString().split('T')[0], // Assuming this is optional and can be null
        };

        try {
            const createdFeed = await feedApi.createFeed(feedData); //  Use your apiService
            console.log("Created feed:", createdFeed);
            toast.success(`Feed "${createdFeed.title}" created!`);
            navigate('/'); //  Go back
        } catch (error: any) {
            toast.error(error.message || 'Failed to create feed.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      // Allow only positive numbers and empty string
      if (value === '' || (/^\d+(\.\d{0,2})?$/.test(value) && Number(value) >= 0)) {
          setQuantity(value);
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