import React from 'react';
import DatePicker from 'react-datepicker';
import { BusinessPartner } from '../../types/BusinessPartner';
import { SalesOrderStatus } from '../../types/SalesOrder';

interface SalesFilterProps {
  customers: BusinessPartner[];
  filters: {
    customerId: number | '';
    status: SalesOrderStatus | '';
    startDate: Date | null;
    endDate: Date | null;
  };
  setFilters: {
    setCustomerId: (value: number | '') => void;
    setStatus: (value: SalesOrderStatus | '') => void;
    setStartDate: (value: Date | null) => void;
    setEndDate: (value: Date | null) => void;
  };
}

const SalesFilter: React.FC<SalesFilterProps> = ({ customers, filters, setFilters }) => {
  return (
    <div className="card shadow-sm mb-4 p-3">
      <h5 className="mb-3">Filter Sales</h5>
      <div className="row g-3">
        <div className="col-md-3">
          <label htmlFor="customerFilter" className="form-label">Customer:</label>
          <select
            id="customerFilter"
            className="form-select"
            value={filters.customerId}
            onChange={(e) => setFilters.setCustomerId(Number(e.target.value) || '')}
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
            value={filters.status}
            onChange={(e) => setFilters.setStatus(e.target.value as SalesOrderStatus | '')}
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
              selected={filters.startDate}
              onChange={(date: Date | null) => setFilters.setStartDate(date)}
              className="form-control"
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
              popperPlacement="bottom-start"
              dateFormat="dd-MM-yyyy"
              placeholderText="Select start date"
              isClearable={true}
              maxDate={filters.endDate ?? undefined}
            />
          </div>
        </div>
        <div className="col-md-3">
          <label htmlFor="endDateFilter" className="form-label">End Date:</label>
          <div>
            <DatePicker
              selected={filters.endDate}
              onChange={(date: Date | null) => setFilters.setEndDate(date)}
              dateFormat="dd-MM-yyyy"
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
              popperPlacement="bottom-start"
              className="form-control"
              placeholderText="Select end date"
              isClearable
              minDate={filters.startDate ?? undefined}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesFilter;
