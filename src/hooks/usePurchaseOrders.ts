// src/hooks/usePurchaseOrders.ts

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { purchaseOrderApi, businessPartnerApi } from '../services/api';
import { PurchaseOrderResponse, PurchaseOrderStatus } from '../types/PurchaseOrder';
import { BusinessPartner } from '../types/BusinessPartner';
import { format } from 'date-fns';

export const usePurchaseOrders = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderResponse[]>([]);
  const [vendors, setVendors] = useState<BusinessPartner[]>([]);
  const [filterVendorId, setFilterVendorId] = useState<number | ''>('');
  const [filterStatus, setFilterStatus] = useState<PurchaseOrderStatus | ''>('');
  const [filterStartDate, setFilterStartDate] = useState<Date | null>(null);
  const [filterEndDate, setFilterEndDate] = useState<Date | null>(null);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [poToDelete, setPoToDelete] = useState<number | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);

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

  const fetchPurchaseOrderList = useCallback(async () => {
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
      const errorMessage = error?.message || 'Failed to fetch purchase order list';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filterVendorId, filterStatus, filterStartDate, filterEndDate]);

  useEffect(() => {
    fetchPurchaseOrderList();
  }, [fetchPurchaseOrderList]);

  const handleDelete = useCallback((id: number) => {
    setPoToDelete(id);
    setDeleteErrorMessage(null);
    setShowDeleteModal(true);
  }, []);

  const confirmDelete = async () => {
    if (poToDelete !== null) {
      try {
        await purchaseOrderApi.deletePurchaseOrder(poToDelete);
        setPurchaseOrders((prevPOs) => prevPOs.filter((po) => po.id !== poToDelete));
        toast.success("Purchase order deleted successfully!");
        setShowDeleteModal(false);
        setPoToDelete(null);
      } catch (error: any) {
        const message = error?.message || 'Failed to delete purchase order';
        setDeleteErrorMessage(message);
        toast.error(message);
      }
    }
  };

  const cancelDelete = () => {
    setPoToDelete(null);
    setShowDeleteModal(false);
    setDeleteErrorMessage(null);
  };

  const handleAddPayment = useCallback((id: number) => {
    navigate(`/purchase-orders/${id}/add-payment`);
  }, [navigate]);

  return {
    loading,
    error,
    purchaseOrders,
    vendors,
    filters: {
      vendorId: filterVendorId,
      status: filterStatus,
      startDate: filterStartDate,
      endDate: filterEndDate,
    },
    setFilters: {
      setVendorId: setFilterVendorId,
      setStatus: setFilterStatus,
      setStartDate: setFilterStartDate,
      setEndDate: setFilterEndDate,
    },
    deleteModal: {
      show: showDeleteModal,
      errorMessage: deleteErrorMessage,
      handleDelete,
      confirmDelete,
      cancelDelete,
    },
    handleAddPayment,
    refresh: fetchPurchaseOrderList,
  };
};
