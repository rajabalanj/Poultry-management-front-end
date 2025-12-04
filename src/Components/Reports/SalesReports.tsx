
import React, { useEffect, useState } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import PageHeader from "../Layout/PageHeader";
import { salesOrderApi, businessPartnerApi } from "../../services/api";
import { SalesOrderResponse, SalesOrderStatus } from "../../types/SalesOrder";
import { BusinessPartner } from "../../types/BusinessPartner";
import { toast } from 'react-toastify';
import SalesReportTable from './SalesReportsTable';
import DatePicker from 'react-datepicker';
import { format } from 'date-fns';

const SalesReport: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [salesOrders, setSalesOrders] = useState<SalesOrderResponse[]>([]);
  const [customers, setCustomers] = useState<BusinessPartner[]>([]);
  const [filterCustomerId, setFilterCustomerId] = useState<number | ''>('');
  const [filterStatus, setFilterStatus] = useState<SalesOrderStatus | ''>('');
  const [filterStartDate, setFilterStartDate] = useState<Date | null>(null);
  const [filterEndDate, setFilterEndDate] = useState<Date | null>(null);
  

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
};

export default SalesReport;
