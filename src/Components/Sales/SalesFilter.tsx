import React from 'react';
import CustomDatePicker from '../Common/CustomDatePicker';
import { BusinessPartner } from '../../types/BusinessPartner';
import { SalesOrderStatus } from '../../types/SalesOrder';
import StyledSelect from '../Common/StyledSelect';

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

type OptionType = { value: number | string; label: string };

const SalesFilter: React.FC<SalesFilterProps> = ({ customers, filters, setFilters }) => {

  const customerOptions: OptionType[] = [
    { value: '', label: 'All Customers' },
    ...customers.map((customer) => ({
      value: customer.id,
      label: customer.name,
    })),
  ];
  const selectedCustomerOption = customerOptions.find(option => option.value === filters.customerId);

  const statusOptions: OptionType[] = [
    { value: '', label: 'All Statuses' },
    ...Object.values(SalesOrderStatus).map((status) => ({
      value: status,
      label: status,
    })),
  ];
  const selectedStatusOption = statusOptions.find(option => option.value === filters.status);


  return (
    <div className="card shadow-sm mb-4 p-3">
      <h5 className="mb-3">Filter Sales</h5>
      <div className="row g-3">
        <div className="col-md-3">
          <label htmlFor="customerFilter" className="form-label">Customer:</label>
          <StyledSelect
            id="customerFilter"
            className="form-select"
            value={selectedCustomerOption}
            onChange={(option, _action) => setFilters.setCustomerId(option ? Number(option.value) : '')}
            options={customerOptions}
            placeholder="All Customers"
          />
        </div>
        <div className="col-md-3">
          <label htmlFor="statusFilter" className="form-label">Status:</label>
          <StyledSelect
            id="statusFilter"
            className="form-select"
            value={selectedStatusOption}
            onChange={(option, _action) => setFilters.setStatus(option ? (option.value as SalesOrderStatus) : '')}
            options={statusOptions}
            placeholder="All Statuses"
          />
        </div>
        <div className="col-md-3">
          <label htmlFor="startDateFilter" className="form-label">Start Date:</label>
          <div>
            <CustomDatePicker
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
            <CustomDatePicker
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
