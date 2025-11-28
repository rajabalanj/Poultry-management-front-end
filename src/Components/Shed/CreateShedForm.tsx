// src/Components/Shed/CreateShedForm.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import PageHeader from '../Layout/PageHeader';
import { shedApi } from '../../services/api';
import { Shed } from '../../types/shed';

const CreateShedForm: React.FC = () => {
    const [shedNo, setShedNo] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        if (!shedNo.trim()) {
            toast.error('Shed Number is required.');
            setIsLoading(false);
            return;
        }

        const newShed: Shed = {
            shed_no: shedNo,
        };

        try {
            await shedApi.createShed(newShed);
            toast.success('Shed created successfully!');
            navigate('/sheds');
        } catch (error: any) {
            toast.error(error?.message || 'Failed to create shed.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <PageHeader title="Create New Shed" buttonVariant="secondary" buttonLabel="Back" buttonLink="/sheds" />
            <div className='container mt-4'>
                <div className="card shadow-sm">
                    <div className="card-body">
                        <form onSubmit={handleSubmit}>
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label htmlFor="shedNo" className="form-label">Shed Number <span className="form-field-required">*</span></label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="shedNo"
                                        value={shedNo}
                                        onChange={(e) => setShedNo(e.target.value)}
                                        placeholder="e.g., Shed A"
                                        required
                                    />
                                </div>

                                <div className="col-12 mt-4">
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? 'Creating...' : 'Create Shed'}
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-secondary ms-2"
                                        onClick={() => navigate('/sheds')}
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

export default CreateShedForm;
