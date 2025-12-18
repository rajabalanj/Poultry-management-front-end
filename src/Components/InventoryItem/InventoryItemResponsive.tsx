// src/Components/InventoryItem/InventoryItemResponsive.tsx
import React, { useCallback, useEffect, useState } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import PageHeader from "../Layout/PageHeader";
import { Modal, Button, Table, Badge } from "react-bootstrap";
import { useMediaQuery } from 'react-responsive';
import { useNavigate } from 'react-router-dom';
import { inventoryItemApi, configApi } from "../../services/api";
import { InventoryItemResponse, InventoryItemCategory } from "../../types/InventoryItem";
import { toast } from 'react-toastify';
import InventoryItemCard from "./InventoryItemCard";
import StyledSelect from "../Common/StyledSelect";

const InventoryItemResponsive: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inventoryItems, setInventoryItems] = useState<InventoryItemResponse[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<InventoryItemCategory | ''>('');
  const [thresholds, setThresholds] = useState({
    lowKgThreshold: 3000,
    medicineLowKgThreshold: 3000,
  });
  const [inventoryValue, setInventoryValue] = useState<number | null>(null);

  const isMobile = useMediaQuery({ maxWidth: 768 });

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

    const fetchInventoryValue = async () => {
      try {
        const response = await inventoryItemApi.getInventoryValue();
        setInventoryValue(response.total_inventory_value);
      } catch (error) {
        console.error("Failed to fetch inventory value", error);
      }
    };

    fetchInventoryItemList();
    fetchThresholds();
    fetchInventoryValue();
  }, [filterCategory]);

  const handleDelete = useCallback((id: number) => {
    setItemToDelete(id);
    setDeleteErrorMessage(null);
    setShowDeleteModal(true);
  }, []);

  const confirmDelete = async () => {
    if (itemToDelete !== null) {
      try {
        await inventoryItemApi.deleteInventoryItem(itemToDelete);
        setInventoryItems((prevItems) => prevItems.filter((item) => item.id !== itemToDelete));
        toast.success("Inventory item deleted successfully!");
        setItemToDelete(null);
        setShowDeleteModal(false);
      } catch (error: any) {
        const message = error?.message || 'Failed to delete inventory item';
        setDeleteErrorMessage(message);
        toast.error(message);
      }
    }
  };

  const cancelDelete = () => {
    setItemToDelete(null);
    setShowDeleteModal(false);
    setDeleteErrorMessage(null);
  };

  const groupedItems = inventoryItems.reduce((acc, item) => {
    const category = item.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<InventoryItemCategory, InventoryItemResponse[]>);

  // Function to determine stock status
  const getStockStatus = (item: InventoryItemResponse) => {
    const currentStock = parseFloat(String(item.current_stock));
    const reorderLevel = item.reorder_level ? parseFloat(String(item.reorder_level)) : 0;

    if (reorderLevel > 0) {
      if (currentStock < reorderLevel) {
        return <Badge bg="danger">Low Stock</Badge>;
      }
    } else {
      if (item.category === InventoryItemCategory.FEED && currentStock < thresholds.lowKgThreshold) {
        return <Badge bg="danger">Low Stock</Badge>;
      }
      if (item.category === InventoryItemCategory.MEDICINE && currentStock < thresholds.medicineLowKgThreshold) {
        return <Badge bg="danger">Low Stock</Badge>;
      }
    }
    return <Badge bg="success">In Stock</Badge>;
  };

  const renderContent = () => {
    if (isMobile) {
      // Mobile view - Card view
      return (
        <>
          <PageHeader
            title="Inventory Items"
            buttonVariant="primary"
            buttonLabel="Add New Item"
            buttonLink="/inventory-items/create"
            buttonIcon="bi-plus-lg"
          />
          <div className="container mt-4">
            {/* Filter Section */}
            <div className="mb-4">
              <StyledSelect
                id="categoryFilter"
                className="w-auto"
                value={{ value: filterCategory, label: filterCategory || "All Categories" }}
                onChange={(option) => setFilterCategory(option ? option.value as InventoryItemCategory : '')}
                options={[
                  { value: "", label: "All Categories" },
                  ...Object.values(InventoryItemCategory).map((category) => ({
                    value: category,
                    label: category
                  }))
                ]}
                placeholder="Select Category"
                isClearable
              />
            </div>

            {Object.entries(groupedItems).map(([category, items]) => (
              <div key={category} className="mb-4">
                <h5 className="mb-3">{category}</h5>
                {items.map((item) => (
                  <InventoryItemCard
                    key={item.id}
                    item={item}
                    onView={(id) => navigate(`/inventory-items/${id}/details`)}
                    onEdit={(id) => navigate(`/inventory-items/${id}/edit`)}
                    onDelete={handleDelete}
                    thresholds={thresholds}
                  />
                ))}
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
    }

    // Desktop view - Table view
    return (
      <>
        <PageHeader
          title="Inventory Items"
          buttonVariant="primary"
          buttonLabel="Add New Item"
          buttonLink="/inventory-items/create"
          buttonIcon="bi-plus-lg"
        />
        <div className="container mt-4">
          {/* Filter Section */}
          <div className="mb-4">
            <StyledSelect
              id="categoryFilter"
              className="w-auto"
              value={{ value: filterCategory, label: filterCategory || "All Categories" }}
              onChange={(option) => setFilterCategory(option ? option.value as InventoryItemCategory : '')}
              options={[
                { value: "", label: "All Categories" },
                ...Object.values(InventoryItemCategory).map((category) => ({
                  value: category,
                  label: category
                }))
              ]}
              placeholder="Select Category"
              isClearable
            />
          </div>

          {loading && <div className="text-center">Loading inventory items...</div>}
          {error && <div className="text-center text-danger">{error}</div>}
          {!loading && !error && inventoryItems.length === 0 && <div className="text-center">No inventory items found</div>}

          {!loading && !error && inventoryItems.length > 0 && (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Unit</th>
                  <th>Current Stock</th>
                  <th>Reorder Level</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {inventoryItems.map((item) => (
                  <tr 
                    key={item.id} 
                    onClick={() => navigate(`/inventory-items/${item.id}/details`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>{item.name}</td>
                    <td>{item.category}</td>
                    <td>{item.unit}</td>
                    <td>{item.current_stock}</td>
                    <td>{item.reorder_level || 'N/A'}</td>
                    <td>{getStockStatus(item)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}

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

          <div className="mt-4">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Total Inventory Value</h5>
                {inventoryValue !== null ? (
                  <p className="card-text fs-4 fw-bold">
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(inventoryValue)}
                  </p>
                ) : (
                  <p className="card-text">Loading...</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  return <>{renderContent()}</>;
};

export default InventoryItemResponsive;
