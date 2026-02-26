// src/components/OperationalExpenses/ViewOperationalExpense.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import PageHeader from '../Layout/PageHeader';
import { operationalExpenseApi } from '../../services/api';
import { OperationalExpense } from '../../types/operationalExpense';

const ViewOperationalExpense: React.FC = () => {
    const { expense_id } = useParams<{ expense_id: string }>();
    const navigate = useNavigate();
    const [expense, setExpense] = useState<OperationalExpense | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchExpense = async () => {
            try {
                if (!expense_id) {
                    setError("Expense ID is missing.");
                    setLoading(false);
                    return;
                }
                const expenseData = await operationalExpenseApi.getOperationalExpense(Number(expense_id));

                if (expenseData) {
                    setExpense(expenseData);
                } else {
                    setError("Operational expense not found.");
                    toast.error("Operational expense not found.");
                }
            } catch (err: any) {
                console.error("Error fetching operational expense:", err);
                setError(err?.message || "Failed to load operational expense.");
                toast.error(err?.message || "Failed to load operational expense.");
            } finally {
                setLoading(false);
            }
        };

        fetchExpense();
    }, [expense_id]);

    if (loading) return <div className="text-center mt-5">Loading expense data...</div>;
    if (error) return <div className="text-center text-danger mt-5">{error}</div>;
    if (!expense) return <div className="text-center mt-5">Operational expense not found.</div>;

    return (
        <>
            <PageHeader 
                title={`Expense Details: ${expense.expense_type}`} 
                buttonVariant="secondary" 
                buttonLabel="Back to List" 
                buttonLink="/operational-expenses" 
                buttonIcon='bi-arrow-left'
            />
            <div className="container mt-4">
                <div className="card shadow-sm">
                    <div className="card-body">
                        <div className="row g-3">
                            <div className="col-md-6">
                                <label className="form-label fw-bold">Date</label>
                                <div className="form-control-plaintext">{expense.expense_date}</div>
                            </div>
                            <div className="col-md-6">
                                <label className="form-label fw-bold">Expense Type</label>
                                <div className="form-control-plaintext">{expense.expense_type}</div>
                            </div>
                            <div className="col-md-6">
                                <label className="form-label fw-bold">Amount</label>
                                <div className="form-control-plaintext">
                                    {typeof expense.amount === 'number' ? expense.amount.toFixed(2) : parseFloat(expense.amount || '0').toFixed(2)}
                                </div>
                            </div>

                            <div className="col-12 mt-4">
                                <button
                                    className="btn btn-primary"
                                    onClick={() => navigate(`/operational-expenses/${expense.id}/edit`)}
                                >
                                    <i className="bi bi-pencil me-1"></i> Edit
                                </button>
                                <button
                                    className="btn btn-secondary ms-2"
                                    onClick={() => navigate(-1)}
                                >
                                    Back
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ViewOperationalExpense;
