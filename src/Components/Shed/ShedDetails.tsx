// src/Components/Shed/ShedDetails.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import PageHeader from '../Layout/PageHeader';
import { shedApi } from '../../services/api';
import { ShedResponse } from '../../types/shed';

const ShedDetails: React.FC = () => {
    const { shed_id } = useParams<{ shed_id: string }>();
    const navigate = useNavigate();
    const [shed, setShed] = useState<ShedResponse | null>(null);
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
            } catch (err: any) {
                setError(err?.message || "Failed to load shed details.");
                toast.error(err?.message || "Failed to load shed details.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchShed();
    }, [shed_id]);

    if (isLoading) return <div className="text-center mt-5">Loading shed details...</div>;
    if (error) return <div className="text-center text-danger mt-5">{error}</div>;
    if (!shed) return <div className="text-center mt-5">Shed not found or data is missing.</div>;

    return (
        <>
            <PageHeader title="Shed Details" buttonVariant="secondary" buttonLabel="Back to List" buttonLink="/sheds" />
            <div className="container mt-4">
                <div className="card shadow-sm">
                    <div className="card-header bg-primary text-white">
                        <h5 className="mb-0">Shed Information: {shed.shed_no}</h5>
                    </div>
                    <div className="card-body">
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <strong>Shed Number:</strong> {shed.shed_no}
                            </div>
                            <div className="col-md-6 mb-3">
                                <strong>Created At:</strong> {new Date(shed.created_at).toLocaleString()}
                            </div>
                            {shed.updated_at && (
                                <div className="col-md-6 mb-3">
                                    <strong>Last Updated:</strong> {new Date(shed.updated_at).toLocaleString()}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-4 d-flex justify-content-center gap-3">
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => navigate(`/sheds/${shed_id}/edit`)}
                    >
                        <i className="bi bi-pencil-square me-1"></i>
                        Edit
                    </button>
                    <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => {
                            if (window.confirm('Are you sure you want to delete this shed?')) {
                                shedApi.deleteShed(Number(shed_id))
                                    .then(() => {
                                        toast.success('Shed deleted successfully');
                                        navigate('/sheds');
                                    })
                                    .catch(err => {
                                        toast.error('Failed to delete shed: ' + err.message);
                                    });
                            }
                        }}
                    >
                        <i className="bi bi-trash me-1"></i>
                        Delete
                    </button>
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => navigate(-1)}
                    >
                        Back
                    </button>
                </div>
            </div>
        </>
    );
};

export default ShedDetails;
