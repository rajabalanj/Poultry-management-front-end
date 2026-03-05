import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { journalEntryApi, chartOfAccountsApi } from '../../services/api';
import { JournalEntryCreate as IJournalEntryCreate, JournalEntryItem } from '../../types/journalEntry';
import { ChartOfAccountsResponse } from '../../types/chartOfAccounts';
import PageHeader from '../Layout/PageHeader';
import CustomDatePicker from '../Common/CustomDatePicker';
import './JournalEntry.css';

const JournalEntryCreate: React.FC = () => {
  const navigate = useNavigate();
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [referenceDocument, setReferenceDocument] = useState('');
  const [items, setItems] = useState<Array<Partial<JournalEntryItem>>>([
    { account_id: undefined, debit: 0, credit: 0 },
    { account_id: undefined, debit: 0, credit: 0 },
  ]);
  const [accounts, setAccounts] = useState<ChartOfAccountsResponse[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleItemChange = (index: number, field: keyof JournalEntryItem, value: string | number) => {
    const newItems = [...items];
    const item = { ...newItems[index] };
    (item as any)[field] = Number(value);
    newItems[index] = item;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { account_id: undefined, debit: 0, credit: 0 }]);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const calculateTotals = () => {
    return items.reduce<{ debit: number; credit: number }>(
      (acc, item) => {
        acc.debit += Number(item.debit) || 0;
        acc.credit += Number(item.credit) || 0;
        return acc;
      },
      { debit: 0, credit: 0 }
    );
  };

  const totals = calculateTotals();
  const isBalanced = totals.debit === totals.credit && totals.debit > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) {
      toast.error('Debits and credits must be equal and greater than zero.');
      return;
    }
    if (items.some(item => !item.account_id)) {
      toast.error('Please select an account for each item.');
      return;
    }

    setIsSubmitting(true);
    const entryData: IJournalEntryCreate = {
      date,
      description,
      reference_document: referenceDocument,
      items: items.map(item => ({
        account_id: item.account_id!,
        debit: Number(item.debit) || 0,
        credit: Number(item.credit) || 0,
      })),
    };

    try {
      await journalEntryApi.createJournalEntry(entryData);
      toast.success('Journal entry created successfully!');
      navigate('/journal-entries');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create journal entry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader 
        title="Create Journal Entry" 
        buttonLabel="Back to List"
        buttonLink="/journal-entries"
        buttonVariant="secondary"
        buttonIcon="bi-arrow-left"
      />
      <div className="container">
        <form onSubmit={handleSubmit} className="p-3 border shadow-sm">
          <div className="row mb-3">
            <div className="col-md-4">
              <label htmlFor="date" className="form-label">Date</label>
              <CustomDatePicker
                id="date"
                className="form-control"
                selected={date ? new Date(date) : null}
                onChange={(d: Date | null) => d && setDate(d.toISOString().slice(0, 10))}
                required
                showMonthDropdown
                showYearDropdown
              />
            </div>
            <div className="col-md-8">
              <label htmlFor="description" className="form-label">Description</label>
              <input
                type="text"
                id="description"
                className="form-control"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Entry description"
                required
              />
            </div>
          </div>
          <div className="mb-3">
            <label htmlFor="referenceDocument" className="form-label">Reference Document</label>
            <input
              type="text"
              id="referenceDocument"
              className="form-control"
              value={referenceDocument}
              onChange={(e) => setReferenceDocument(e.target.value)}
              placeholder="e.g., Invoice #, Receipt #"
            />
          </div>

          <h5 className="mt-4">Items</h5>
          <div className="table-responsive">
            <table className="table journal-entry-table">
              <thead>
                <tr>
                  <th>Account</th>
                  <th>Debit</th>
                  <th>Credit</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index}>
                    <td>
                      <select
                        className="form-select"
                        value={item.account_id || ''}
                        onChange={(e) => handleItemChange(index, 'account_id', e.target.value)}
                        required
                      >
                        <option value="" disabled>Select an account</option>
                        {accounts.map(acc => (
                          <option key={acc.id} value={acc.id}>
                            {acc.account_name} ({acc.account_code})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        className="form-control"
                        value={item.debit || ''}
                        onChange={(e) => handleItemChange(index, 'debit', e.target.value)}
                        step="0.01"
                        min="0"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="form-control"
                        value={item.credit || ''}
                        onChange={(e) => handleItemChange(index, 'credit', e.target.value)}
                        step="0.01"
                        min="0"
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => removeItem(index)}
                        disabled={items.length <= 2}
                      >
                        &times;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="text-end fw-bold">Totals</td>
                  <td className="fw-bold">{totals.debit.toFixed(2)}</td>
                  <td className="fw-bold">{totals.credit.toFixed(2)}</td>
                  <td></td>
                </tr>
                {!isBalanced && totals.debit > 0 && (
                  <tr>
                    <td colSpan={4} className="text-danger text-center">
                      Debits and Credits must be equal.
                    </td>
                  </tr>
                )}
              </tfoot>
            </table>
          </div>

          <div className="d-flex justify-content-between mt-3">
            <button type="button" className="btn btn-secondary" onClick={addItem}>
              Add Row
            </button>
            <button type="submit" className="btn btn-primary" disabled={!isBalanced || isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JournalEntryCreate;