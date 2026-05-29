import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { journalEntryApi } from '../../services/api';
import { JournalEntryResponse } from '../../types/journalEntry';
import PageHeader from '../Layout/PageHeader';
import { useSubscription } from '../context/SubscriptionContext';
import { format } from 'date-fns';
import CustomDatePicker from '../Common/CustomDatePicker';
import CustomPagination from '../Common/CustomPagination';

const JournalEntries: React.FC = () => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<JournalEntryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const { isSubscriptionPaid } = useSubscription();

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const data = await journalEntryApi.getJournalEntries(startDate, endDate, 0, 10000);
      setEntries(data);
      setCurrentPage(1);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch journal entries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Fetch on initial render

  const handleFilter = () => {
    fetchEntries();
  };

  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = entries.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(entries.length / ITEMS_PER_PAGE);

  return (
    <div>
      <PageHeader 
        title="Journal Entries"
        buttonLabel="Create Journal Entry"
        buttonLink="/journal-entries/create"
        buttonVariant="primary"
        buttonIcon='bi-plus-lg'
        buttonDisabled={isSubscriptionPaid === false}
      />
      <div className="container">
        <div className="p-3 border shadow-sm mb-4">
          <div className="row g-3 align-items-center">
            <div className="col-md-3">
              <label htmlFor="startDate" className="form-label">Start Date</label>
              <CustomDatePicker
                id="startDate"
                className="form-control"
                selected={startDate ? new Date(startDate) : null}
                onChange={(date: Date | null) => setStartDate(date ? date.toISOString().slice(0, 10) : '')}
                maxDate={endDate ? new Date(endDate) : undefined}
                showMonthDropdown
                showYearDropdown
              />
            </div>
            <div className="col-md-3">
              <label htmlFor="endDate" className="form-label">End Date</label>
              <CustomDatePicker
                id="endDate"
                className="form-control"
                selected={endDate ? new Date(endDate) : null}
                onChange={(date: Date | null) => setEndDate(date ? date.toISOString().slice(0, 10) : '')}
                minDate={startDate ? new Date(startDate) : undefined}
                showMonthDropdown
                showYearDropdown
              />
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button className="btn btn-info" onClick={handleFilter}>Filter</button>
            </div>
          </div>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Reference</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map(entry => (
                  <tr key={entry.id} onClick={() => navigate(`/journal-entries/${entry.id}`)} style={{ cursor: 'pointer' }}>
                    <td>{entry.id}</td>
                    <td>{format(new Date(entry.date), 'dd-MM-yyyy')}</td>
                    <td>{entry.description}</td>
                    <td>{entry.reference_document || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <CustomPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              className="justify-content-center"
            />
          </div>
        )}
        {!loading && entries.length === 0 && <p>No journal entries found.</p>}
      </div>
    </div>
  );
};

export default JournalEntries;