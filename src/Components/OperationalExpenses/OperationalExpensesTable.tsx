// src/components/OperationalExpenses/OperationalExpensesTable.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { OperationalExpense } from "../../types/operationalExpense";
import { Button } from "react-bootstrap";
import { useSubscription } from "../context/SubscriptionContext";
import CustomPagination from "../Common/CustomPagination";
import { useTableKeyboardNavigation } from "../../hooks/useTableKeyboardNavigation";

interface OperationalExpensesTableProps {
  expenses: OperationalExpense[];
  loading: boolean;
  error: string | null;
  onDelete: (id: number) => void;
}

const OperationalExpensesTable: React.FC<OperationalExpensesTableProps> = ({ expenses, loading, error, onDelete }) => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [focusedRowIndex, setFocusedRowIndex] = useState<number>(-1);

  useEffect(() => {
    setCurrentPage(1);
  }, [expenses]);

  const getPaginatedExpenses = useCallback(() => {
    return expenses.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  }, [expenses, currentPage]);

  const { resetSelection, setSelectedIndex } = useTableKeyboardNavigation({
    rowCount: getPaginatedExpenses().length,
    containerRef: tableContainerRef,
    onRowSelect: (index) => {
      setFocusedRowIndex(index);
    },
    onRowEnter: (index) => {
      const paginated = getPaginatedExpenses();
      if (paginated && paginated[index]) {
        handleView(paginated[index].id);
      }
    },
    onRowAction: (index, key) => {
      const paginated = getPaginatedExpenses();
      if (!paginated || !paginated[index]) return;
      const id = paginated[index].id;
      const k = key.toLowerCase();
      if (k === 'e' && isSubscriptionPaid !== false) {
        handleEdit(id);
      } else if (k === 'd' && isSubscriptionPaid !== false) {
        onDelete(id);
      }
    },
    enabled: getPaginatedExpenses().length > 0,
    actionKeys: ['e', 'E', 'd', 'D'],
  });

  useEffect(() => {
    resetSelection();
    setFocusedRowIndex(-1);
  }, [expenses, currentPage, resetSelection]);

  const totalPages = Math.ceil(expenses.length / ITEMS_PER_PAGE);
  const paginatedExpenses = expenses.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleEdit = (id: number) => {
    navigate(`/operational-expenses/${id}/edit`);
  };

  const handleView = (id: number) => {
    navigate(`/operational-expenses/${id}/details`);
  };

  const { isSubscriptionPaid } = useSubscription();

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  if (loading) return <div className="text-center">Loading expenses...</div>;
  if (error) return <div className="text-center text-danger">{error}</div>;
  if (expenses.length === 0) return <div className="text-center">No operational expenses found.</div>;

  return (
    <div>
      <div className="table-responsive" ref={tableContainerRef} tabIndex={0} style={{ outline: 'none' }}>
      <table className="table table-striped table-hover">
        <thead className="thead-dark">
          <tr>
            <th>Date</th>
            <th>Expense Type</th>
            <th>Amount</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedExpenses.map((expense, index) => (
            <tr 
              key={expense.id} 
              data-row-index={index}
              onClick={() => {
                setFocusedRowIndex(index);
                setSelectedIndex(index);
                handleView(expense.id);
              }} 
              className={focusedRowIndex === index ? 'table-primary' : ''}
              style={{ cursor: 'pointer' }}
            >
              <td>{formatDate(expense.expense_date)}</td>
              <td>{expense.expense_type}</td>
              <td>{expense.amount_str || (typeof expense.amount === 'number' ? expense.amount.toFixed(2) : parseFloat(expense.amount || '0').toFixed(2))}</td>
              <td>
                <Button variant="outline-primary" size="sm" className="ms-2" onClick={(e) => { e.stopPropagation(); handleEdit(expense.id); }} disabled={isSubscriptionPaid === false}>
                  <i className="bi bi-pencil-fill"></i>
                </Button>
                <Button variant="outline-danger" size="sm" className="ms-2" onClick={(e) => { e.stopPropagation(); onDelete(expense.id); }} disabled={isSubscriptionPaid === false}>
                  <i className="bi bi-trash-fill"></i>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      <CustomPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </div>
  );
};

export default OperationalExpensesTable;
