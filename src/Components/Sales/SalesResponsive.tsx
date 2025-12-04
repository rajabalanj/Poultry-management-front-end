import React, { useCallback, useEffect, useState } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import PageHeader from "../Layout/PageHeader";
import { Modal, Button } from "react-bootstrap";
import { salesOrderApi, businessPartnerApi } from "../../services/api";
import { SalesOrderResponse, SalesOrderStatus } from "../../types/SalesOrder";
import { BusinessPartner } from "../../types/BusinessPartner";
import { toast } from 'react-toastify';
import SalesOrderTable from "../SalesOrder/SalesOrderTable";
import SalesReportTable from "../Reports/SalesReportsTable";
import DatePicker from 'react-datepicker';
import { format } from 'date-fns';
import { useNavigate } from "react-router-dom";
import { useMediaQuery } from 'react-responsive';

const SalesResponsive: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [salesOrders, setSalesOrders] = useState<SalesOrderResponse[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [soToDelete, setSoToDelete] = useState<number | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);
  const [customers, setCustomers] = useState<BusinessPartner[]>([]);
  const [filterCustomerId, setFilterCustomerId] = useState<number | ''>('');
  const [filterStatus, setFilterStatus] = useState<SalesOrderStatus | ''>('');
  const [filterStartDate, setFilterStartDate] = useState<Date | null>(null);
  const [filterEndDate, setFilterEndDate] = useState<Date | null>(null);

  // Determine if the view should be mobile or desktop
  const isMobile = useMediaQuery({ maxWidth: 768 });
  const isDesktop = useMediaQuery({ minWidth: 769 });

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await businessPartnerApi.getCustomers();
        setCustomers(response);
      } catch (error: any) {
        console.error("Failed to fetch customers for filter:", error);
      }
    };
    fetchCustomers();
  }, []);

  useEffect(() => {
    const fetchSalesOrderList = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await salesOrderApi.getSalesOrders(
          0,
          100,
          filterCustomerId === '' ? undefined : filterCustomerId,
          filterStatus === '' ? undefined : filterStatus,
          filterStartDate ? format(filterStartDate, 'yyyy-MM-dd') : undefined,
          filterEndDate ? format(filterEndDate, 'yyyy-MM-dd') : undefined,
        );
        setSalesOrders(response);
      } catch (error: any) {
        setError(error?.message || 'Failed to fetch sales order list');
        toast.error(error?.message || 'Failed to fetch sales order list');
      } finally {
        setLoading(false);
      }
    };
    fetchSalesOrderList();
  }, [filterCustomerId, filterStatus, filterStartDate, filterEndDate]);

  const handleDelete = useCallback((id: number) => {
    setSoToDelete(id);
    setDeleteErrorMessage(null);
    setShowDeleteModal(true);
  }, []);

  const handleAddPayment = useCallback((id: number) => {
    navigate(`/sales-orders/${id}/add-payment`);
  }, [navigate]);

  const confirmDelete = async () => {
    if (soToDelete !== null) {
      try {
        await salesOrderApi.deleteSalesOrder(soToDelete);
        setSalesOrders((prevSOs) => prevSOs.filter((so) => so.id !== soToDelete));
        toast.success("Sales order deleted successfully!");
      } catch (error: any) {
        const message = error?.message || 'Failed to delete sales order';
        setDeleteErrorMessage(message);
        toast.error(message);
      } finally {
        if (!deleteErrorMessage) {
          setSoToDelete(null);
          setShowDeleteModal(false);
        }
      }
    }
  };

  const cancelDelete = () => {
    setSoToDelete(null);
    setShowDeleteModal(false);
    setDeleteErrorMessage(null);
  };

  // Render different content based on screen size
  const renderContent = () => {
    if (isMobile) {
      // Mobile view - show SalesOrderIndex
      return (
        <>
          <PageHeader
            title="Sales"
            buttonVariant="primary"
            buttonLabel="Create New"
            buttonLink="/sales-orders/create"
          />
          <div className="container mt-4">
            <div className="card shadow-sm mb-4 p-3">
              <h5 className="mb-3">Filter Sales</h5>
              <div className="row g-3">
                <div className="col-md-3">
                  <label htmlFor="customerFilter" className="form-label">Customer:</label>
                  <select
                    id="customerFilter"
                    className="form-select"
                    value={filterCustomerId}
                    onChange={(e) => setFilterCustomerId(Number(e.target.value) || '')}
                  >
                    <option value="">All Customers</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>{customer.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3">
                  <label htmlFor="statusFilter" className="form-label">Status:</label>
                  <select
                    id="statusFilter"
                    className="form-select"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as SalesOrderStatus | '')}
                  >
                    <option value="">All Statuses</option>
                    {Object.values(SalesOrderStatus).map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3">
                  <label htmlFor="startDateFilter" className="form-label">Start Date:</label>
                  <div>
                  <DatePicker
                    selected={filterStartDate}
                    onChange={(date: Date | null) => setFilterStartDate(date)}
                    className="form-control"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    popperPlacement="bottom-start"
                    dateFormat="dd-MM-yyyy"
                    placeholderText="Select start date"
                    isClearable={true}
                    maxDate={filterEndDate ?? undefined}
                />
                  </div>
                </div>
                <div className="col-md-3">
                  <label htmlFor="endDateFilter" className="form-label">End Date:</label>
                  <div>
                  <DatePicker
                    selected={filterEndDate}
                    onChange={(date: Date | null) => setFilterEndDate(date)}
                    dateFormat="dd-MM-yyyy"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    popperPlacement="bottom-start"
                    className="form-control"
                    placeholderText="Select end date"
                    isClearable
                    minDate={filterStartDate ?? undefined}
                  />
                  </div>
                </div>
              </div>
            </div>

            <SalesOrderTable
              salesOrders={salesOrders}
              loading={loading}
              error={error}
              onDelete={handleDelete}
              customers={customers}
              onAddPayment={handleAddPayment}
            />
            <Modal show={showDeleteModal} onHide={cancelDelete}>
              <Modal.Header closeButton>
                <Modal.Title>Confirm Delete</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                {deleteErrorMessage ? (
                  <div className="text-danger mb-3">{deleteErrorMessage}</div>
                ) : (
                  "Are you sure you want to delete this sales? This action cannot be undone."
                )}
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={cancelDelete}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={confirmDelete} disabled={!!deleteErrorMessage}>
                  Delete
                </Button>
              </Modal.Footer>
            </Modal>
          </div>
        </>
      );
    } else if (isDesktop) {
      // Desktop view - show SalesReports
      return (
        <>
          <PageHeader
            title="Sales Reports"
            buttonVariant="primary"
            buttonLabel="Create New"
            buttonLink="/sales-orders/create"
            buttonIcon="bi-plus-lg"
          />
          <div className="container mt-4">
            <div className="card shadow-sm mb-4 p-3">
              <h5 className="mb-3">Filter Sales</h5>
              <div className="row g-3">
                <div className="col-md-3">
                  <label htmlFor="customerFilter" className="form-label">Customer:</label>
                  <select
                    id="customerFilter"
                    className="form-select"
                    value={filterCustomerId}
                    onChange={(e) => setFilterCustomerId(Number(e.target.value) || '')}
                  >
                    <option value="">All Customers</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>{customer.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3">
                  <label htmlFor="statusFilter" className="form-label">Status:</label>
                  <select
                    id="statusFilter"
                    className="form-select"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as SalesOrderStatus | '')}
                  >
                    <option value="">All Statuses</option>
                    {Object.values(SalesOrderStatus).map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3">
                  <label htmlFor="startDateFilter" className="form-label">Start Date:</label>
                  <div>
                  <DatePicker
                    selected={filterStartDate}
                    onChange={(date: Date | null) => setFilterStartDate(date)}
                    className="form-control"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    popperPlacement="bottom-start"
                    dateFormat="dd-MM-yyyy"
                    placeholderText="Select start date"
                    isClearable={true}
                    maxDate={filterEndDate ?? undefined}
                />
                  </div>
                </div>
                <div className="col-md-3">
                  <label htmlFor="endDateFilter" className="form-label">End Date:</label>
                  <div>
                  <DatePicker
                    selected={filterEndDate}
                    onChange={(date: Date | null) => setFilterEndDate(date)}
                    dateFormat="dd-MM-yyyy"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    popperPlacement="bottom-start"
                    className="form-control"
                    placeholderText="Select end date"
                    isClearable
                    minDate={filterStartDate ?? undefined}
                  />
                  </div>
                </div>
              </div>
            </div>

            <SalesReportTable
              salesOrders={salesOrders}
              loading={loading}
              error={error}
              customers={customers}
            />
          </div>
        </>
      );
    }
    return null; // Default fallback
  };

  return (
    <>
      {renderContent()}
    </>
  );
};

export default SalesResponsive;
