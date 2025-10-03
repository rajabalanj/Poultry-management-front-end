// src/components/OperationalExpenses/EditOperationalExpense.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import PageHeader from '../Layout/PageHeader';
import { operationalExpenseApi } from '../../services/api';
import { OperationalExpense } from '../../types/operationalExpense';

const EditOperationalExpense: React.FC = () => {
    const { expense_id } = useParams<{ expense_id: string }>();
    const navigate = useNavigate();
    const [expense, setExpense] = useState<OperationalExpense | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [date, setDate] = useState('');
    const [expense_type, setExpenseType] = useState('');
    const [amount, setAmount] = useState<number | ''>('');

    useEffect(() => {
        const fetchExpense = async () => {
            try {
                if (!expense_id) {
                    setError("Expense ID is missing.");
                    setLoading(false);
                    return;
                }
                const expenseToEdit = await operationalExpenseApi.getOperationalExpense(Number(expense_id));

                if (expenseToEdit) {
                    setExpense(expenseToEdit);
                    setDate(new Date(expenseToEdit.date).toISOString().split('T')[0]);
                    setExpenseType(expenseToEdit.expense_type);
                    setAmount(expenseToEdit.amount);
                } else {
                    setError("Operational expense not found.");
                    toast.error("Operational expense not found.");
                }
            } catch (err: any) {
                console.error("Error fetching operational expense:", err);
                setError(err?.message || "Failed to load operational expense for editing.");
                toast.error(err?.message || "Failed to load operational expense for editing.");
            } finally {
                setLoading(false);
            }
        };

        fetchExpense();
    }, [expense_id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!date || !expense_type.trim() || amount === '' || amount <= 0) {
            toast.error('All fields are required and amount must be positive.');
            setLoading(false);
            return;
        }

        if (!expense_id) {
            toast.error('Expense ID is missing for update operation.');
            setLoading(false);
            return;
        }

        const updatedExpense: Partial<Omit<OperationalExpense, 'id' | 'tenant_id'>> = {
            date,
            expense_type,
            amount: Number(amount),
        };

        try {
            await operationalExpenseApi.updateOperationalExpense(Number(expense_id), updatedExpense);
            toast.success('Operational expense updated successfully!');
            navigate('/operational-expenses');
        } catch (error: any) {
            toast.error(error?.message || 'Failed to update operational expense.');
        } finally {
            setLoading(false);
        }
    };

    if (loading && !expense) return <div className="text-center mt-5">Loading expense data...</div>;
    if (error) return <div className="text-center text-danger mt-5">{error}</div>;
    if (!expense) return <div className="text-center mt-5">Operational expense not found.</div>;

    return (
        <>
            <PageHeader title={`Edit Expense: ${expense.expense_type}`} buttonVariant="secondary" buttonLabel="Back to List" buttonLink="/operational-expenses" />
            <div className="container mt-4">
                <div className="card shadow-sm">
                    <div className="card-body">
                        <form onSubmit={handleSubmit}>
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label htmlFor="expenseDate" className="form-label">Date <span className="text-danger">*</span></label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        id="expenseDate"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label htmlFor="expenseType" className="form-label">Expense Type <span className="text-danger">*</span></label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="expenseType"
                                        value={expense_type}
                                        onChange={(e) => setExpenseType(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label htmlFor="expenseAmount" className="form-label">Amount <span className="text-danger">*</span></label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        id="expenseAmount"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                                        required
                                        min="0.01"
                                        step="0.01"
                                    />
                                </div>

                                <div className="col-12 mt-4">
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={loading}
                                    >
                                        {loading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-secondary ms-2"
                                        onClick={() => navigate('/operational-expenses')}
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

export default EditOperationalExpense;