// src/components/InventoryItem/InventoryItemIndex.tsx
import React, { useCallback, useEffect, useState } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import PageHeader from "../Layout/PageHeader"; // Adjust path if necessary
import { Modal, Button } from "react-bootstrap";
import { inventoryItemApi, configApi } from "../../services/api"; // Import the new inventoryItemApi
import { InventoryItemResponse, InventoryItemCategory } from "../../types/InventoryItem";
import { toast } from 'react-toastify';
import InventoryItemTable from "./InventoryItemTable"; // Import the InventoryItemTable


const InventoryItemIndexPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inventoryItems, setInventoryItems] = useState<InventoryItemResponse[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null); // To show specific delete errors
  const [filterCategory, setFilterCategory] = useState<InventoryItemCategory | ''>(''); // State for category filter
  const [thresholds, setThresholds] = useState({
    lowKgThreshold: 3000,
    medicineLowKgThreshold: 3000,
  });

  // Effect to fetch inventory item list
  useEffect(() => {
    const fetchInventoryItemList = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await inventoryItemApi.getInventoryItems(0, 100, filterCategory || undefined);
        setInventoryItems(response);
      } catch (error: any) {
        setError(error?.message || 'Failed to fetch inventory item list');
        toast.error(error?.message || 'Failed to fetch inventory item list');
      } finally {
        setLoading(false);
      }
    };

    const fetchThresholds = async () => {
      try {
        const configs = await configApi.getAllConfigs();
        const lowKgThreshold = configs.find((c) => c.name === "lowKgThreshold");
        const medicineLowKgThreshold = configs.find((c) => c.name === "medicineLowKgThreshold");
        setThresholds({
          lowKgThreshold: lowKgThreshold ? Number(lowKgThreshold.value) : 3000,
          medicineLowKgThreshold: medicineLowKgThreshold ? Number(medicineLowKgThreshold.value) : 3000,
        });
      } catch (error) {
        console.error("Failed to fetch thresholds", error);
      }
    };

    fetchInventoryItemList();
    fetchThresholds();
  }, [filterCategory]); // Re-fetch when filterCategory changes

  const handleDelete = useCallback((id: number) => {
    setItemToDelete(id);
    setDeleteErrorMessage(null); // Clear previous error messages
    setShowDeleteModal(true);
  }, []);

  const confirmDelete = async () => {
    if (itemToDelete !== null) {
      try {
        await inventoryItemApi.deleteInventoryItem(itemToDelete);
        setInventoryItems((prevItems) => prevItems.filter((item) => item.id !== itemToDelete));
        toast.success("Inventory item deleted successfully!");
      } catch (error: any) {
        const message = error?.message || 'Failed to delete inventory item';
        setDeleteErrorMessage(message); // Set specific error message for modal
        toast.error(message);
      } finally {
        // Only close modal if no specific error message is displayed
        if (!deleteErrorMessage) {
            setItemToDelete(null);
            setShowDeleteModal(false);
        }
      }
    }
  };

  const cancelDelete = () => {
    setItemToDelete(null);
    setShowDeleteModal(false);
    setDeleteErrorMessage(null); // Clear error message on cancel
  };

  const groupedItems = inventoryItems.reduce((acc, item) => {
    const category = item.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<InventoryItemCategory, InventoryItemResponse[]>);

  return (
    <>
      <PageHeader
        title="Inventory Items"
        buttonVariant="primary"
        buttonLabel="Add New Item"
        buttonLink="/inventory-items/create"
      />
      <div className="container mt-4">
        {/* Filter Section */}
        <div className="mb-4">
          <select
            id="categoryFilter"
            className="form-select w-auto" // Added w-auto to make it take less width
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as InventoryItemCategory | '')}
          >
            <option value="">All Categories</option>
            {Object.values(InventoryItemCategory).map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        {Object.entries(groupedItems).map(([category, items]) => (
          <div key={category} className="mb-4">
            <h5 className="mb-3">{category}</h5>
            <InventoryItemTable
              items={items}
              loading={loading}
              error={error}
              onDelete={handleDelete}
              thresholds={thresholds}
            />
          </div>
        ))}

        <Modal show={showDeleteModal} onHide={cancelDelete}>
          <Modal.Header closeButton>
            <Modal.Title>Confirm Delete</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {deleteErrorMessage ? (
              <div className="text-danger mb-3">{deleteErrorMessage}</div>
            ) : (
              "Are you sure you want to delete this inventory item?"
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

export default InventoryItemIndexPage;