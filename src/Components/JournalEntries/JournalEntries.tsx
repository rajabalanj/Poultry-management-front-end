import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Pagination } from 'react-bootstrap';
import { journalEntryApi } from '../../services/api';
import { JournalEntryResponse } from '../../types/journalEntry';
import PageHeader from '../Layout/PageHeader';
import { format } from 'date-fns';

const JournalEntries: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

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

  const renderPaginationItems = () => {
    const items = [];
    
    items.push(
      <Pagination.Prev
        key="prev"
        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
        disabled={currentPage === 1}
      />
    );

    if (totalPages <= 7) {
      for (let number = 1; number <= totalPages; number++) {
        items.push(
          <Pagination.Item key={number} active={number === currentPage} onClick={() => setCurrentPage(number)}>
            {number}
          </Pagination.Item>
        );
      }
    } else {
      items.push(
        <Pagination.Item key={1} active={1 === currentPage} onClick={() => setCurrentPage(1)}>
          1
        </Pagination.Item>
      );

      if (currentPage > 4) items.push(<Pagination.Ellipsis key="start-ellipsis" disabled />);

      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 4) {
        endPage = 5;
        startPage = 2;
      } else if (currentPage >= totalPages - 3) {
        startPage = totalPages - 4;
        endPage = totalPages - 1;
      }

      for (let number = startPage; number <= endPage; number++) {
        items.push(
          <Pagination.Item key={number} active={number === currentPage} onClick={() => setCurrentPage(number)}>
            {number}
          </Pagination.Item>
        );
      }

      if (currentPage < totalPages - 3) items.push(<Pagination.Ellipsis key="end-ellipsis" disabled />);

      items.push(
        <Pagination.Item key={totalPages} active={totalPages === currentPage} onClick={() => setCurrentPage(totalPages)}>
          {totalPages}
        </Pagination.Item>
      );
    }

    items.push(
      <Pagination.Next
        key="next"
        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
        disabled={currentPage === totalPages}
      />
    );

    return items;
  };

  return (
    <div>
      <PageHeader 
        title="Journal Entries"
        buttonLabel="Create Journal Entry"
        buttonLink="/journal-entries/create"
        buttonVariant="primary"
        buttonIcon='bi-plus-lg'
      />
      <div className="container">
        <div className="p-3 border shadow-sm mb-4">
          <div className="row g-3 align-items-center">
            <div className="col-md-3">
              <label htmlFor="startDate" className="form-label">Start Date</label>
              <input
                type="date"
                id="startDate"
                className="form-control"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <label htmlFor="endDate" className="form-label">End Date</label>
              <input
                type="date"
                id="endDate"
                className="form-control"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
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
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map(entry => (
                  <tr key={entry.id}>
                    <td>{entry.id}</td>
                    <td>{format(new Date(entry.date), 'dd-MM-yyyy')}</td>
                    <td>{entry.description}</td>
                    <td>{entry.reference_document || 'N/A'}</td>
                    <td>
                      <Link to={`/journal-entries/${entry.id}`} className="btn btn-sm btn-info">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalPages > 1 && (
              <Pagination className="justify-content-center">
                  {renderPaginationItems()}
              </Pagination>
            )}
          </div>
        )}
        {!loading && entries.length === 0 && <p>No journal entries found.</p>}
      </div>
    </div>
  );
};

export default JournalEntries;