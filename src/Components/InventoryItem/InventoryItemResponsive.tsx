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
import CustomDatePicker from "../Common/CustomDatePicker";

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
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [stockData, setStockData] = useState<Record<number, { stock: string; unit: string }>>({});
  const [loadingStock, setLoadingStock] = useState(false);

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

  const handleDateChange = async (date: Date | null) => {
    setSelectedDate(date);
    if (date) {
      setLoadingStock(true);
      setStockData({});
      const dateString = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      try {
        const stockPromises = inventoryItems.map(async (item) => {
          try {
            const data = await inventoryItemApi.getStockAtDate(item.id, dateString);
            return { id: item.id, stock: data.stock, unit: data.unit };
          } catch (error) {
            console.error(`Failed to fetch stock for item ${item.id}:`, error);
            return { id: item.id, stock: item.current_stock?.toString() || '0', unit: item.unit };
          }
        });
        const results = await Promise.all(stockPromises);
        const stockMap = results.reduce((acc, result) => {
          acc[result.id] = { stock: result.stock, unit: result.unit };
          return acc;
        }, {} as Record<number, { stock: string; unit: string }>);
        setStockData(stockMap);
      } catch (error) {
        console.error("Failed to fetch stock at date:", error);
        toast.error("Failed to fetch stock at date");
      } finally {
        setLoadingStock(false);
      }
    } else {
      setStockData({});
    }
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
            <div className="mb-4 d-flex gap-3 align-items-center flex-wrap">
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
              <div className={`d-flex align-items-center gap-2 p-2 rounded position-relative flex-wrap ${selectedDate ? 'bg-primary bg-opacity-10 border border-primary' : 'bg-light'}`}>
                <i className={`bi bi-calendar3 ${selectedDate ? 'text-primary' : 'text-secondary'}`}></i>
                <label htmlFor="stockDate" className="form-label mb-0 fw-semibold text-nowrap">Stock as of:</label>
                <CustomDatePicker
                  id="stockDate"
                  selected={selectedDate}
                  onChange={handleDateChange}
                  dateFormat="yyyy-MM-dd"
                  placeholderText="Select date"
                  isClearable={true}
                  className="form-control-sm"
                  popperPlacement="bottom"
                />
              </div>
            </div>
            {loadingStock && <div className="alert alert-info"><i className="bi bi-hourglass-split me-2"></i>Fetching stock data for selected date...</div>}

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
          <div className="mb-4 d-flex gap-3 align-items-center flex-wrap">
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
            <div className={`d-flex align-items-center gap-2 p-2 rounded position-relative flex-wrap ${selectedDate ? 'bg-primary bg-opacity-10 border border-primary' : 'bg-light'}`}>
              <i className={`bi bi-calendar3 ${selectedDate ? 'text-primary' : 'text-secondary'}`}></i>
              <label htmlFor="stockDate" className="form-label mb-0 fw-semibold text-nowrap">Stock as of:</label>
              <CustomDatePicker
                id="stockDate"
                selected={selectedDate}
                onChange={handleDateChange}
                dateFormat="yyyy-MM-dd"
                placeholderText="Select date"
                isClearable={true}
                className="form-control-sm"
                popperPlacement={isMobile ? "bottom" : "bottom-start"}
              />
            </div>
          </div>

          {loading && <div className="text-center py-4"><div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div></div>}
          {error && <div className="alert alert-danger text-center">{error}</div>}
          {!loading && !error && inventoryItems.length === 0 && <div className="alert alert-info text-center">No inventory items found</div>}
          {loadingStock && <div className="alert alert-info"><i className="bi bi-hourglass-split me-2"></i>Fetching stock data for selected date...</div>}

          {!loading && !error && inventoryItems.length > 0 && (
            <Table striped bordered hover responsive className="table-hover shadow-sm">
              <thead className="table-primary">
                <tr>
                  <th className="fw-bold">Name</th>
                  <th className="fw-bold">Category</th>
                  <th className="fw-bold">{selectedDate ? `Stock as of ${selectedDate.toISOString().split('T')[0]}` : 'Current Stock'}</th>
                  <th className="fw-bold">Reorder Level</th>
                  <th className="fw-bold">Status</th>
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
                    <td>
                      {(() => {
                        const stockInfo = stockData[item.id] || { stock: item.current_stock?.toString() || '0', unit: item.unit };
                        const displayStock = selectedDate ? stockInfo.stock : item.current_stock;
                        return loadingStock ? (
                          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        ) : (
                          <span className="d-flex align-items-center gap-2">
                            <span className="fw-semibold">{displayStock}</span>
                            <Badge bg="light" text="dark" className="border">{stockInfo.unit}</Badge>
                          </span>
                        );
                      })()}
                    </td>
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
