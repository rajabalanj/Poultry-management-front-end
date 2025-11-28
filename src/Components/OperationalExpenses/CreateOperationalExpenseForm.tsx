// src/components/OperationalExpenses/CreateOperationalExpenseForm.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import PageHeader from '../Layout/PageHeader';
import { operationalExpenseApi } from '../../services/api';
import { OperationalExpense } from '../../types/operationalExpense';

const CreateOperationalExpenseForm: React.FC = () => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [expense_type, setExpenseType] = useState('');
    const [amount, setAmount] = useState<number | ''>('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        if (!date || !expense_type.trim() || amount === '' || amount <= 0) {
            toast.error('All fields are required and amount must be positive.');
            setIsLoading(false);
            return;
        }

        const newExpense: Omit<OperationalExpense, 'id' | 'tenant_id'> = {
            date,
            expense_type,
            amount: Number(amount),
        };

        try {
            await operationalExpenseApi.createOperationalExpense(newExpense);
            toast.success('Operational expense created successfully!');
            navigate('/operational-expenses');
        } catch (error: any) {
            toast.error(error?.message || 'Failed to create operational expense.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <PageHeader title="Create New Operational Expense" buttonVariant="secondary" buttonLabel="Back" buttonLink="/operational-expenses" />
            <div className='container mt-4'>
                <div className="card shadow-sm">
                    <div className="card-body">
                        <form onSubmit={handleSubmit}>
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label htmlFor="expenseDate" className="form-label">Date <span className="form-field-required">*</span></label>
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
                                    <label htmlFor="expenseType" className="form-label">Expense Type <span className="form-field-required">*</span></label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="expenseType"
                                        value={expense_type}
                                        onChange={(e) => setExpenseType(e.target.value)}
                                        placeholder="e.g., Electricity Bill"
                                        required
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label htmlFor="expenseAmount" className="form-label">Amount <span className="form-field-required">*</span></label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        id="expenseAmount"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                                        placeholder="0.00"
                                        required
                                        min="0.01"
                                        step="0.01"
                                    />
                                </div>

                                <div className="col-12 mt-4">
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? 'Creating...' : 'Create Expense'}
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

export default CreateOperationalExpenseForm;
