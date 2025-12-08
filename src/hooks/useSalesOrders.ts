// src/hooks/useSalesOrders.ts

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { salesOrderApi, businessPartnerApi } from '../services/api';
import { SalesOrderResponse, SalesOrderStatus } from '../types/SalesOrder';
import { BusinessPartner } from '../types/BusinessPartner';
import { format } from 'date-fns';

export const useSalesOrders = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [salesOrders, setSalesOrders] = useState<SalesOrderResponse[]>([]);
  const [customers, setCustomers] = useState<BusinessPartner[]>([]);
  const [filterCustomerId, setFilterCustomerId] = useState<number | ''>('');
  const [filterStatus, setFilterStatus] = useState<SalesOrderStatus | ''>('');
  const [filterStartDate, setFilterStartDate] = useState<Date | null>(null);
  const [filterEndDate, setFilterEndDate] = useState<Date | null>(null);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [soToDelete, setSoToDelete] = useState<number | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);

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

  const fetchSalesOrderList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await salesOrderApi.getSalesOrders(
        0,
        100, // Maybe increase this limit
        filterCustomerId === '' ? undefined : filterCustomerId,
        filterStatus === '' ? undefined : filterStatus,
        filterStartDate ? format(filterStartDate, 'yyyy-MM-dd') : undefined,
        filterEndDate ? format(filterEndDate, 'yyyy-MM-dd') : undefined,
      );
      setSalesOrders(response);
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to fetch sales order list';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filterCustomerId, filterStatus, filterStartDate, filterEndDate]);

  useEffect(() => {
    fetchSalesOrderList();
  }, [fetchSalesOrderList]);

  const handleDelete = useCallback((id: number) => {
    setSoToDelete(id);
    setDeleteErrorMessage(null);
    setShowDeleteModal(true);
  }, []);
  
  const confirmDelete = async () => {
    if (soToDelete !== null) {
      try {
        await salesOrderApi.deleteSalesOrder(soToDelete);
        setSalesOrders((prevSOs) => prevSOs.filter((so) => so.id !== soToDelete));
        toast.success("Sales order deleted successfully!");
        setShowDeleteModal(false);
        setSoToDelete(null);
      } catch (error: any) {
        const message = error?.message || 'Failed to delete sales order';
        setDeleteErrorMessage(message);
        toast.error(message);
      }
    }
  };

  const cancelDelete = () => {
    setSoToDelete(null);
    setShowDeleteModal(false);
    setDeleteErrorMessage(null);
  };
  
  const handleAddPayment = useCallback((id: number) => {
    navigate(`/sales-orders/${id}/add-payment`);
  }, [navigate]);

  return {
    loading,
    error,
    salesOrders,
    customers,
    filters: {
      customerId: filterCustomerId,
      status: filterStatus,
      startDate: filterStartDate,
      endDate: filterEndDate,
    },
    setFilters: {
      setCustomerId: setFilterCustomerId,
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
    refresh: fetchSalesOrderList, // Expose a refresh function
  };
};
