import React, { useState, useEffect } from 'react';
import { useParams} from 'react-router-dom';
import { toast } from 'react-toastify';
import { journalEntryApi, chartOfAccountsApi } from '../../services/api';
import { JournalEntryResponse } from '../../types/journalEntry';
import { ChartOfAccountsResponse } from '../../types/chartOfAccounts';
import PageHeader from '../Layout/PageHeader';
import { format } from 'date-fns';
import './JournalEntry.css';

const JournalEntryView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [entry, setEntry] = useState<JournalEntryResponse | null>(null);
  const [accounts, setAccounts] = useState<Map<number, ChartOfAccountsResponse>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEntryAndAccounts = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [entryData, accountsData] = await Promise.all([
          journalEntryApi.getJournalEntry(parseInt(id)),
          chartOfAccountsApi.getChartOfAccounts()
        ]);
        
        setEntry(entryData);

        const accountsMap = new Map<number, ChartOfAccountsResponse>();
        accountsData.forEach(acc => accountsMap.set(acc.id, acc));
        setAccounts(accountsMap);

      } catch (error: any) {
        toast.error(error.message || 'Failed to fetch journal entry details.');
      } finally {
        setLoading(false);
      }
    };

    fetchEntryAndAccounts();
  }, [id]);

  const getAccountName = (accountId: number) => {
    const account = accounts.get(accountId);
    return account ? `${account.account_name} (${account.account_code})` : 'Unknown Account';
  };

  const calculateTotals = () => {
    if (!entry) return { debit: 0, credit: 0 };
    return entry.items.reduce(
      (acc, item) => {
        acc.debit += Number(item.debit) || 0;
        acc.credit += Number(item.credit) || 0;
        return acc;
      },
      { debit: 0, credit: 0 }
    );
  };

  const totals = calculateTotals();

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!entry) {
    return <p>Journal entry not found.</p>;
  }

  return (
    <div>
      <PageHeader 
        title={`Journal Entry #${entry.id}`}
        buttonLabel="Back to List"
        buttonLink="/journal-entries"
        buttonVariant="secondary"
        buttonIcon="bi-arrow-left"
      />
      <div className="container">
        <div className="p-3 border shadow-sm mb-4">
          <div className="row">
            <div className="col-md-6">
              <p><strong>Date:</strong> {format(new Date(entry.date), 'dd-MM-yyyy')}</p>
              <p><strong>Description:</strong> {entry.description}</p>
            </div>
            <div className="col-md-6">
              <p><strong>Reference Document:</strong> {entry.reference_document || 'N/A'}</p>
            </div>
          </div>
        </div>

        <h5 className="mt-4">Entry Items</h5>
        <div className="table-responsive">
          <table className="table table-bordered journal-entry-table">
            <thead>
              <tr>
                <th>Account</th>
                <th className="text-end">Debit</th>
                <th className="text-end">Credit</th>
              </tr>
            </thead>
            <tbody>
              {entry.items.map((item, index) => (
                <tr key={index}>
                  <td>{getAccountName(item.account_id)}</td>
                  <td className="text-end">{Number(item.debit).toFixed(2)}</td>
                  <td className="text-end">{Number(item.credit).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="text-end fw-bold">Totals</td>
                <td className="text-end fw-bold">{totals.debit.toFixed(2)}</td>
                <td className="text-end fw-bold">{totals.credit.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default JournalEntryView;