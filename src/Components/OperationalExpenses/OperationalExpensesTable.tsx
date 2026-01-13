// src/components/OperationalExpenses/OperationalExpensesTable.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { OperationalExpense } from "../../types/operationalExpense";
import { Button } from "react-bootstrap";

interface OperationalExpensesTableProps {
  expenses: OperationalExpense[];
  loading: boolean;
  error: string | null;
  onDelete: (id: number) => void;
}

const OperationalExpensesTable: React.FC<OperationalExpensesTableProps> = ({ expenses, loading, error, onDelete }) => {
  const navigate = useNavigate();

  const handleEdit = (id: number) => {
    navigate(`/operational-expenses/${id}/edit`);
  };

  if (loading) return <div className="text-center">Loading expenses...</div>;
  if (error) return <div className="text-center text-danger">{error}</div>;
  if (expenses.length === 0) return <div className="text-center">No operational expenses found.</div>;

  return (
    <div className="table-responsive">
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
          {expenses.map((expense) => (
            <tr key={expense.id}>
              <td>{new Date(expense.date).toLocaleDateString()}</td>
              <td>{expense.expense_type}</td>
              <td>{expense.amount_str || (typeof expense.amount === 'number' ? expense.amount.toFixed(2) : parseFloat(expense.amount || '0').toFixed(2))}</td>
              <td>
                <Button variant="outline-primary" size="sm" className="ms-2" onClick={() => handleEdit(expense.id)}>
                  <i className="bi bi-pencil-fill"></i>
                </Button>
                <Button variant="outline-danger" size="sm" className="ms-2" onClick={() => onDelete(expense.id)}>
                  <i className="bi bi-trash-fill"></i>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OperationalExpensesTable;
