// src/components/PurchaseOrder/PurchaseOrderIndex.tsx
import React, { useCallback, useEffect, useState } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import PageHeader from "../Layout/PageHeader";
import { Modal, Button } from "react-bootstrap";
import { purchaseOrderApi, vendorApi } from "../../services/api";
import { PurchaseOrderResponse, PurchaseOrderStatus } from "../../types/PurchaseOrder";
import { VendorResponse } from "../../types/Vendor";
import { toast } from 'react-toastify';
import PurchaseOrderTable from "./PurchaseOrderTable";
import DatePicker from 'react-datepicker';
import { useNavigate } from "react-router-dom"; // Import useNavigate

const PurchaseOrderIndexPage: React.FC = () => {
  const navigate = useNavigate(); // Initialize useNavigate
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderResponse[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [poToDelete, setPoToDelete] = useState<number | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);
  const [vendors, setVendors] = useState<VendorResponse[]>([]);
  const [filterVendorId, setFilterVendorId] = useState<number | ''>('');
  const [filterStatus, setFilterStatus] = useState<PurchaseOrderStatus | ''>('');
  const [filterStartDate, setFilterStartDate] = useState<Date | null>(null);
  const [filterEndDate, setFilterEndDate] = useState<Date | null>(null);

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const response = await vendorApi.getVendors();
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
          filterStartDate ? filterStartDate.toISOString().split('T')[0] : undefined,
          filterEndDate ? filterEndDate.toISOString().split('T')[0] : undefined
        );
        setPurchaseOrders(response);
      } catch (error: any) {
        setError(error?.message || 'Failed to fetch purchase order list');
        toast.error(error?.message || 'Failed to fetch purchase order list');
      } finally {
        setLoading(false);
      }
    };
    fetchPurchaseOrderList();
  }, [filterVendorId, filterStatus, filterStartDate, filterEndDate]);

  const handleDelete = useCallback((id: number) => {
    setPoToDelete(id);
    setDeleteErrorMessage(null);
    setShowDeleteModal(true);
  }, []);

  const handleAddPayment = useCallback((id: number) => {
    navigate(`/purchase-orders/${id}/add-payment`);
  }, [navigate]);

  const confirmDelete = async () => {
    if (poToDelete !== null) {
      try {
        await purchaseOrderApi.deletePurchaseOrder(poToDelete);
        setPurchaseOrders((prevPOs) => prevPOs.filter((po) => po.id !== poToDelete));
        toast.success("Purchase order deleted successfully!");
      } catch (error: any) {
        const message = error?.message || 'Failed to delete purchase order';
        setDeleteErrorMessage(message);
        toast.error(message);
      } finally {
        if (!deleteErrorMessage) {
          setPoToDelete(null);
          setShowDeleteModal(false);
        }
      }
    }
  };

  const cancelDelete = () => {
    setPoToDelete(null);
    setShowDeleteModal(false);
    setDeleteErrorMessage(null);
  };

  return (
    <>
      <PageHeader
        title="Purchase Orders"
        buttonVariant="primary"
        buttonLabel="Create New PO"
        buttonLink="/purchase-orders/create"
      />
      <div className="container mt-4">
        <div className="card shadow-sm mb-4 p-3">
          <h5 className="mb-3">Filter Purchase Orders</h5>
          <div className="row g-3">
            <div className="col-md-4">
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
            <div className="col-md-4">
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
            <div className="col-md-4">
              <label htmlFor="startDateFilter" className="form-label">Start Date:</label>
              <DatePicker
                selected={filterStartDate}
                onChange={(date: Date | null) => setFilterStartDate(date)}
                dateFormat="yyyy-MM-dd"
                className="form-control"
                placeholderText="Select start date"
                isClearable
              />
            </div>
            <div className="col-md-4">
              <label htmlFor="endDateFilter" className="form-label">End Date:</label>
              <DatePicker
                selected={filterEndDate}
                onChange={(date: Date | null) => setFilterEndDate(date)}
                dateFormat="yyyy-MM-dd"
                className="form-control"
                placeholderText="Select end date"
                isClearable
              />
            </div>
          </div>
        </div>

        <PurchaseOrderTable
          purchaseOrders={purchaseOrders}
          loading={loading}
          error={error}
          onDelete={handleDelete}
          vendors={vendors} // Pass vendors to PurchaseOrderTable
          onAddPayment={handleAddPayment} // Pass the new handler
        />
        <Modal show={showDeleteModal} onHide={cancelDelete}>
          <Modal.Header closeButton>
            <Modal.Title>Confirm Delete</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {deleteErrorMessage ? (
              <div className="text-danger mb-3">{deleteErrorMessage}</div>
            ) : (
              "Are you sure you want to delete this purchase order? This action cannot be undone if the PO is not in Draft or Cancelled status."
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
};

export default PurchaseOrderIndexPage;