// src/Components/Purchase/PurchaseFilter.tsx
import React from 'react';
import CustomDatePicker from '../Common/CustomDatePicker';
import { BusinessPartner } from '../../types/BusinessPartner';
import { PurchaseOrderStatus } from '../../types/PurchaseOrder';
import StyledSelect from '../Common/StyledSelect';

interface PurchaseFilterProps {
  vendors: BusinessPartner[];
  filters: {
    vendorId: number | '';
    status: PurchaseOrderStatus | '';
    startDate: Date | null;
    endDate: Date | null;
  };
  setFilters: {
    setVendorId: (value: number | '') => void;
    setStatus: (value: PurchaseOrderStatus | '') => void;
    setStartDate: (value: Date | null) => void;
    setEndDate: (value: Date | null) => void;
  };
}

type OptionType = { value: number | string; label: string };

const PurchaseFilter: React.FC<PurchaseFilterProps> = ({ vendors, filters, setFilters }) => {

  const vendorOptions: OptionType[] = [
    { value: '', label: 'All Vendors' },
    ...vendors.map((vendor) => ({
      value: vendor.id,
      label: vendor.name,
    })),
  ];
  const selectedVendorOption = vendorOptions.find(option => option.value === filters.vendorId);

  const statusOptions: OptionType[] = [
    { value: '', label: 'All Statuses' },
    ...Object.values(PurchaseOrderStatus).map((status) => ({
      value: status,
      label: status,
    })),
  ];
  const selectedStatusOption = statusOptions.find(option => option.value === filters.status);

  return (
    <div className="card shadow-sm mb-4 p-3">
      <h5 className="mb-3">Filter Purchases</h5>
      <div className="row g-3">
        <div className="col-md-3">
          <label htmlFor="vendorFilter" className="form-label">Vendor:</label>
          <StyledSelect
            id="vendorFilter"
            className="form-select"
            value={selectedVendorOption}
            onChange={(option, _action) => setFilters.setVendorId(option ? Number(option.value) : '')}
            options={vendorOptions}
            placeholder="All Vendors"
          />
        </div>
        <div className="col-md-3">
          <label htmlFor="statusFilter" className="form-label">Status:</label>
          <StyledSelect
            id="statusFilter"
            className="form-select"
            value={selectedStatusOption}
            onChange={(option, _action) => setFilters.setStatus(option ? (option.value as PurchaseOrderStatus) : '')}
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

export default PurchaseFilter;
