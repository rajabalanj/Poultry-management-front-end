// src/components/InventoryItem/InventoryItemIndex.tsx
import React, { useCallback, useEffect, useState } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import PageHeader from "../Layout/PageHeader"; // Adjust path if necessary
import { Modal, Button } from "react-bootstrap";
import { inventoryItemApi } from "../../services/api"; // Import the new inventoryItemApi
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
    fetchInventoryItemList();
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
          <label htmlFor="categoryFilter" className="form-label">Filter by Category:</label>
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

        <InventoryItemTable
          items={inventoryItems}
          loading={loading}
          error={error}
          onDelete={handleDelete}
        />
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