// src/components/OperationalExpenses/CreateOperationalExpenseForm.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import PageHeader from '../Layout/PageHeader';
import { operationalExpenseApi, chartOfAccountsApi } from '../../services/api';
import { OperationalExpense } from '../../types/operationalExpense';
import { ChartOfAccountsResponse } from '../../types/chartOfAccounts';
import CustomDatePicker from '../Common/CustomDatePicker';
import { useSubscription } from '../context/SubscriptionContext';
import SubscriptionWarning from "../Common/SubscriptionWarning"; // adjust path as needed


const CreateOperationalExpenseForm: React.FC = () => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [account_id, setAccountId] = useState<number | ''>('');
    const [amount, setAmount] = useState<number | ''>('');
    const [accounts, setAccounts] = useState<ChartOfAccountsResponse[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { isSubscriptionPaid } = useSubscription();

    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                const accountsData = await chartOfAccountsApi.getChartOfAccounts();
                setAccounts(accountsData);
            } catch (error) {
                toast.error('Failed to fetch chart of accounts.');
            }
        };
        fetchAccounts();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        if (!date || account_id === '' || amount === '' || amount <= 0) {
            toast.error('All fields are required and amount must be positive.');
            setIsLoading(false);
            return;
        }

        const newExpense: Omit<OperationalExpense, 'id' | 'tenant_id'> = {
            expense_date: date,
            account_id: Number(account_id),
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
            <PageHeader title="Create New Operational Expense" buttonVariant="secondary" buttonLabel="Back" buttonLink="/operational-expenses" buttonIcon='bi-arrow-left'/>
            <div className='container'>
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
                                        disabled={isLoading || isSubscriptionPaid === false}
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
