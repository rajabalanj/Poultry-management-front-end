// src/components/OperationalExpenses/OperationalExpensesIndex.tsx
import React, { useCallback, useEffect, useState } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import PageHeader from "../Layout/PageHeader";
import { Modal, Button } from "react-bootstrap";
import { operationalExpenseApi } from "../../services/api";
import { OperationalExpense } from "../../types/operationalExpense";
import { toast } from 'react-toastify';
import OperationalExpensesTable from "./OperationalExpensesTable";
import ErrorBoundary from "../Common/ErrorBoundary";
import DatePicker from 'react-datepicker';

const OperationalExpensesIndexPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [operationalExpenses, setOperationalExpenses] = useState<OperationalExpense[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<number | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchOperationalExpenses = async (start: string, end: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await operationalExpenseApi.getOperationalExpenses(start, end);
      setOperationalExpenses(response);
    } catch (error: any) {
      const message = error?.message || 'Failed to fetch operational expenses';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchClick = () => {
    fetchOperationalExpenses(startDate, endDate);
  };

  useEffect(() => {
    fetchOperationalExpenses(startDate, endDate);
  }, []);

  const handleDelete = useCallback((id: number) => {
    setExpenseToDelete(id);
    setDeleteErrorMessage(null);
    setShowDeleteModal(true);
  }, []);

  const confirmDelete = async () => {
    if (expenseToDelete !== null) {
      try {
        await operationalExpenseApi.deleteOperationalExpense(expenseToDelete);
        setOperationalExpenses((prevExpenses) => prevExpenses.filter((expense) => expense.id !== expenseToDelete));
        toast.success("Operational expense deleted successfully!");
        setShowDeleteModal(false);
        setExpenseToDelete(null);
      } catch (error: any) {
        const message = error?.message || 'Failed to delete operational expense';
        setDeleteErrorMessage(message);
        toast.error(message);
      }
    }
  };

  const cancelDelete = () => {
    setExpenseToDelete(null);
    setShowDeleteModal(false);
    setDeleteErrorMessage(null);
  };

  return (
    <>
      <PageHeader
        title="Operational Expenses"
        buttonVariant="primary"
        buttonLabel="Add New Expense"
        buttonLink="/operational-expenses/create"
      />
      <div className="container mt-4">
        <div className="card shadow-sm mb-3">
          <div className="card-body">
            <div className="row g-3 align-items-end">
              <div className="col-12 col-md-4">
                <label htmlFor="opExStartDate" className="form-label me-3 mb-0">Start Date</label>
                <DatePicker
                  id="opExStartDate"
                  selected={startDate ? new Date(startDate) : null}
                  onChange={(date: Date | null) => date && setStartDate(date.toISOString().slice(0, 10))}
                  maxDate={endDate ? new Date(endDate) : undefined}
                  className="form-control"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  dateFormat="dd-MM-yyyy"
                />
              </div>
              <div className="col-12 col-md-4">
                <label htmlFor="opExEndDate" className="form-label me-3 mb-0">End Date</label>
                <DatePicker
                  id="opExEndDate"
                  selected={endDate ? new Date(endDate) : null}
                  onChange={(date: Date | null) => date && setEndDate(date.toISOString().slice(0, 10))}
                  minDate={startDate ? new Date(startDate) : undefined}
                  maxDate={new Date()}
                  className="form-control"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  dateFormat="dd-MM-yyyy"
                />
              </div>
              <div className="col-md-4 d-flex justify-content-center justify-content-md-end">
                <button
                  className="btn btn-primary mb-2"
                  onClick={handleFetchClick}
                  disabled={loading}
                >
                  {loading ? 'Fetching...' : 'Fetch Expenses'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <ErrorBoundary>
          <OperationalExpensesTable
            expenses={operationalExpenses}
            loading={loading}
            error={error}
            onDelete={handleDelete}
          />
        </ErrorBoundary>

        <Modal show={showDeleteModal} onHide={cancelDelete}>
          <Modal.Header closeButton>
            <Modal.Title>Confirm Delete</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {deleteErrorMessage ? (
              <div className="text-danger mb-3">{deleteErrorMessage}</div>
            ) : (
              "Are you sure you want to delete this operational expense?"
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={cancelDelete}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Delete
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </>
  );
};

export default OperationalExpensesIndexPage;