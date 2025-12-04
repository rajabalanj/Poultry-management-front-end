// src/Components/Shed/EditShed.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import PageHeader from '../Layout/PageHeader';
import { shedApi } from '../../services/api';
import { Shed, ShedResponse } from '../../types/shed';

const EditShed: React.FC = () => {
    const { shed_id } = useParams<{ shed_id: string }>();
    const navigate = useNavigate();
    const [shed, setShed] = useState<ShedResponse | null>(null);
    const [shedNo, setShedNo] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchShed = async () => {
            try {
                if (!shed_id) {
                    setError("Shed ID is missing.");
                    setIsLoading(false);
                    return;
                }
                const data = await shedApi.getShed(Number(shed_id));
                setShed(data);
                setShedNo(data.shed_no);
            } catch (err: any) {
                setError(err?.message || "Failed to load shed for editing.");
                toast.error(err?.message || "Failed to load shed for editing.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchShed();
    }, [shed_id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        if (!shedNo.trim()) {
            toast.error('Shed Number is required.');
            setIsLoading(false);
            return;
        }

        if (!shed_id) {
            toast.error('Shed ID is missing for update operation.');
            setIsLoading(false);
            return;
        }

        const updatedShed: Shed = {
            shed_no: shedNo,
        };

        try {
            await shedApi.updateShed(Number(shed_id), updatedShed);
            toast.success('Shed updated successfully!');
            navigate('/sheds');
        } catch (error: any) {
            toast.error(error?.message || 'Failed to update shed.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && !shed) return <div className="text-center mt-5">Loading shed data...</div>;
    if (error) return <div className="text-center text-danger mt-5">{error}</div>;
    if (!shed) return <div className="text-center mt-5">Shed not found.</div>;

    return (
        <>
            <PageHeader title={`Edit Shed: ${shed.shed_no}`} buttonVariant="secondary" buttonLabel="Back to List" buttonLink="/sheds" buttonIcon='bi-arrow-left'/>
            <div className="container mt-4">
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
                                        required
                                    />
                                </div>

                                <div className="col-12 mt-4">
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? 'Saving...' : 'Save Changes'}
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

export default EditShed;
