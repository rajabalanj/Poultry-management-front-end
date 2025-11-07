// src/components/InventoryItem/InventoryItemDetails.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import PageHeader from "../Layout/PageHeader";
import { inventoryItemApi } from "../../services/api";
import { InventoryItemResponse } from "../../types/InventoryItem";
import InventoryItemAuditModal from "./InventoryItemAuditModal"; // Import the modal

const InventoryItemDetails: React.FC = () => {
  const { item_id } = useParams<{ item_id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<InventoryItemResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAuditModal, setShowAuditModal] = useState(false); // State for modal visibility

  useEffect(() => {
    const fetchItem = async () => {
      try {
        if (!item_id) {
            setError("Inventory Item ID is missing.");
            setLoading(false);
            return;
        }
        const data = await inventoryItemApi.getInventoryItem(Number(item_id));
        setItem(data);
      } catch (err: any) {
        console.error("Error fetching inventory item:", err);
        setError(err?.message || "Failed to load inventory item details.");
        toast.error(err?.message || "Failed to load inventory item details.");
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [item_id]);

  if (loading) return <div className="text-center mt-5">Loading item details...</div>;
  if (error) return <div className="text-center text-danger mt-5">{error}</div>;
  if (!item) return <div className="text-center mt-5">Inventory item not found or data is missing.</div>;

  return (
    <>
      <PageHeader title="Inventory Item Details" buttonVariant="secondary" buttonLabel="Back to List" buttonLink="/inventory-items" />
      <div className="container mt-4">
        <div className="card shadow-sm">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">Item Information: {item.name}</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6 mb-3">
                <strong>Item Name:</strong> {item.name}
              </div>
              <div className="col-md-6 mb-3">
                <strong>Unit:</strong> {item.unit}
              </div>
              <div className="col-md-6 mb-3">
                <strong>Category:</strong> {item.category}
              </div>
              <div className="col-md-6 mb-3">
                <strong>Current Stock:</strong> {item.current_stock}
              </div>
              <div className="col-md-6 mb-3">
                <strong>Average Cost:</strong> {item.average_cost}
              </div>
              <div className="col-md-6 mb-3">
                <strong>Created At:</strong> {new Date(item.created_at).toLocaleString()}
              </div>
              {item.updated_at && (
                <div className="col-md-6 mb-3">
                  <strong>Last Updated:</strong> {new Date(item.updated_at).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 d-flex justify-content-center gap-3">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate(`/inventory-items/${item_id}/edit`)}
          >
            <i className="bi bi-pencil-square me-1"></i>
            Edit
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this inventory item?')) {
                // Add delete functionality here
                inventoryItemApi.deleteInventoryItem(Number(item_id))
                  .then(() => {
                    toast.success('Inventory item deleted successfully');
                    navigate('/inventory-items');
                  })
                  .catch(err => {
                    toast.error('Failed to delete inventory item: ' + err.message);
                  });
              }
            }}
          >
            <i className="bi bi-trash me-1"></i>
            Delete
          </button>
          <button
            type="button"
            className="btn btn-info"
            onClick={() => setShowAuditModal(true)} // Open modal
          >
            Show Audit Trail
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate(-1)}
          >
            Back
          </button>
        </div>
      </div>

      {/* Audit Modal */}
      {item_id && <InventoryItemAuditModal
        show={showAuditModal}
        onHide={() => setShowAuditModal(false)}
        itemId={Number(item_id)}
      />}
    </>
  );
};

export default InventoryItemDetails;
