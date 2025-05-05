import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
// import { apiService } from '../services/apiService'; //  Use your actual apiService
import '../styles/global.css';
import PageHeader from './PageHeader';

// Mock apiService (replace with your actual implementation)
const apiService = {
    createFeed: async (feedData: any) => {
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log("Creating feed:", feedData);
        return { ...feedData, id: Math.floor(Math.random() * 1000), lastUsedAt: null };
    },
};

interface Feed {
    title: string;
    quantity: number;
    unit: string;
    id?: number;  //  Optional because the backend generates it
    lastUsedAt?: string | null;
}

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
            title,
            quantity: quantityNum,
            unit,
        };

        try {
            const createdFeed = await apiService.createFeed(feedData); //  Use your apiService
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
                buttonLink="/"
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
                            >
                                {isLoading ? 'Adding...' : 'Add Feed'}
                            </button>
                            <button
                                type="button"
                                className="btn btn-secondary ms-2"
                                onClick={() => navigate('/')}
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