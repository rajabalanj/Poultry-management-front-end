// src/components/OperationalExpenses/EditOperationalExpense.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import PageHeader from '../Layout/PageHeader';
import { operationalExpenseApi, chartOfAccountsApi } from '../../services/api';
import { OperationalExpense } from '../../types/operationalExpense';
import { ChartOfAccountsResponse } from '../../types/chartOfAccounts';
import CustomDatePicker from '../Common/CustomDatePicker';
import { useSubscription } from '../context/SubscriptionContext';
import SubscriptionWarning from "../Common/SubscriptionWarning"; // adjust path as needed

const EditOperationalExpense: React.FC = () => {
    const { expense_id } = useParams<{ expense_id: string }>();
    const navigate = useNavigate();
    const [expense, setExpense] = useState<OperationalExpense | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [date, setDate] = useState('');
    const [account_id, setAccountId] = useState<number | ''>('');
    const [amount, setAmount] = useState<number | ''>('');
    const [accounts, setAccounts] = useState<ChartOfAccountsResponse[]>([]);

    const { isSubscriptionPaid } = useSubscription();

    useEffect(() => {
        const fetchAccountsAndExpense = async () => {
            try {
                setLoading(true);
                const accountsData = await chartOfAccountsApi.getChartOfAccounts();
                setAccounts(accountsData);

                if (!expense_id) {
                    setError("Expense ID is missing.");
                    setLoading(false);
                    return;
                }
                const expenseToEdit = await operationalExpenseApi.getOperationalExpense(Number(expense_id));

                if (expenseToEdit) {
                    setExpense(expenseToEdit);
                    setDate(expenseToEdit.expense_date);
                    setAccountId(expenseToEdit.account_id);
                    setAmount(expenseToEdit.amount);
                } else {
                    setError("Operational expense not found.");
                    toast.error("Operational expense not found.");
                }
            } catch (err: any) {
                console.error("Error fetching operational expense data:", err);
                setError(err?.message || "Failed to load operational expense for editing.");
                toast.error(err?.message || "Failed to load operational expense for editing.");
            } finally {
                setLoading(false);
            }
        };

        fetchAccountsAndExpense();
    }, [expense_id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!date || account_id === '' || amount === '' || amount <= 0) {
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
            expense_date: date,
            account_id: Number(account_id),
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

    const currentAccount = accounts.find(acc => acc.id === expense.account_id);
    const accountLabel = currentAccount ? currentAccount.account_name : '';

    return (
        <>
            <PageHeader title={`Edit Expense: ${accountLabel}`} buttonVariant="secondary" buttonLabel="Back to List" buttonLink="/operational-expenses" buttonIcon='bi-arrow-left'/>
            <div className="container">
                <SubscriptionWarning />
                <div className="card shadow-sm">
                    <div className="card-body">
                        <form onSubmit={handleSubmit}>
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label htmlFor="expenseDate" className="form-label">Date <span className="form-field-required">*</span></label>
                                    <CustomDatePicker
                                        className="form-control"
                                        id="expenseDate"
                                        selected={date ? new Date(date) : null}
                                        onChange={(d: Date | null) => d && setDate(d.toISOString().slice(0, 10))}
                                        required
                                        showMonthDropdown
                                        showYearDropdown
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label htmlFor="accountId" className="form-label">Account <span className="form-field-required">*</span></label>
                                    <select
                                        className="form-select"
                                        id="accountId"
                                        value={account_id}
                                        onChange={(e) => setAccountId(e.target.value === '' ? '' : Number(e.target.value))}
                                        required
                                    >
                                        <option value="" disabled>Select an account</option>
                                        {accounts.filter(acc => acc.account_type === 'Expense').map(acc => (
                                            <option key={acc.id} value={acc.id}>
                                                {acc.account_name} ({acc.account_code})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md-6">
                                    <label htmlFor="expenseAmount" className="form-label">Amount <span className="form-field-required">*</span></label>
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
                                        disabled={loading || isSubscriptionPaid === false}
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
