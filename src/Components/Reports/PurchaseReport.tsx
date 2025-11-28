
import React, { useEffect, useState } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import PageHeader from "../Layout/PageHeader";
import { purchaseOrderApi, businessPartnerApi } from "../../services/api";
import { PurchaseOrderResponse, PurchaseOrderStatus } from "../../types/PurchaseOrder";
import { BusinessPartner } from "../../types/BusinessPartner";
import { toast } from 'react-toastify';
import PurchaseReportTable from "./PurchaseReportTable";
import DatePicker from 'react-datepicker';
import { format } from 'date-fns';

const PurchaseReport: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderResponse[]>([]);
  const [vendors, setVendors] = useState<BusinessPartner[]>([]);
  const [filterVendorId, setFilterVendorId] = useState<number | ''>('');
  const [filterStatus, setFilterStatus] = useState<PurchaseOrderStatus | ''>('');
  const [filterStartDate, setFilterStartDate] = useState<Date | null>(null);
  const [filterEndDate, setFilterEndDate] = useState<Date | null>(null);
  

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const response = await businessPartnerApi.getVendors();
        setVendors(response);
      } catch (error: any) {
        console.error("Failed to fetch vendors for filter:", error);
      }
    };
    fetchVendors();
  }, []);

  useEffect(() => {
    const fetchPurchaseOrderList = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await purchaseOrderApi.getPurchaseOrders(
          0,
          100,
          filterVendorId === '' ? undefined : filterVendorId,
          filterStatus === '' ? undefined : filterStatus,
          filterStartDate ? format(filterStartDate, 'yyyy-MM-dd') : undefined,
          filterEndDate ? format(filterEndDate, 'yyyy-MM-dd') : undefined,
          
        );
        setPurchaseOrders(response);
      } catch (error: any) {
        setError(error?.message || 'Failed to fetch Purchase list');
        toast.error(error?.message || 'Failed to fetch Purchase list');
      } finally {
        setLoading(false);
      }
    };
    fetchPurchaseOrderList();
  }, [filterVendorId, filterStatus, filterStartDate, filterEndDate]);

  return (
    <>
      <PageHeader
        title="Purchase Reports"
      />
      <div className="container mt-4">
        <div className="card shadow-sm mb-4 p-3">
          <h5 className="mb-3">Filter Purchase</h5>
          <div className="row g-3">
            <div className="col-md-3">
              <label htmlFor="vendorFilter" className="form-label">Vendor:</label>
              <select
                id="vendorFilter"
                className="form-select"
                value={filterVendorId}
                onChange={(e) => setFilterVendorId(Number(e.target.value) || '')}
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
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as PurchaseOrderStatus | '')}
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
              <DatePicker
                selected={filterStartDate}
                onChange={(date: Date | null) => setFilterStartDate(date)}
                className="form-control"
                placeholderText="Select start date"
                isClearable={true}
                dateFormat="dd-MM-yyyy"
                maxDate={filterEndDate ?? undefined}
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                popperPlacement="bottom-start"
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
                className="form-control"
                placeholderText="Select end date"
                isClearable
                minDate={filterStartDate ?? undefined}
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                popperPlacement="bottom-start"
              />
              </div>
            </div>
            
          </div>
        </div>

        <PurchaseReportTable
          purchaseOrders={purchaseOrders}
          loading={loading}
          error={error}
          vendors={vendors}
        />
      </div>
    </>
  );
};

export default PurchaseReport;
