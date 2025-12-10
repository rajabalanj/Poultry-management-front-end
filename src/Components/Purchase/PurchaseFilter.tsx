// src/Components/Purchase/PurchaseFilter.tsx
import React from 'react';
import CustomDatePicker from '../Common/CustomDatePicker';
import { BusinessPartner } from '../../types/BusinessPartner';
import { PurchaseOrderStatus } from '../../types/PurchaseOrder';

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

const PurchaseFilter: React.FC<PurchaseFilterProps> = ({ vendors, filters, setFilters }) => {
  return (
    <div className="card shadow-sm mb-4 p-3">
      <h5 className="mb-3">Filter Purchases</h5>
      <div className="row g-3">
        <div className="col-md-3">
          <label htmlFor="vendorFilter" className="form-label">Vendor:</label>
          <select
            id="vendorFilter"
            className="form-select"
            value={filters.vendorId}
            onChange={(e) => setFilters.setVendorId(Number(e.target.value) || '')}
          >
            <option value="">All Vendors</option>
            {vendors.map((vendor) => (
              <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
            ))}
          </select>
        </div>
        <div className="col-md-3">
          <label htmlFor="statusFilter" className="form-label">Status:</label>
          <select
            id="statusFilter"
            className="form-select"
            value={filters.status}
            onChange={(e) => setFilters.setStatus(e.target.value as PurchaseOrderStatus | '')}
          >
            <option value="">All Statuses</option>
            {Object.values(PurchaseOrderStatus).map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
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
